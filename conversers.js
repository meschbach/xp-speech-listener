function addConversers(interpreter){
	const parrotConverser = (cmd, parsed, talkback) => {
		const requested = parsed.splice(1);
		talkback.say(requested.join(" "));
	};
	parrotConverser.examples = ["say hello", "say goodbye", "say no", "say what are you doing", "say moo", "say yes please"];
	interpreter.registerIntent("say", parrotConverser);
}

module.exports = {
	addConversers
};