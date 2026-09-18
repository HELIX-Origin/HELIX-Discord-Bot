module.exports = {
  apps: [
    {
      name: 'helix-discord-bot',
      script: './dist/index.js',
      cwd: '/opt/helix-discord-bot',
      node_args: '--env-file-if-exists=.env',
      watch: ['dist'],
      ignore_watch: ['data', 'node_modules', '.git', 'logs'],
      watch_delay: 1000,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
