const express = require('express');
const { instrument } = require('../debugger/instrument');

const app = express();
app.use(express.json());

app.post('/api/run', (req, res) => {
  const { code } = req.body;
  
  // step 1 - instrument the code
  const instrumented = instrument(code);
  console.log('Instrumented code:', instrumented);

  // step 2 - collect steps by running it
  const steps = [];

  function __snapshot(line, vars) {
    steps.push({ line, vars });
  }

  // step 3 - run the instrumented code
  eval(instrumented);

  // step 4 - send steps back
  res.json({ steps });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});