import { exec } from 'child_process';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tunnelJsonPath = join(__dirname, 'public', 'tunnel.json');

const lt = exec('npx --yes localtunnel --port 5173');

lt.stdout.on('data', (data) => {
  const str = data.toString();
  console.log('LT:', str.trim());
  const match = str.match(/https?:\/\/[a-z0-9-]+\.loca\.lt/);
  if (match) {
    const url = match[0];
    console.log('✅ Tunnel URL:', url);
    writeFileSync(tunnelJsonPath, JSON.stringify({ url }, null, 2));
    console.log('✅ Written to tunnel.json — QR codes will now use:', url);
  }
});

lt.stderr.on('data', (data) => {
  console.error('LT ERR:', data.toString().trim());
});

lt.on('close', (code) => {
  console.log('Tunnel closed, code:', code);
});
