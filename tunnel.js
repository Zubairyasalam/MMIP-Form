import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, 'public');
const logFile = path.resolve(__dirname, 'tunnel_out_mmip.txt');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Starting reverse tunnel...');

const ssh = spawn('ssh', [
  '-o', 'StrictHostKeyChecking=no',
  '-R', '80:127.0.0.1:5173',
  'nokey@localhost.run'
]);

const logStream = fs.createWriteStream(logFile);
ssh.stdout.pipe(logStream);
ssh.stderr.pipe(logStream);

ssh.stdout.on('data', (data) => {
  const text = data.toString();
  const match = text.match(/https:\/\/[a-zA-Z0-9.-]+\.lhr\.life/);
  if (match) {
    const url = match[0];
    console.log('Tunnel URL detected:', url);
    fs.writeFileSync(
      path.resolve(publicDir, 'tunnel.json'),
      JSON.stringify({ url })
    );
  }
});

ssh.stderr.on('data', (data) => {
  const text = data.toString();
  const match = text.match(/https:\/\/[a-zA-Z0-9.-]+\.lhr\.life/);
  if (match) {
    const url = match[0];
    console.log('Tunnel URL detected (stderr):', url);
    fs.writeFileSync(
      path.resolve(publicDir, 'tunnel.json'),
      JSON.stringify({ url })
    );
  }
});

ssh.on('close', (code) => {
  console.log(`Tunnel process exited with code ${code}`);
});
