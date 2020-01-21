/**
 * Reduces a given command to the proper intent via the Natural library with example phrases.
 */
const natural = require('natural');

class NaturalInterpreter {
	constructor() {
		this.classifier = new natural.BayesClassifier();
	}

	registerCommand( intent, cmd ){
		if( cmd.examples ){
			cmd.examples.forEach((e) => this.addExample(intent, e) );
		} else {
			throw new Error("Requires examples");
		}
	}

	addExample(intent, example){
		this.classifier.addDocument(example, intent);
	}

	reduceIntent(command) {
		return this.classifier.classify(command);
	}
}

module.exports = {
	NaturalInterpreter
};
