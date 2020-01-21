/**
 * Primary Conversation Interpreter
 *
 * This module feeds off the primary speech to text interpreter to shunt commands into the system.
 */
const {spawnSync} = require("child_process");
const {VerbInterpreter} = require("./intent-verb");

/**
 * Default implementation of the computer response
 */
class ConsoleTalkback {
	say(...what){
		console.log(...what);
	}
}

/**
 * Uses the OSX command `say` to respond to the user
 */
class OSXSpeechTalkback {
	say(what){
		console.log("OSX Talkback: ", what);
		spawnSync("say",[what]);
		console.log("Done.");
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
		const result = this.mode.interpret(chunk);
		if( !result ){ return; }
		this.setMode(result);
	}
}

function buildInterpreter(){
	const interpreter = new Interpreter();
	const cmd = (cmd, parsed, talkback) => {
		const requested = parsed.splice(1);
		talkback.say(requested.join(" "));
	};
	cmd.examples = ["say hello", "say goodbye", "say no", "say what are you doing", "say moo", "say yes please"];
	interpreter.registerIntent("say", cmd);
	return interpreter;
}

module.exports = {
	buildInterpreter
};
