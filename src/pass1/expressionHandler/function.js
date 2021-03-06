'use strict';

import { Expression } from 'jacquard-yarnparser';

import * as Commands from '../../commands';

function clean(list, expression, argIndex, count) {
	list.push({
		type: Commands.Names.ClearArguments,
		arg0: argIndex,
		arg1: count,
		location: expression.location,
	});		
}

function execAndClean(list, expression) {
	const command = {
		type: Commands.Names.FunctionReturn,
		name: expression.name,
		arg1: expression.args.length,
		location: expression.location,
	};

	list.push(command);

	for(let i = 0; i < expression.args.length; i++) {
		command[`arg${i + 2}`] = i;
	}

	clean(list, expression, 1, expression.args.length);
}

export default function handle(expression) {
	const list = this.currentCommandList;
	
	expression.args.forEach(arg => { handle.handleExpression.call(this, arg); });

	switch(expression.constructor) {
		case Expression.Function:
			execAndClean(list, expression);
			break;
		default: 
			console.error("Unknown function expression type");
	}
}
