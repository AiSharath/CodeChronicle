const steps = [];

function __snapshot(line, vars) {
  steps.push({ line, vars });
}

// paste your instrumented code here
let x = 5;
__snapshot(2, { x: x });
let y = x + 2;
__snapshot(3, { x: x, y: y });

console.log(JSON.stringify(steps, null, 2));