'use strict';

import CompiledNode from './compiledNode';
import Commands from './commands';
import Pass1Compiler from './pass1';
import Pass2Compiler from './pass2';

const privateProps = new WeakMap();

/**
 * Compiler configuration
 * @class CompilerConfig
 */
const defaultConfig = {
	/** Should this compiler output a sourcemap. Defaults to false.
	 * @type {boolean}
	 * @default false
	 * @memberof CompilerConfig */
	sourceMap: false,
	/** Should this compiler output a text file containing information on the 
	 * compiled source. Defaults to false.
	 * @type {boolean}
	 * @default false
	 * @memberof CompilerConfig */
	debug: false,
	/** Should the compiler insert a debug node if an unknown node was linked to.
	 * Defaults to true
	 * @type {boolean}
	 * @default true
	 *  @memberof CompilerConfig */
	errorIfNodeUndefined: true,
}

function resetState(privates) {
	privates.errors = [];
	privates.warnings = [];
	privates.compiledNodes = {};
	privates.undefinedNodes = {};
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

		resetState(privates);

		privateProps.set(this, privates);
	}

	/** process the AST currently in the specified YarnParser
	 * @param {YarnParser} yarnParser 
	 * @return {boolean} if there was an error processing the nodes in this yarnparser
	 */
	process(yarnParser) {
		const privates = privateProps.get(this);
		const errorCount = privates.errors.length;

		privates.linkingRequired = true;

		// pass 1, basic statement unrolling
		yarnParser.nodeNames.forEach((name) => {
			const yarnNode = yarnParser.nodeNamed(name);
			const compiler = new Pass1Compiler();
			compiler.process(yarnNode.statements);
			privates.compiledNodes[name] = new CompiledNode({
				name: name,
				logicCommands: compiler.logicCommands,
				dialogSegments: compiler.dialogSegments,
			})
		});

		// pass 2, node & dialogsegment concatenation
		const pass2Compiler = new Pass2Compiler();
		yarnParser.nodeNames.forEach((name) => {
			const compiledNode = privates.compiledNodes[name];
			pass2Compiler.add(compiledNode);
		});
		pass2Compiler.finish();

		return privates.errors.length != errorCount;
	}

	/** Reset the state of this Compiler
	 */
	reset() {
		resetState(privateProps.get(this))
	}
}

export {default as Commands} from './commands';
export {default as CompiledNode} from './compiledNode';