const { app, BrowserWindow, Tray, Menu, nativeImage, session, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

let mainWindow;
let tray = null;
let isQuitting = false;
const LOCAL_PORT = 3456;
const HOME = process.env.USERPROFILE || process.env.HOME || '';
const HERMES_UP = path.join(HOME, 'bin', 'hermes-up');
const HERMES_KILL = path.join(HOME, 'bin', 'hermes-kill');

// ── Terminal PTY ──
let shellProcess = null;
let logBuffer = [];
let logListeners = new Set();
const MAX_LOGS = 1000;

function broadcastLog(type, data) {
  const entry = { type, data, timestamp: Date.now() };
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOGS) logBuffer.shift();
  const msg = `data: ${JSON.stringify(entry)}\n\n`;
  logListeners.forEach(l => l.write(msg));
}

function initShell() {
  if (shellProcess) return;
  const isWin = process.platform === 'win32';
  if (isWin) {
    shellProcess = spawn('cmd.exe', [], {
      env: { ...process.env, TERM: 'xterm-256color' },
    });
  } else {
    shellProcess = spawn('python3', ['-c', `
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
`], {
      env: { ...process.env, PATH: `${HOME}/bin:${HOME}/.local/bin:${process.env.PATH}`, TERM: 'xterm-256color', LANG: 'en_US.UTF-8' },
      shell: false,
    });
  }
  shellProcess.stdout.on('data', d => broadcastLog('stdout', d.toString()));
  shellProcess.stderr.on('data', d => broadcastLog('stderr', d.toString()));
  shellProcess.on('close', () => { shellProcess = null; setTimeout(initShell, 2000); });
}

// ── Status ──
function checkHealth() {
  return new Promise(r => {
    http.get('http://localhost:8787/health', { timeout: 1000 }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { r({ online: true, ...JSON.parse(d) }); } catch { r({ online: true }); } });
    }).on('error', () => r({ online: false }));
  });
}

function checkGateway() {
  return new Promise(r => {
    if (process.platform === 'win32') {
      // On Windows, check if gateway port (8787) is listening
      http.get('http://127.0.0.1:8787/health', { timeout: 1500 }, res => {
        let d = ''; res.on('data', c => d += c);
        res.on('end', () => r(true));
      }).on('error', () => r(false));
    } else {
      try {
        r(execSync('launchctl list | grep ai.hermes.gateway', { encoding: 'utf-8' }).length > 0);
      } catch { r(false); }
    }
  });
}

function getStats() {
  try {
    if (process.platform === 'win32') return { cpu: '0.0', mem: '0.0' };
    const out = execSync("ps -eo pcpu,pmem,comm | grep -i 'hermes' | grep -v 'grep'", { encoding: 'utf-8' });
    let c = 0, m = 0;
    out.trim().split('\n').forEach(l => { const p = l.trim().split(/\s+/); if (p.length >= 2) { c += parseFloat(p[0]); m += parseFloat(p[1]); } });
    return { cpu: c.toFixed(1), mem: m.toFixed(1) };
  } catch { return { cpu: '0.0', mem: '0.0' }; }
}

// ── OpenClaw WebUI Detection ──
const OPENCLAW_PORTS = [3000, 3001, 4000, 5173, 5174, 5175, 8080, 8081, 8888, 9000, 9090, 10000];

function checkPort(port) {
  return new Promise(r => {
    const req = http.get(`http://127.0.0.1:${port}/`, { timeout: 1000 }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => r({ running: true, port }));
    });
    req.on('error', () => r({ running: false, port }));
    req.on('timeout', () => { req.destroy(); r({ running: false, port }); });
  });
}

async function detectOpenClaw() {
  const results = await Promise.all(OPENCLAW_PORTS.map(checkPort));
  const found = results.find(r => r.running);
  return found
    ? { running: true, port: found.port, url: `http://127.0.0.1:${found.port}` }
    : { running: false, port: null, url: null };
}

// ── OpenClaw Start ──
function startOpenClaw() {
  return new Promise(r => {
    const isWin = process.platform === 'win32';
    let child;
    if (isWin) {
      child = spawn('cmd.exe', ['/c', 'openclaw'], {
        env: { ...process.env, PATH: `${process.env.APPDATA}\\npm;${process.env.PATH}` },
        detached: true,
        stdio: 'ignore',
      });
    } else {
      child = spawn('openclaw', [], {
        env: { ...process.env, PATH: `${HOME}/bin:${HOME}/.local/bin:${process.env.PATH}` },
        detached: true,
        stdio: 'ignore',
      });
    }
    child.unref();
    // Give it a moment to start, then check
    setTimeout(async () => {
      const oc = await detectOpenClaw();
      r(oc);
    }, 3000);
  });
}

// ── Calendar ──
const CALENDAR_FILE = path.join(HOME, '.hermes', 'calendar.json');
function loadCalendar() {
  try { if (fs.existsSync(CALENDAR_FILE)) return JSON.parse(fs.readFileSync(CALENDAR_FILE, 'utf-8')); } catch {}
  return { events: [] };
}
function saveCalendar(data) {
  const dir = path.dirname(CALENDAR_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CALENDAR_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ── HTTP Server ──
const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ttf': 'font/ttf',
};

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => resolve(body));
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${LOCAL_PORT}`);
  const pathname = url.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // ── API Routes ──

  if (pathname === '/ctrl/status') {
    const [h, g, s, oc] = await Promise.all([checkHealth(), checkGateway(), Promise.resolve(getStats()), detectOpenClaw()]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ gateway_running: g, webui_running: h.online, webui_status: h.online ? h : null, stats: s, openclaw_running: oc.running, openclaw_url: oc.url, timestamp: Date.now() }));
    return;
  }

  if (pathname === '/ctrl/openclaw/status') {
    const oc = await detectOpenClaw();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(oc));
    return;
  }

  if (pathname === '/ctrl/openclaw/start' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
    res.flushHeaders();
    const send = (t, d) => res.write(`data: ${JSON.stringify({ type: t, data: d })}\n\n`);
    send('stdout', 'Starting OpenClaw...\n');
    try {
      const oc = await startOpenClaw();
      if (oc.running) {
        send('stdout', `OpenClaw detected on port ${oc.port}\n`);
        send('done', { code: 0, ...oc });
      } else {
        send('stderr', 'OpenClaw started but not detected on scanned ports\n');
        send('done', { code: 1 });
      }
    } catch (err) {
      send('stderr', `Failed to start OpenClaw: ${err.message}\n`);
      send('done', { code: 1 });
    }
    res.end();
    return;
  }

  if (pathname === '/ctrl/logs') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
    res.flushHeaders();
    logBuffer.forEach(l => res.write(`data: ${JSON.stringify(l)}\n\n`));
    logListeners.add(res);
    req.on('close', () => logListeners.delete(res));
    return;
  }

  if (pathname === '/ctrl/exec' && req.method === 'POST') {
    const body = JSON.parse(await readBody(req));
    if (shellProcess) {
      shellProcess.stdin.write(body.isRaw ? body.command : body.command + '\n');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } else {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not ready' }));
    }
    return;
  }

  if (pathname === '/ctrl/resize' && req.method === 'POST') {
    const { cols, rows } = JSON.parse(await readBody(req));
    if (shellProcess && process.platform !== 'win32') {
      shellProcess.stdin.write(`\x1b[RSZ;${rows};${cols}Z`);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  if (pathname === '/ctrl/list') {
    const dirPath = url.searchParams.get('path') || HOME;
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true }).map(d => ({
        name: d.name, type: d.isDirectory() ? 'directory' : 'file',
        size: d.isFile() ? fs.statSync(path.join(dirPath, d.name)).size : 0,
      }));
      entries.sort((a, b) => { if (a.type !== b.type) return a.type === 'directory' ? -1 : 1; return a.name.localeCompare(b.name); });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ entries, path: dirPath }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (pathname === '/ctrl/file') {
    const filePath = url.searchParams.get('path');
    if (!filePath) { res.writeHead(400); res.end('path required'); return; }
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const stat = fs.statSync(filePath);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ content, name: path.basename(filePath), size: stat.size }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (pathname === '/api/calendar' && req.method === 'GET') {
    const data = loadCalendar();
    const month = url.searchParams.get('month');
    if (month) data.events = data.events.filter(e => e.date && e.date.startsWith(month));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  if (pathname === '/api/calendar/add' && req.method === 'POST') {
    const { title, date, time, description, remind, subject, type } = JSON.parse(await readBody(req));
    if (!title || !date) { res.writeHead(400); res.end('title and date required'); return; }
    const data = loadCalendar();
    const event = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title, date, time: time || '', description: description || '', subject: subject || '', type: type || '', remind: !!remind, createdAt: Date.now() };
    data.events.push(event);
    saveCalendar(data);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, event }));
    return;
  }

  if (pathname === '/api/calendar/delete' && req.method === 'POST') {
    const { id } = JSON.parse(await readBody(req));
    if (!id) { res.writeHead(400); res.end('id required'); return; }
    const data = loadCalendar();
    data.events = data.events.filter(e => e.id !== id);
    saveCalendar(data);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // ── Hermes Start (hermes-up) ──
  if (pathname === '/ctrl/start' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
    res.flushHeaders();
    const child = spawn(HERMES_UP, ['-n'], { shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/zsh', env: { ...process.env, PATH: `${HOME}/bin:${HOME}/.local/bin:${process.env.PATH}` } });
    const send = (t, d) => res.write(`data: ${JSON.stringify({ type: t, data: d })}\n\n`);
    child.stdout.on('data', d => { send('stdout', d.toString()); broadcastLog('stdout', d.toString()); });
    child.stderr.on('data', d => { send('stderr', d.toString()); broadcastLog('stderr', d.toString()); });
    child.on('close', c => { send('done', { code: c }); res.end(); });
    return;
  }

  // ── Hermes Stop (hermes-kill) ──
  if (pathname === '/ctrl/stop' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
    res.flushHeaders();
    const child = spawn(HERMES_KILL, [], { shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/zsh', env: { ...process.env, PATH: `${HOME}/bin:${HOME}/.local/bin:${process.env.PATH}` } });
    const send = (t, d) => res.write(`data: ${JSON.stringify({ type: t, data: d })}\n\n`);
    child.stdout.on('data', d => { send('stdout', d.toString()); broadcastLog('stdout', d.toString()); });
    child.stderr.on('data', d => { send('stderr', d.toString()); broadcastLog('stderr', d.toString()); });
    child.on('close', c => { send('done', { code: c }); res.end(); });
    return;
  }

  // ── Static files from dist/ ──
  const distDir = path.join(__dirname, 'dist');
  let filePath = path.join(distDir, pathname === '/' ? 'index.html' : pathname.split('?')[0]);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

// ── Electron ──

function createWindow() {
  const isMac = process.platform === 'darwin';

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    ...(isMac ? {
      transparent: true,
      titleBarStyle: 'hidden',
      trafficLightPosition: { x: -100, y: -100 },
      backgroundColor: '#00000000',
      hasShadow: true,
      roundedCorners: true,
    } : {
      backgroundColor: '#0f0f0f',
      frame: true,
    }),
    webPreferences: {
      webSecurity: false,
      partition: 'persist:hermes',
      contextIsolation: false,
      nodeIntegration: true,
      webviewTag: true,
    },
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    for (const key of Object.keys(responseHeaders)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'x-frame-options' || lowerKey === 'content-security-policy' ||
          lowerKey === 'cross-origin-resource-policy' || lowerKey === 'cross-origin-embedder-policy') {
        delete responseHeaders[key];
      }
    }
    callback({ cancel: false, responseHeaders });
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      if (mainWindow.webContents) mainWindow.webContents.setBackgroundThrottling(true);
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  let loaded = false;
  function tryLoad(attempts) {
    if (loaded || !mainWindow) return;
    mainWindow.loadURL(`http://127.0.0.1:${LOCAL_PORT}`).then(() => {
      loaded = true;
    }).catch(() => {
      if (attempts < 20) setTimeout(() => tryLoad(attempts + 1), 500);
    });
  }
  setTimeout(() => tryLoad(0), 500);
}

function createTray() {
  const iconPath = path.join(__dirname, 'public', 'logo.png');
  let trayIcon;
  try { trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 }); } catch { trayIcon = nativeImage.createEmpty(); }
  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Workbench', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); mainWindow.webContents.setBackgroundThrottling(false); } else createWindow(); } },
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit(); } },
  ]);
  tray.setToolTip('Workbench');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) mainWindow.focus();
      else { mainWindow.show(); mainWindow.focus(); mainWindow.webContents.setBackgroundThrottling(false); }
    } else createWindow();
  });
}

// ── Window Controls IPC ──
ipcMain.on('win-close', () => { if (mainWindow) mainWindow.close(); });
ipcMain.on('win-minimize', () => { if (mainWindow) mainWindow.minimize(); });
ipcMain.on('win-maximize', () => { if (mainWindow) { mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize(); } });
ipcMain.on('win-fullscreen', () => { if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen()); });

app.commandLine.appendSwitch('disable-site-isolation-trials');

app.whenReady().then(() => {
  server.listen(LOCAL_PORT, '127.0.0.1', () => {
    initShell();
    createWindow();
    createTray();
  });

  app.on('activate', () => {
    if (mainWindow) { mainWindow.show(); mainWindow.focus(); mainWindow.webContents.setBackgroundThrottling(false); }
    else createWindow();
  });
});

app.on('window-all-closed', () => {});
app.on('before-quit', () => { isQuitting = true; });
app.on('quit', () => {
  server.close();
  if (shellProcess) shellProcess.kill();
});
