function addConversers(interpreter){
	const cmd = (cmd, parsed, talkback) => {
		const requested = parsed.splice(1);
		talkback.say(requested.join(" "));
	};
	cmd.examples = ["say hello", "say goodbye", "say no", "say what are you doing", "say moo", "say yes please"];
	interpreter.registerIntent("say", cmd);
}

module.exports = {
	addConversers
};