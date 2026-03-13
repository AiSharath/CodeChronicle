const acorn=require("acorn")


// ast.body.forEach((node, i) => {
//   console.log(`Statement ${i + 1}: type=${node.type}, line=${node.loc.start.line}`);
// });


// function walk(node) {
//   if (!node || typeof node !== 'object') return;

//   if (node.type) {
//     console.log(`${node.type} at line ${node.loc?.start.line}`);
//   }

//   for (const key in node) {
//     const child = node[key];
//     if (Array.isArray(child)) {
//       child.forEach(item => walk(item));
//     } else {
//       walk(child);
//     }
//   }
// }

// walk(ast);


const code = `let x = 5;`;
const ast = acorn.parse(code, { ecmaVersion: 2020, locations: true });
console.log(JSON.stringify(ast.body[0], null, 2));
