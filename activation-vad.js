/**
 * VAD to stream semantics for detecting when someone is talking.
 */
const {Transform} = require("stream");
const VAD = require('node-vad');
const {SILENCE, VOICE} = require("./activation-gate");

class VADInterpreter extends Transform {
	constructor(options) {
		super({objectMode:true});
		this.vad = new VAD(VAD.Mode.AGGRESSIVE);
	}

	_write( frame, encoding, cb ){
		const start = Date.now();
		this.vad.processAudio( frame, 16000 ).then((event) => {
			const end = Date.now();
			const taken = end - start;
			switch (event) {
				case VAD.Event.SILENCE:
					this.emit("silence");
					this.push({
						type: SILENCE,
						frame,
						taken
					});
					break;
				case VAD.Event.VOICE:
					this.emit("voice");
					this.push({
						type: VOICE,
						frame,
						taken
					});
					break;
				default:
					throw new Error("VAD unknown state: " + event);
			}
			cb();
		});
	}
}

module.exports = {
	VADInterpreter
};
