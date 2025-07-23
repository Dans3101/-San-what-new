import express from 'express';
import { startSession } from './botManager.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Optional homepage route
app.get('/', (req, res) => {
  res.send('✅ DansDans WhatsApp bot is running.');
});

// Start WhatsApp bot session
startSession('main');

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});