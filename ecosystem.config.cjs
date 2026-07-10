module.exports = {
  apps: [
    {
      name: "azgallery",
      cwd: "/opt/azab-hub/azgallery",
      script: ".output/server/index.mjs",
      interpreter: "node",
      env: {
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
