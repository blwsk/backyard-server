module.exports = {
  apps: [
    {
      name: "backyard_server",
      script: "./server.js",
      logs: "./logs/app.log",
      watch: true,
      env: {
        PORT: 8080,
        NODE_ENV: "development",
      },
    },
  ],
};
