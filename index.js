import fs from 'fs';
import path from 'path';
import axios from 'axios';
import http from 'http';
import dotenv from 'dotenv';
import pino from 'pino';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';

// Load environment variables
dotenv.config();

// Logger setup
const logger = pino();

// Emulate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths and URLs
const baseDir = join(__dirname, 'modules');
const mainModule = 'main.js';
const filePath = join(baseDir, mainModule);
const fileUrl = process.env.MAIN_MODULE_URL || 'https://raw.githubusercontent.com/Dans3101/Dans-dan/main/main.js';

// Ensure modules directory exists
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir);
  logger.info(`📁 Created directory: ${baseDir}`);
}

// Download and save the main module
async function downloadAndSave(url, filepath) {
  try {
    const response = await axios.get(url, { responseType: 'text' });
    fs.writeFileSync(filepath, response.data);
    logger.info(`✅ Saved ${filepath}`);
  } catch (error) {
    logger.error(`❌ Failed to download ${url}: ${error.message}`);
    throw error;
  }
}

// Retry wrapper
async function retry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      logger.warn(`🔁 Retry ${i + 1}/${retries} failed: ${err.message}`);
      if (i === retries - 1) throw err;
    }
  }
}

// Run the downloaded module in a child process
function runMainModule(filepath) {
  exec(`node ${filepath}`, (error, stdout, stderr) => {
    if (error) {
      logger.error(`❌ Error running ${mainModule}: ${error.message}`);
      return;
    }
    if (stderr) {
      logger.warn(`⚠️ stderr: ${stderr}`);
    }
    logger.info(`✅ ${mainModule} output:\n${stdout}`);
  });
}

// Load and run the bot
(async () => {
  try {
    await retry(() => downloadAndSave(fileUrl, filePath));

    if (fs.existsSync(filePath)) {
      runMainModule(filePath);
    } else {
      logger.error(`❌ ${mainModule} not found.`);
    }
  } catch (err) {
    logger.error(`🚨 Fatal error: ${err.message}`);
  }
})();

// Minimal health check server for Render
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
  logger.info(`🌐 Health check server listening on port ${port}`);
});