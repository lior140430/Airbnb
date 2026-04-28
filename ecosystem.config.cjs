const path = require('path');

module.exports = {
    apps: [
        {
            name: 'auth-service',
            cwd: path.join(__dirname, 'apps/auth-service'),
            script: 'dist/main.js',
            env_production: { NODE_ENV: 'production' },
        },
        {
            name: 'property-service',
            cwd: path.join(__dirname, 'apps/property-service'),
            script: 'dist/main.js',
            env_production: { NODE_ENV: 'production' },
        },
        {
            name: 'client-static',
            cwd: path.join(__dirname, 'apps/client'),
            script: 'serve.mjs',
            env_production: { NODE_ENV: 'production' },
        },
    ],
};
