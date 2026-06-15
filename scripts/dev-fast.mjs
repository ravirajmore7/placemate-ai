import { spawn } from "node:child_process";

const child = spawn("npm", ["run", "dev:web"], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NEXT_PUBLIC_USE_MOCK_API: "true",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
    FAST_LOCAL_MODE: "true",
    DISABLE_AI_SERVICE: "true"
  }
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
