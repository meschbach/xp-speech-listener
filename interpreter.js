/**
 * Primary Conversation Interpreter
 *
 * This module feeds off the primary speech to text interpreter to shunt commands into the system.
 */
const {spawnSync} = require("child_process");

class ConsoleTalkback {
	say(...what){
		console.log(...what);
	}
}

class OSXSpeechTalkback {
	say(what){
		console.log("OSX Talkback: ", what);
		spawnSync("say",[what]);
		console.log("Done.");
	}
}

/**
 *
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
 *
 */
class AttentiveMode {
	activate(interpreter){
		this.interpreter = interpreter;
		this.interpreter.talkback.say("Yes?");
	}

	interpret(command) {
		const words = command.text.split(" ");
		const keyword = words[0];
		const action = this.interpreter.keywords[keyword];
		if( action ){
			action(command, words, this.interpreter.talkback);
		} else {
			console.log("Unknown command.");
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
		this.keywords = {};
	}

	registerKeyword(keyword, interpreter){
		this.keywords[keyword] = interpreter;
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
	interpreter.registerKeyword("say", (cmd, parsed, talkback) => {
		const requested = parsed.splice(1);
		talkback.say(requested.join(" "));
	});
	return interpreter;
}

module.exports = {
	buildInterpreter
};
