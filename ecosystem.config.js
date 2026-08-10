module.exports = {
  apps: [
    {
      name: 'pdfly',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '500M',
      autorestart: true,
      watch: false,
    },
  ],
};
