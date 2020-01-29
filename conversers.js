function addConversers(interpreter){
	const parrotConverser = (cmd, parsed, talkback) => {
		const requested = parsed.splice(1);
		talkback.say(requested.join(" "));
	};
	parrotConverser.examples = ["say hello", "say goodbye", "say no", "say what are you doing", "say moo", "say yes please"];
	interpreter.registerIntent("say", parrotConverser);

	const timeConverser = (cmd, parsed, talkback) => {
		const requested = parsed.splice(1);
		const hour = new Date().getHours();
		const minutes = new Date().getMinutes();
		const oh = minutes < 10 ? " O ": "";
		talkback.say ("the time is " +hour +" " +oh +minutes);
	};
	timeConverser.examples = ["what time is it","what is the current time","current time"];
	interpreter.registerIntent("time", timeConverser);

	const yearConverser = (cmd, parsed, talkback) => {
		const requested = parsed.splice(1);
		const year = new Date().getFullYear();
		talkback.say ("The year is " +year);
	};
	yearConverser.examples = ["what year is it","what is the year", "current year"];
	interpreter.registerIntent("year", yearConverser)
}

module.exports = {
	addConversers
};