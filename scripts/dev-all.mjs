import { spawn } from "node:child_process";

const commands = [
  ["api", "npm", ["run", "dev:api"]],
  ["web", "npm", ["run", "dev:web"]]
];

if (process.env.RUN_AI_SERVICE === "true") {
  commands.push(["ai", "npm", ["run", "dev:ai"]]);
}

const children = commands.map(([name, command, args]) => {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: true,
    env: process.env
  });
  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[dev:${name}] exited with ${code}`);
    }
  });
  return child;
});

function stop() {
  for (const child of children) {
    if (!child.killed) child.kill("SIGINT");
  }
}

process.on("SIGINT", () => {
  stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stop();
  process.exit(0);
});
