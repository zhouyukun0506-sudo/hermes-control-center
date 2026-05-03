const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function startBackend() {
  // Start the Node.js Express server backend
  const backendPath = path.join(__dirname, 'server', 'index.js');
  backendProcess = spawn('node', [backendPath], {
    stdio: 'inherit',
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      webSecurity: false,
      partition: 'persist:hermes',
      contextIsolation: false,
      nodeIntegration: true,
      webviewTag: true
    }
  });

  // Remove X-Frame-Options and CSP to allow embedding ANY site
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    
    // Delete headers that block iframing (case-insensitive)
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

  // Give the backend a second to start
  setTimeout(() => {
    mainWindow.loadURL('http://127.0.0.1:3456');
  }, 1000);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Bypass further security restrictions
app.commandLine.appendSwitch('disable-site-isolation-trials');

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', function () {
    if (mainWindow === null) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
