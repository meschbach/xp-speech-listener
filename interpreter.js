/**
 * Primary Conversation Interpreter
 *
 * This module feeds off the primary speech to text interpreter to shunt commands into the system.
 */
const {VerbInterpreter} = require("./intent-verb");
const {NaturalInterpreter} = require("./intent-natural");
const {Writable} = require("stream");
const {OSXSpeechTalkback} = require("./talkback-osx");

/**
 * Default implementation of the computer response
 */
class ConsoleTalkback {
	say(...what){
		console.log(...what);
	}
}

/**
 * This waits for the named device to activate
 */
class InactiveMode {
	interpret(command){
		const words = command.text.split(" ");
		if( words.length < 2 ){
			return false;
		}
		if( words[1] === "computer" ){
			console.log("Entering attentive mode");
			return new AttentiveMode();
		}
		return false;
	}
}

/**
 * Activates and dispatches a single command based on the first keyword.
 */
class AttentiveMode {
	activate(interpreter){
		this.interpreter = interpreter;
		this.interpreter.talkback.say("Yes?");
	}

	interpret(command) {
		const intentName = this.interpreter.intentReducer.infer(command.text);
		const intent = this.interpreter.intents[intentName];
		if( !intent ){
			this.interpreter.talkback.say("I don't know how to do that");
			console.warn("Intent not registered",{intent});
		} else {
			intent(command, command.text.split(" "), this.interpreter.talkback);
		}
		return new InactiveMode();
	}
}

/**
 * Mediator for interpreting human input into the system state.
 */
class Interpreter {
	constructor() {
		this.mode = new InactiveMode();
		// this.talkback = new ConsoleTalkback();
		this.talkback = new OSXSpeechTalkback();
		this.intents = {};
		this.intentReducer = new VerbInterpreter();
	}

	registerIntent(keyword, interpreter){
		this.intents[keyword] = interpreter;
		this.intentReducer.registerIntent(keyword, interpreter);
	}

	setMode(mode){
		if(this.mode.deactivate) this.mode.deactivate(this);
		this.mode = mode;
		if(this.mode.activate) this.mode.activate(this);
	}

	write(chunk){
		// console.log(chunk);
		const result = this.mode.interpret(chunk);
		if( !result ){ return; }
		this.setMode(result);
	}
}

function buildInterpreter(){
	const interpreter = new Interpreter();
	interpreter.intentReducer = new NaturalInterpreter();
	return interpreter;
}

class InterpreterSink extends Writable {
	constructor(interpreter) {
		super({objectMode: true, decodeStrings: false});
		this.interpreter = interpreter;
	}

	_write( chunk, encoding, callback){
		this.interpreter.write(chunk);
		callback();
	}
}

module.exports = {
	buildInterpreter,
	InterpreterSink
};
