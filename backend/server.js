const express = require("express");
const { instrument } = require("../debugger/instrument");
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");

const PORT = Number(process.env.PORT || 3000);
const NODE_ENV = process.env.NODE_ENV || "development";
const MAX_CODE_SIZE = Number(process.env.MAX_CODE_SIZE || 50_000);
const EXEC_TIMEOUT_MS = Number(process.env.EXEC_TIMEOUT_MS || 5000);
const EXEC_MAX_BUFFER = Number(process.env.EXEC_MAX_BUFFER || 1024 * 1024);
const RUNNER_MODE = process.env.RUNNER_MODE || "process";
const RUNNER_IMAGE = process.env.RUNNER_IMAGE || "debugger-sandbox";
const PROCESS_RUNNER_PATH = path.resolve(__dirname, "../docker/runner.js");
const PROCESS_NODE_BINARY = process.env.PROCESS_NODE_BINARY || process.execPath;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.disable("x-powered-by");
app.use(
  express.json({
    limit: `${MAX_CODE_SIZE}b`,
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed"));
    },
  }),
);

const executionRateLimit = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  limit: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 60),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests" },
});

function runInDocker(tmpFile) {
  return execFileSync(
    "docker",
    [
      "run",
      "--rm",
      "--network",
      "none",
      "--memory=64m",
      "--cpus=0.5",
      "-v",
      `${tmpFile}:/app/user_code.js:ro`,
      RUNNER_IMAGE,
    ],
    {
      encoding: "utf8",
      timeout: EXEC_TIMEOUT_MS,
      maxBuffer: EXEC_MAX_BUFFER,
    },
  );
}

function runInProcess(tmpFile) {
  return execFileSync(PROCESS_NODE_BINARY, [PROCESS_RUNNER_PATH, tmpFile], {
    encoding: "utf8",
    timeout: EXEC_TIMEOUT_MS,
    maxBuffer: EXEC_MAX_BUFFER,
  });
}

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", mode: RUNNER_MODE, environment: NODE_ENV });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", mode: RUNNER_MODE, environment: NODE_ENV });
});

app.post("/api/run", executionRateLimit, (req, res) => {
  let tempDir;

  try {
    const { code } = req.body || {};

    if (typeof code !== "string") {
      return res.status(400).json({ error: "code must be a string" });
    }

    if (!code.trim()) {
      return res.status(400).json({ error: "code cannot be empty" });
    }

    if (Buffer.byteLength(code, "utf8") > MAX_CODE_SIZE) {
      return res.status(413).json({ error: "code size limit exceeded" });
    }

    const instrumented = instrument(code);

    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codechronicle-"));
    const tmpFile = path.join(tempDir, "user_code.js");
    fs.writeFileSync(tmpFile, instrumented, { encoding: "utf8", mode: 0o600 });

    const output = RUNNER_MODE === "docker" ? runInDocker(tmpFile) : runInProcess(tmpFile);
    const steps = JSON.parse(output);

    return res.status(200).json({ steps });
  } catch (error) {
    const message = error && typeof error.message === "string" ? error.message : "Unknown error";
    const isClientError =
      message.includes("Unexpected token") ||
      message.includes("Unexpected identifier") ||
      message.includes("Step limit reached");

    if (NODE_ENV !== "test") {
      console.error("Execution error:", message);
    }

    return res
      .status(isClientError ? 400 : 500)
      .json({ error: isClientError ? "Runtime error occurred" : "Internal server error" });
  } finally {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
