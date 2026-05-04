import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3456;
const HERMES_WEBUI = 'http://localhost:8787';
const HOME = process.env.HOME || process.env.USERPROFILE;
const HERMES_UP = path.join(HOME, 'bin', 'hermes-up');
const HERMES_KILL = path.join(HOME, 'bin', 'hermes-kill');

// ── Shared Log Buffer ──
const MAX_LOGS = 1000;
let logBuffer = [];
let logListeners = new Set();

function broadcastLog(type, data) {
  const logEntry = { type, data, timestamp: Date.now() };
  logBuffer.push(logEntry);
  if (logBuffer.length > MAX_LOGS) logBuffer.shift();
  const msg = `data: ${JSON.stringify(logEntry)}\n\n`;
  logListeners.forEach(listener => listener.write(msg));
}

// ── Advanced PTY Bridge (Pure Python, No Echo Resize) ──
let shellProcess = null;
const PTY_SCRIPT = `
import os, sys, pty, termios, fcntl, struct, select
def set_winsize(fd, row, col):
    s = struct.pack('HHHH', row, col, 0, 0)
    fcntl.ioctl(fd, termios.TIOCSWINSZ, s)
pid, fd = pty.fork()
if pid == 0:
    os.execv('/bin/zsh', ['/bin/zsh', '-l'])
set_winsize(fd, 24, 80)
while True:
    r, w, e = select.select([sys.stdin, fd], [], [])
    if sys.stdin in r:
        data = os.read(sys.stdin.fileno(), 1024)
        if not data: break
        if b'\\x1b[RSZ;' in data:
            try:
                parts = data.split(b';')
                row = int(parts[1]); col = int(parts[2].replace(b'Z', b''))
                set_winsize(fd, row, col)
                continue
            except: pass
        os.write(fd, data)
    if fd in r:
        data = os.read(fd, 1024)
        if not data: break
        os.write(sys.stdout.fileno(), data)
`;

function initShell() {
  if (shellProcess) return;
  shellProcess = spawn('python3', ['-c', PTY_SCRIPT], {
    env: { ...process.env, PATH: `${HOME}/bin:${HOME}/.local/bin:${process.env.PATH}`, TERM: 'xterm-256color', LANG: 'en_US.UTF-8' },
    shell: false
  });
  shellProcess.stdout.on('data', d => broadcastLog('stdout', d.toString()));
  shellProcess.stderr.on('data', d => broadcastLog('stderr', d.toString()));
  shellProcess.on('close', () => { shellProcess = null; setTimeout(initShell, 2000); });
}
initShell();

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Status Checks ──
function checkHealth() {
  return new Promise(r => {
    http.get(`${HERMES_WEBUI}/health`, { timeout: 1000 }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { r({ online: true, ...JSON.parse(d) }); } catch { r({ online: true }); } });
    }).on('error', () => r({ online: false }));
  });
}
function checkGateway() {
  try { return execSync('launchctl list | grep ai.hermes.gateway', { encoding: 'utf-8' }).length > 0; } catch { return false; }
}
async function getStats() {
  try {
    const out = execSync("ps -eo pcpu,pmem,comm | grep -i 'hermes' | grep -v 'grep'", { encoding: 'utf-8' });
    let c = 0, m = 0;
    out.trim().split('\n').forEach(l => { const p = l.trim().split(/\s+/); if (p.length >= 2) { c += parseFloat(p[0]); m += parseFloat(p[1]); } });
    return { cpu: c.toFixed(1), mem: m.toFixed(1) };
  } catch { return { cpu: '0.0', mem: '0.0' }; }
}

app.get('/ctrl/status', async (req, res) => {
  const [h, g, s] = await Promise.all([checkHealth(), Promise.resolve(checkGateway()), getStats()]);
  res.json({ gateway_running: g, webui_running: h.online, webui_status: h.online ? h : null, stats: s, timestamp: Date.now() });
});

app.get('/ctrl/logs', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  logBuffer.forEach(l => res.write(`data: ${JSON.stringify(l)}\n\n`));
  logListeners.add(res);
  req.on('close', () => logListeners.delete(res));
});

// ── One-Click Control (RESTORED) ──
app.post('/ctrl/start', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  const child = spawn(HERMES_UP, ['-n'], { shell: '/bin/zsh', env: { ...process.env, PATH: `${HOME}/bin:${HOME}/.local/bin:${process.env.PATH}` } });
  const send = (t, d) => res.write(`data: ${JSON.stringify({ type: t, data: d })}\n\n`);
  child.stdout.on('data', d => { send('stdout', d.toString()); broadcastLog('stdout', d.toString()); });
  child.stderr.on('data', d => { send('stderr', d.toString()); broadcastLog('stderr', d.toString()); });
  child.on('close', c => { send('done', { code: c }); res.end(); });
});

app.post('/ctrl/stop', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  const child = spawn(HERMES_KILL, [], { shell: '/bin/zsh', env: { ...process.env, PATH: `${HOME}/bin:${HOME}/.local/bin:${process.env.PATH}` } });
  const send = (t, d) => res.write(`data: ${JSON.stringify({ type: t, data: d })}\n\n`);
  child.stdout.on('data', d => { send('stdout', d.toString()); broadcastLog('stdout', d.toString()); });
  child.stderr.on('data', d => { send('stderr', d.toString()); broadcastLog('stderr', d.toString()); });
  child.on('close', c => { send('done', { code: c }); res.end(); });
});

app.post('/ctrl/exec', (req, res) => {
  const { command, isRaw } = req.body;
  if (shellProcess) { shellProcess.stdin.write(isRaw ? command : command + '\n'); res.json({ success: true }); }
  else res.status(503).json({ error: 'Not ready' });
});

app.post('/ctrl/resize', (req, res) => {
  const { cols, rows } = req.body;
  if (shellProcess) { shellProcess.stdin.write(`\x1b[RSZ;${rows};${cols}Z`); res.json({ success: true }); }
  else res.status(503).json({ error: 'Not ready' });
});

// ── Direct File Browser (native fs, no webui needed) ──
app.get('/ctrl/list', (req, res) => {
  const dirPath = req.query.path || HOME;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true }).map(d => ({
      name: d.name,
      type: d.isDirectory() ? 'directory' : 'file',
      size: d.isFile() ? fs.statSync(path.join(dirPath, d.name)).size : 0,
    }));
    entries.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    res.json({ entries, path: dirPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/ctrl/file', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'path required' });
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const stat = fs.statSync(filePath);
    res.json({ content, name: path.basename(filePath), size: stat.size });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Calendar API (local JSON storage) ──
const CALENDAR_FILE = path.join(HOME, '.hermes', 'calendar.json');

function loadCalendar() {
  try {
    if (fs.existsSync(CALENDAR_FILE)) {
      const raw = fs.readFileSync(CALENDAR_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {}
  return { events: [] };
}

function saveCalendar(data) {
  const dir = path.dirname(CALENDAR_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CALENDAR_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

app.get('/api/calendar', (req, res) => {
  const data = loadCalendar();
  const month = req.query.month; // "2026-05"
  if (month) {
    data.events = data.events.filter(e => e.date && e.date.startsWith(month));
  }
  res.json(data);
});

app.post('/api/calendar/add', (req, res) => {
  const { title, date, time, description, remind, subject, type } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'title and date required' });
  const data = loadCalendar();
  const event = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title,
    date,
    time: time || '',
    description: description || '',
    subject: subject || '',
    type: type || '',
    remind: !!remind,
    createdAt: Date.now(),
  };
  data.events.push(event);
  saveCalendar(data);
  res.json({ success: true, event });
});

app.post('/api/calendar/delete', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });
  const data = loadCalendar();
  data.events = data.events.filter(e => e.id !== id);
  saveCalendar(data);
  res.json({ success: true });
});

app.use(createProxyMiddleware({
  pathFilter: '/api', target: HERMES_WEBUI, changeOrigin: true,
  on: { proxyReq: (p) => { p.setHeader('Origin', HERMES_WEBUI); p.setHeader('Host', 'localhost:8787'); } }
}));

const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(PORT, '127.0.0.1', () => console.log(`Hermes Control Center Backend Ready on ${PORT}`));
