/**
 * Reduces a given command to the proper intent via the Natural library with example phrases.
 */
const natural = require('natural');

class NaturalInterpreter {
	constructor() {
		this.classifier = new natural.BayesClassifier();
	}

	registerIntent( intent, cmd ){
		if( cmd.examples ){
			cmd.examples.forEach((e) => this.addExample(intent, e) );
		} else {
			throw new Error("Requires examples");
		}
		this.classifier.train();
	}

	addExample(intent, example){
		this.classifier.addDocument(example, intent);
	}

	infer(command) {
		const result = this.classifier.getClassifications(command);
	// console.log("nlp",result);
		return result[0].label;
	}

}

module.exports = {
	NaturalInterpreter
};
