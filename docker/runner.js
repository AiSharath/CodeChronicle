const steps = [];

function __snapshot(line, vars) {
  if (steps.length > 1000) throw new Error('Step limit reached');
  steps.push({ line, vars });
}

const code = require('fs').readFileSync('/app/user_code.js', 'utf8');
eval(code);

process.stdout.write(JSON.stringify(steps));