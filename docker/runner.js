const fs = require("fs");

const steps = [];

function __snapshot(line, vars) {
  if (steps.length > 1000) throw new Error("Step limit reached");
  steps.push({ line, vars });
}

const filePath = process.argv[2] || "/app/user_code.js";
const code = fs.readFileSync(filePath, "utf8");

eval(code);

process.stdout.write(JSON.stringify(steps));
