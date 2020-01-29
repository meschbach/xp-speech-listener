# xp-speech

An experiment building a home-assistant like speech interpreter.  The speech to text section is heavily based on the
example within [DeepSpeech examples](https://github.com/mozilla/DeepSpeech-examples/tree/r0.6/nodejs_mic_vad_streaming)
however it expands tuning for an interpreter.  Then adds a summoned based single interaction interpreter behind the
speech-to-text.

## Running

After your typical `npm`/`yarn` and installing the two dependencies below you should be able to run the interpreter via:

> node test

### Dependencies

As far as I am aware there are two major dependencies not installed via your typical `npm`/`yarn` flow.

* [DeepSpeech models by Mozilla](https://github.com/mozilla/DeepSpeech/releases) which is used for the conversion of
speech into text for interpretation.
* [sox](http://sox.sourceforge.net/) is used to access the underlying sound system to get frames for interpretation.
You can find the [OSX binaries archive here](https://sourceforge.net/projects/sox/files/sox/14.4.2/),
which just need to be on your path when running.

## Speech Pipeline

The core audio processing pipeline works as follows:

* [sox](http://sox.sourceforge.net/) actively listens on the microphone to generate frames via [mic](https://github.com/ashishbajaj99/mic#readme)
* Frames are then feed into [node-vad](https://github.com/snirpo/node-vad) to detect the silence from speech.  Although
several frames of silence are stored due to _node-vad_ sometimes being late to the party.
* Speech is then buffered until several seconds of silence is encountered again.
* The speech segment is sent through [DeepSpeech](https://github.com/mozilla/DeepSpeech) for down sampling into text.
* Text from the speech is givne to the interpreter.  The interpreter is a mediator for the current state of the
conversation and contextual interpretation.  In practice it might be better to write a custom binding for something like
[NLP](https://github.com/axa-group/nlp.js) for the application to have more fluid conversations.

### Known Issues
* Words like `a` and `the` are easily misinterpreted.  This is why the summoning state only pays attention for the term
`computer`.
* Although reduction of the statement into an intent is a strategy, it is currently hardwired to use the first word as a
verb of the intent to be dispatched too.  I began implementing a Bayesian classifier via [natural](https://github.com/NaturalNode/natural)
however this has not been heavily tested yet.


## Future Features and Road Map

* Externalize conversation handlers
* Security Contexts for skills
  * Voice classifications for authentications
* Multidevice support:
  * Handling de-duplication of listeners
* Voice Activation
  * Better Voice vs Noise/background (i.e footsteps) 
  * Natural Timeout mechanism
  * seemless transition from Inactive to Attentive mode (i.e `hey computer, what is the weather` / activate and responds with weather)
* Intent Inference
  * Multi Intent inference (i.e `What time will Timothy come over, and what time is it now?`)