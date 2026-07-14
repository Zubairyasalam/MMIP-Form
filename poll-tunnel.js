import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFile = path.resolve(__dirname, 'tunnel_out_mmip.txt');
const publicDir = path.resolve(__dirname, 'public');

console.log('Polling tunnel log for URL...');

const interval = setInterval(() => {
  if (fs.existsSync(logFile)) {
    const content = fs.readFileSync(logFile, 'utf8');
    const match = content.match(/https:\/\/[a-zA-Z0-9.-]+\.lhr\.life/);
    if (match) {
      const url = match[0];
      console.log('Found tunnel URL:', url);
      fs.writeFileSync(
        path.resolve(publicDir, 'tunnel.json'),
        JSON.stringify({ url })
      );
      clearInterval(interval);
      process.exit(0);
    }
  }
}, 500);

// Timeout after 30 seconds
setTimeout(() => {
  console.log('Polling timed out.');
  clearInterval(interval);
  process.exit(1);
}, 30000);
