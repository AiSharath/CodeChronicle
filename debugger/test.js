const { instrument } = require('./instrument');

const result = instrument(`
let x = 5;
let y = x + 2;
`);

console.log(result);