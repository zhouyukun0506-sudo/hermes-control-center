const { app, BrowserWindow, Tray, Menu, nativeImage, session, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;
let localServer;
let tray = null;
let isQuitting = false;
const LOCAL_PORT = 3456;

// MIME types for static file serving
const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ttf': 'font/ttf',
};

function startLocalServer() {
  const distDir = path.join(__dirname, 'dist');
  localServer = http.createServer((req, res) => {
    let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
  localServer.listen(LOCAL_PORT, '127.0.0.1');
}

function startBackend() {
  const backendPath = path.join(__dirname, 'server', 'index.js');
  try {
    backendProcess = spawn('node', [backendPath], { stdio: 'inherit' });
    backendProcess.on('error', () => {}); // Silently ignore if node not found
  } catch (e) {}
}

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

  // Remove headers that block iframing
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    for (const key of Object.keys(responseHeaders)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'x-frame-options' ||
          lowerKey === 'content-security-policy' ||
          lowerKey === 'cross-origin-resource-policy' ||
          lowerKey === 'cross-origin-embedder-policy') {
        delete responseHeaders[key];
      }
    }
    callback({ cancel: false, responseHeaders });
  });

  // ── Tombstone: hide instead of close ──
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      // Free GPU resources while tombstoned
      if (mainWindow.webContents) {
        mainWindow.webContents.setBackgroundThrottling(true);
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Retry loading until backend is ready
  let loaded = false;
  function tryLoad(attempts) {
    if (loaded || !mainWindow) return;
    mainWindow.loadURL('http://127.0.0.1:3456').then(() => {
      loaded = true;
    }).catch(() => {
      if (attempts < 20) {
        setTimeout(() => tryLoad(attempts + 1), 500);
      }
    });
  }
  setTimeout(() => tryLoad(0), 500);
}

// ── Tray: tombstone indicator + restore ──
function createTray() {
  const iconPath = path.join(__dirname, 'public', 'logo.png');
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Workbench',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.setBackgroundThrottling(false);
        } else {
          createWindow();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Workbench');
  tray.setContextMenu(contextMenu);

  // Click tray to show window
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.setBackgroundThrottling(false);
      }
    } else {
      createWindow();
    }
  });
}

// ── Window Controls IPC ──
ipcMain.on('win-close', () => { if (mainWindow) mainWindow.close(); });
ipcMain.on('win-minimize', () => { if (mainWindow) mainWindow.minimize(); });
ipcMain.on('win-maximize', () => {
  if (mainWindow) {
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  }
});
ipcMain.on('win-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  }
});

// Bypass further security restrictions
app.commandLine.appendSwitch('disable-site-isolation-trials');

app.whenReady().then(() => {
  startLocalServer();
  startBackend();
  createWindow();
  createTray();

  // macOS: clicking dock icon restores window
  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.setBackgroundThrottling(false);
    } else {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Don't quit on macOS when all windows closed (tombstone)
  // On other platforms, still keep running in tray
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('quit', () => {
  if (localServer) localServer.close();
  if (backendProcess) backendProcess.kill();
});
