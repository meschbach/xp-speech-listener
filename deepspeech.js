/**
 * Speech to text conversion via the DeepSpeech library.
 */

const DeepSpeech = require('deepspeech');
const {Transform} = require("stream");

function createModel(modelDir, options) {
	let modelPath = modelDir + '/output_graph.pbmm';
	let lmPath = modelDir + '/lm.binary';
	let triePath = modelDir + '/trie';
	let model = new DeepSpeech.Model(modelPath, options.BEAM_WIDTH);
	model.enableDecoderWithLM(lmPath, triePath, options.LM_ALPHA, options.LM_BETA);
	return model;
}

class DeepSpeechTransform extends Transform {
	constructor( model ) {
		super({objectMode: true});
		this.model = model;
	}

	_write( {done, audioFrame}, encoding, callback ){
		const currentStream = this._ensureStream();
		this.recordedAudioLength += (audioFrame.length / 2) * (1 / 16000) * 1000;
		this.model.feedAudioContent(currentStream, audioFrame.slice(0, audioFrame.length / 2));
		if( done ){
			this._flush(callback);
		}else {
			callback();
		}
	}

	_flush(cb) {
		if( !this.currentStream ){ return cb(); }

		const start = Date.now();

		const metadata = this.model.finishStreamWithMetadata(this.currentStream);
		const confidence = metadata.confidence;
		const text = metadata.items.map((i) => i.character).join("");
		DeepSpeech.FreeMetadata(metadata);

		if (text === 'i' || text === 'a' || text === '') {
			//Apparently silence is interpreted as these two
		} else {
			const recogTime = Date.now() - start;
			const speechText = {
				confidence,
				text,
				recogTime,
				audioLength: Math.round(this.recordedAudioLength)
			};
			this.push(speechText);
		}
		this.currentStream = null;
		cb();
	}

	_initStream() {
		this.currentStream = this.model.createStream();
		this.recordedAudioLength = 0;
	}
	_ensureStream(){
		if( !this.currentStream ){
			this._initStream();
		}
		return this.currentStream;
	}
}

function createDeepSpeechStream(opts = {}){
	const { modelLocation, beamWidth= 4096, alpha = 0.75, beta = 1.85} = opts;
	const englishModel = createModel(modelLocation || process.env.DEEPSPEECH_MODEL, {
		BEAM_WIDTH: beamWidth,
		LM_ALPHA: alpha,
		LM_BETA: beta
	});
	return new DeepSpeechTransform(englishModel);
}

module.exports = {
	createDeepSpeechStream
};
