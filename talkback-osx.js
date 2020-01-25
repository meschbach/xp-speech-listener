const {spawnSync} = require("child_process");

/**
 * Uses the OSX command `say` to respond to the user
 */
class OSXSpeechTalkback {
	say(what){
		console.log("OSX Talkback: ", what);
		spawnSync("say",[what]);
	}
}

module.exports = {
	OSXSpeechTalkback
};
