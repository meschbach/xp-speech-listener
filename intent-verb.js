/**
 * Infers the intent based on the initial word within the phrase
 */

class VerbInterpreter {
	constructor() {}

	registerIntent(){}
	infer(phrase) {
		const verb = phrase.split(" ")[0];
		return verb;
	}
}

module.exports = {
	VerbInterpreter
};
