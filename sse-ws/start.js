const { spawn } = require("child_process");

const children = new Set();
let stopping = false;

function run(args) {
  const child = spawn(process.execPath, args, {
    cwd: __dirname,
    stdio: "inherit",
    env: process.env,
  });

  children.add(child);
  child.on("exit", (code, signal) => {
    children.delete(child);
    if (!stopping) stop(code === null || signal ? 1 : code);
  });
}

function stop(code) {
  if (stopping) return;
  stopping = true;

  for (const child of children) child.kill();
  setTimeout(() => process.exit(code), 300).unref();
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

run(["server.js"]);
run([
  "node_modules/webpack-cli/bin/cli.js",
  "serve",
  "--config",
  "webpack.dev.js",
]);
