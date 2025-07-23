import express from 'express';
import { startSession } from './botManager.js';

const app = express();

// Log environment variables for debugging
console.log('Running updated main.js - 2025-07-23');
console.log('Environment PORT:', process.env.PORT);

// Use Render's dynamic PORT or fallback to 3000 for local development
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON (optional, remove if not needed)
app.use(express.json());

// Optional homepage route
app.get('/', (req, res) => {
  res.send('✅ DansDans WhatsApp bot is running.');
});

// Start WhatsApp bot session
try {
  console.log('Starting WhatsApp bot session...');
  startSession('main');
} catch (error) {
  console.error('❌ Failed to start WhatsApp bot session:', error);
  process.exit(1);
}

// Start the server with error handling
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

// Handle server errors
server.on('error', (err) => {
  console.error(`❌ Server error on port ${PORT}:`, err);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please free the port or check for stale processes.`);
    process.exit(1);
  } else {
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