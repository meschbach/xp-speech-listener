/**
 * Application for providing an digital assistant via voice communication.
 */

const {main} = require("junk-bucket");
const mic = require('mic');

const {createDeepSpeechStream} = require("./deepspeech");
const {VADInterpreter} = require("./activation-vad");
const {ActivationGate} = require("./activation-gate");
const {buildInterpreter, InterpreterSink } = require("./interpreter");

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

	microphoneInput.pipe(activationInterpreter).pipe(activationGate).pipe(speechInterpreter).pipe(sink);

	microphone.start();
});
