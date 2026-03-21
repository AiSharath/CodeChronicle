const acorn = require('acorn');
const escodegen = require('escodegen');

function makeSnapshot(line, variables) {
  return {
    type: 'ExpressionStatement',
    expression: {
      type: 'CallExpression',
      callee: { type: 'Identifier', name: '__snapshot' },
      arguments: [
        { type: 'Literal', value: line },
        {
          type: 'ObjectExpression',
          properties: variables.map(name => ({
            type: 'Property',
            kind: 'init',
            key: { type: 'Identifier', name: name },
            value: { type: 'Identifier', name: name }
          }))
        }
      ]
    }
  };
}

function injectSnapshots(body, variables = []) {
  const newBody = [];

  body.forEach(node => {

    if (node.type === 'VariableDeclaration') {
      variables.push(node.declarations[0].id.name);

      const init = node.declarations[0].init;

      // block body arrow function
      if (init && init.type === 'ArrowFunctionExpression' && init.body.type === 'BlockStatement') {
        const arrowVariables = init.params.map(param => param.name);
        init.body.body = injectSnapshots(init.body.body, arrowVariables);
      }

      // expression body arrow function
      if (init && init.type === 'ArrowFunctionExpression' && init.body.type !== 'BlockStatement') {
        const arrowVariables = init.params.map(param => param.name);
        const originalExpression = init.body;
        const snapshotCall = makeSnapshot(init.loc.start.line, arrowVariables);
        const returnStatement = {
          type: 'ReturnStatement',
          argument: originalExpression
        };
        init.body = {
          type: 'BlockStatement',
          body: [snapshotCall, returnStatement]
        };
        init.expression = false;
      }
    }

    if (node.type === 'IfStatement' && node.consequent.type === 'BlockStatement') {
      node.consequent.body = injectSnapshots(node.consequent.body, [...variables]);
    }

    if (node.type === 'ForStatement') {
      const loopVariables = [...variables];
      if (node.init && node.init.type === 'VariableDeclaration') {
        loopVariables.push(node.init.declarations[0].id.name);
      }
      if (node.body.type === 'BlockStatement') {
        node.body.body = injectSnapshots(node.body.body, loopVariables);
      }
    }

    if (node.type === 'WhileStatement') {
      const loopVariables = [...variables];
      if (node.body.type === 'BlockStatement') {
        node.body.body = injectSnapshots(node.body.body, loopVariables);
      }
    }

    if (node.type === 'FunctionDeclaration') {
      const functionVariables = node.params.map(param => param.name);
      if (node.body.type === 'BlockStatement') {
        node.body.body = injectSnapshots(node.body.body, functionVariables);
      }
    }

    const snapshotCall = makeSnapshot(node.loc.start.line, variables);

    if (node.type === 'ReturnStatement' || node.type === 'ForStatement' || node.type === 'WhileStatement') {
      newBody.push(snapshotCall);
      newBody.push(node);
    } else {
      newBody.push(node);
      newBody.push(snapshotCall);
    }
  });

  return newBody;
}

function instrument(code) {
  const ast = acorn.parse(code, { ecmaVersion: 2020, locations: true });
  ast.body = injectSnapshots(ast.body);
  return escodegen.generate(ast);
}

module.exports = { instrument };