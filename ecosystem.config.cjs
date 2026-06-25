const fs = require("fs");
const path = require("path");

const APP_DIR = "/opt/azab-hub/azgallery";

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return env;

      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) return env;

      const key = match[1];
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
      return env;
    }, {});
}

const fileEnv = parseEnvFile(path.join(APP_DIR, ".env"));

module.exports = {
  apps: [
    {
      name: "azgallery",
      cwd: APP_DIR,
      script: "pnpm",
      args: "start",
      interpreter: "none",
      env: {
        ...fileEnv,
        NODE_ENV: "production",
        HOST: "127.0.0.1",
        PORT: "3033",
      },
      time: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: "512M",
    },
  ],
};
