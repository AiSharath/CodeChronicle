const express = require("express");
const { instrument } = require("../debugger/instrument");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

app.post("/api/run", (req, res) => {
  try {
    const { code } = req.body;
    const instrumented = instrument(code);

    const tmpFile = path.join(__dirname, "temp_code.js");
    fs.writeFileSync(tmpFile, instrumented);

    const result = execSync(
      `docker run --rm --network none --memory="64m" --cpus="0.5" -v "${tmpFile}:/app/user_code.js" debugger-sandbox`,
      { timeout: 5000 },
    );

    fs.unlinkSync(tmpFile);

    const steps = JSON.parse(result.toString());
    res.json({ steps });
  } catch (err) {
    res.json({ error: "Runtime error occurred" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
