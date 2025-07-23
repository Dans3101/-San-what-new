import express from 'express';
import { startSession } from './botManager.js';

const app = express();

// Use Render's dynamic PORT or fallback to 3000 for local development
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON (optional, add if needed by your bot)
app.use(express.json());

// Optional homepage route
app.get('/', (req, res) => {
  res.send('✅ DansDans WhatsApp bot is running.');
});

// Start WhatsApp bot session
try {
  startSession('main');
} catch (error) {
  console.error('❌ Failed to start WhatsApp bot session:', error);
  process.exit(1); // Exit if bot session fails
}

// Start the server with error handling
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please free the port or choose another.`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    throw err;
  }
});

// Graceful shutdown for Render
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Closing server...');
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});

export default app;