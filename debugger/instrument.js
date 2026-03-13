const acorn = require('acorn');
const escodegen = require('escodegen');



function injectSnapshots(body) {
  const newBody = [];
  const variables = [];

  body.forEach(node => {

    // add this
    if (node.type === 'VariableDeclaration') {
      variables.push(node.declarations[0].id.name);
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
