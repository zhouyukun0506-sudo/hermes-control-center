const { app, BrowserWindow, Tray, Menu, nativeImage, session, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;
let tray = null;
let isQuitting = false;

function startBackend() {
  const backendPath = path.join(__dirname, 'server', 'index.js');
  backendProcess = spawn('node', [backendPath], {
    stdio: 'inherit',
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    transparent: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: -100, y: -100 },
    backgroundColor: '#00000000',
    hasShadow: true,
    roundedCorners: true,
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

  setTimeout(() => {
    mainWindow.loadURL('http://127.0.0.1:3456');
  }, 1000);
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
  if (backendProcess) {
    backendProcess.kill();
  }
});
