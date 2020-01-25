/**
 * Application for providing an digital assistant via voice communication.
 */

const {main} = require("junk-bucket");
const {delay, promiseEvent, parallel} = require("junk-bucket/future");
const mic = require('mic');

const {createDeepSpeechStream} = require("./deepspeech");
const {VADInterpreter} = require("./activation-vad");
const {ActivationGate} = require("./activation-gate");
const {buildInterpreter, InterpreterSink } = require("./interpreter");
const {OSXSpeechTalkback} = require("./talkback-osx");

function activationMonitor( out, interpreter ) {
	const deatch = [];
	function attach(event, str){
		const fn = () => out.write(str);
		interpreter.on(event, fn);
		deatch.push(() => gate.off(event,fn))
	}
	attach("voice", "=");
	attach("silence", ".");

	return function () {
		return deatch.forEach((fn) => fn());
	}
}

function activationGateMonitor( out, gate ){
	const deatch = [];
	function attach(event, str){
		const fn = () => out.write(str);
		gate.on(event, fn);
		deatch.push(() => gate.off(event,fn))
	}
	attach("voice.start", "[start]");
	attach("voice.end", "[end]");
	attach("voice", "v");
	attach("silence", "s");

	return function () {
		return deatch.forEach((fn) => fn());
	}
}

const {Transform, Writable} = require("stream");
class CapturingPassThrough extends Transform {
	constructor() {
		super({objectMode: true});
		this.buffers = [];
	}
	_transform(chunk, encoding, callback) {
		this.buffers.push(chunk);
		this.push(chunk);
		callback();
	}
}

class EventAdpater extends Writable {
	constructor(eventName = "written") {
		super({objectMode:true});
		this.eventName = eventName;
	}

	_write(chunk, encoding, callback) {
		this.emit(this.eventName, chunk);
		callback;
	}
}

class InterpreterTuning extends Transform {
	constructor(audioFrames) {
		super({objectMode:true});
		this.audioFrames = audioFrames;
		this.needsFrames = true;
	}

	_transform(chunk, encoding, callback) {
		if( this.needsFrames ){
			this.push({done: false, audioFrame: this.audioFrames});
		}
		this.needsFrames = chunk.done;
		this.push(chunk);
		callback();
	}
}

class RemovePrefixedWords extends Transform {
	constructor(count) {
		super({objectMode:true});
		this.count = count;
	}

	_transform(chunk, encoding, callback) {
		const words = chunk.text.split(" ");
		const text = words.slice(this.count).join(" ");
		const newChunk = Object.assign({},chunk,{text});
		this.push(newChunk);
		callback();
	}
}

main(async (logger) => {
	const microphone = mic({
		rate: '16000',
		channels: '1',
		debug: false,
		fileType: 'wav'
	});

	const output = process.stdout;
	const microphoneInput = microphone.getAudioStream();
	const activationInterpreter = new VADInterpreter();
	// activationMonitor(output, activationInterpreter);

	const activationGate = new ActivationGate();
	// activationGateMonitor(output, activationGate);

	const speechInterpreter = createDeepSpeechStream();
	// speechInterpreter.on("data", (d) => console.log("Speech", d));

	const interpreter = buildInterpreter();
	const sink = new InterpreterSink(interpreter);

	// Entities related to the capture buffer
	const captureBuffer = new CapturingPassThrough();
	const eventAdapter = new EventAdpater("sample");

	const talkback = new OSXSpeechTalkback();
	talkback.say("Hello!  I need to tune my hearing.");
	await delay(100);
	talkback.say("Please say 'Hello Computer'");
	microphoneInput
		.pipe(activationInterpreter)
		.pipe(activationGate)
		.pipe(captureBuffer)
		.pipe(speechInterpreter)
		.pipe(eventAdapter);
	microphone.start();
	const result = await promiseEvent(eventAdapter, "sample");
	microphone.pause();

	//Concatenate the audio frames
	const audioFrames = Buffer.concat(captureBuffer.buffers.map((f) => f.audioFrame));
	const injector = new InterpreterTuning(audioFrames);

	//Swap out buffer capture
	captureBuffer.unpipe(speechInterpreter);
	activationGate.unpipe(captureBuffer);
	activationGate.pipe(injector).pipe(speechInterpreter);

	//Attach the interpreter
	speechInterpreter.unpipe(eventAdapter);
	speechInterpreter.pipe(new RemovePrefixedWords(result.text.split(" ").length)).pipe(sink);

	//
	talkback.say("Excellent.  I will wait until you need me.  Just say 'Yo Computer' to get my attention.");
	microphone.resume();

});
