import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

const app = express();
app.use(express.static(distDir));
app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));

const port = parseInt(process.env.PORT || '443', 10);

if (
    process.env.NODE_ENV === 'production' &&
    process.env.SSL_KEY_PATH &&
    process.env.SSL_CERT_PATH
) {
    const options = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH),
    };
    https.createServer(options, app).listen(port, '0.0.0.0', () =>
        console.log(`client https://0.0.0.0:${port}`),
    );
} else {
    http.createServer(app).listen(port, '0.0.0.0', () =>
        console.log(`client http://0.0.0.0:${port}`),
    );
}
