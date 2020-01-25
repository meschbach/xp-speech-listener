/**
 * Communicates groupings of voice based activation
 */

const {Transform} = require("stream");

const SILENCE = Symbol("Silence");
const VOICE = Symbol("Voice");

class ActivationGate extends Transform {
	constructor() {
		super({objectMode: true});
		this.silenceBuffers = [];
		this.keptSilenceFrames = 7;
		this.recordedChunks = 0;
		this.silenceThreshold = 200;
	}

	_write( annotatedFrame, encoding, cb ){
		const audioFrame = annotatedFrame.frame;
		switch(annotatedFrame.type) {
			case SILENCE:
				this.emit("silence");
				if( this.recordedChunks > 0 ){
					this.recordedChunks++;

					const now = Date.now();
					if( this.silenceStartedAt ) {
						const elapsed = now - this.silenceStartedAt;
						if( elapsed > this.silenceThreshold ){
							this.push({done: true, audioFrame});
							this.emit("voice.end");
							this.recordedChunks = 0;
							this.silenceStartedAt = null;
						}
					} else {
						this.push({done:false, audioFrame});
						this.silenceStartedAt = now;
					}
				} else {
					this.silenceBuffers.push(audioFrame);
					if( this.silenceBuffers.length >  this.keptSilenceFrames ){
						this.silenceBuffers.shift();
					}
				}
				break;
			case VOICE:
				this.silenceStartedAt = null;
				if( this.recordedChunks === 0 ){
					this.emit("voice.start");
				} else {
					this.emit("voice");
				}
				this.recordedChunks++;
				this.silenceBuffers.forEach((buffer) => this.push({done:false, audioFrame: buffer}));
				this.silenceBuffers = [];
				this.push({done: false, audioFrame});
				break;
			default:
				this.emit("error", new Error( "Unknown frame type " + frame.type ));
		}
		cb();
	}
}

module.exports = {
	SILENCE,
	VOICE,
	ActivationGate
};
