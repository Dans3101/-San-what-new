import http from 'http';
import { startSession } from './botManager.js';

startSession('main');

const port = process.env.PORT || 3000;

http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('DansDans bot is running');
  }
}).listen(port, () => {
  console.log(`🌐 Health check server listening on port ${port}`);
});