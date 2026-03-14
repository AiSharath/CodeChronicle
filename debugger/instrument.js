const acorn = require('acorn');
const escodegen = require('escodegen');

function injectSnapshots(body, variables = []) {
  const newBody = [];

  body.forEach(node => {

    if (node.type === 'VariableDeclaration') {
      variables.push(node.declarations[0].id.name);
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

    const snapshotCall = {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: '__snapshot' },
        arguments: [
          { type: 'Literal', value: node.loc.start.line },
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

    newBody.push(node);
    newBody.push(snapshotCall);
  });
  
  return newBody;
}

function instrument(code) {
  const ast = acorn.parse(code, { ecmaVersion: 2020, locations: true });
  ast.body = injectSnapshots(ast.body);
  return escodegen.generate(ast);
}

module.exports = { instrument };