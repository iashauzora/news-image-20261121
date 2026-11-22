// Render frontpage.html to ../entry.png at exactly 1024x1024 via CDP.
import { writeFileSync } from 'node:fs';

const PAGE_URL = 'http://127.0.0.1:8077/frontpage.html';
const DEBUG = 'http://127.0.0.1:9333';
const OUT = new URL('../entry.png', import.meta.url).pathname;

async function newTarget() {
  for (const method of ['PUT', 'GET']) {
    try {
      const r = await fetch(`${DEBUG}/json/new?${encodeURIComponent(PAGE_URL)}`, { method });
      if (r.ok) return await r.json();
    } catch { /* retry */ }
  }
  const list = await (await fetch(`${DEBUG}/json/list`)).json();
  return list.find(t => t.type === 'page') || list[0];
}

const target = await newTarget();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let seq = 0;
const pending = new Map();
const events = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  else if (msg.method) events.push(msg.method);
};
function send(method, params = {}) {
  const id = ++seq;
  return new Promise((res) => { pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 1024, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: PAGE_URL });
for (let i = 0; i < 40 && !events.includes('Page.loadEventFired'); i++) await sleep(250);
await sleep(600);

const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
if (!shot.result || !shot.result.data) { console.error('capture failed', JSON.stringify(shot).slice(0, 300)); process.exit(1); }
writeFileSync(OUT, Buffer.from(shot.result.data, 'base64'));
console.log('wrote', OUT);
ws.close();
process.exit(0);
