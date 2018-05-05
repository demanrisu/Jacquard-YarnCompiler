'use strict';

import Commands from './commands';
import CompilerState from './compilerState';
import Pass1 from './pass1';
import * as Pass2 from './pass2';
import Pass3 from './pass3';
import Pass4 from './pass4';
import Pass5 from './pass5';

const privateProps = new WeakMap();

/**
 * Compiler configuration
 * @class CompilerConfig
 */
const defaultConfig = {
	/** Should the compiler insert a debug node if an unknown node was linked to.
	 * Defaults to true
	 * @type {boolean}
	 * @default true
	 *  @memberof CompilerConfig */
	errorIfNodeUndefined: true,
}

function resetState(privates) {
	privates.state.reset();
	privates.linkingRequired = true;
}

function addMessage(type, message) {
	const array = privateProps.get(this)[type];
	array.push(message);
}

function addWarning(message) { addMessage.call(this, "warnings", message); }

function addError(message) { addMessage.call(this, "errors", message); }

function checkNodeDefinition(name) {
	const privates = privateProps.get(this);

	const nodeExists = privates.compiledNodes[name] != null;
	const nodeWasBlank = privates.undefinedNodes[name] != null;
	if (!nodeExists) return;
	if (nodeExists && nodeWasBlank) return;
	this.addWarning(`${name} already existed, overwriting`);
}

/** Instance of this class are used to compile a yarn AST output by the YarnParser
 * @param {CompilerConfig} config the configuration for this compiler
 */
export class Compiler {
	constructor(config) {
		const privates = {
			config: Object.assign({}, defaultConfig),
		}

		privates.state = new CompilerState();

		privateProps.set(this, privates);
	}

	/** process the AST currently in the specified YarnParser
	 * @param {YarnParser} yarnParser 
	 * @return {boolean} if there was an error processing the nodes in this yarnparser
	 */
	process(yarnParser) {
		const privates = privateProps.get(this);
		const config = privates.config;
		const state = privates.state;
		const errorCount = state.errors.length;

		state.linkingRequired = true;

		// pass 1 and 2 - generate command lists and concatenate all nodes together;
		yarnParser.nodeNames.forEach((name) => {
			const yarnNode = yarnParser.nodeNamed(name);
			Pass2.add(state, Pass1(yarnNode));
		});
		Pass2.finish(state);

		Pass3(state);

		return state.errors.length != errorCount;
	}

	/** Link and finalize assembly of the bytecode ready for writing.
	 * (Passes 4, 5 and 6)
	 */
	assemble() {
		const state = privateProps.get(this).state;

		Pass4(state);
		Pass5(state);
	}

	writeBytecode(stream, debugStream, sourceMapStream) {

	}

	/** Reset the state of this Compiler
	 */
	reset() {
		resetState(privateProps.get(this))
	}
}

export {default as Commands} from './commands';
export {default as CompiledNode} from './compiledNode';