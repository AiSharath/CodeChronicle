const acorn = require('acorn');
const code = `const add = (a, b) => a + b;`;
const ast = acorn.parse(code, { ecmaVersion: 2020, locations: true });
console.log(JSON.stringify(ast.body[0], null, 2));