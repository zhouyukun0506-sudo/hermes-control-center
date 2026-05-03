// ── CLI / Terminal Component (Persistent Edition) ──
import * as api from '../api.js';

// Global persistence to survive tab switches
let term = null;
let fitAddon = null;
let eventSource = null;
let termDiv = null;
let lastSyncedCols = 0;
let lastSyncedRows = 0;

export function renderTerminal(container) {
  // Initialize ONLY ONCE
  if (!term) {
    termDiv = document.createElement('div');
    termDiv.style.width = '100%';
    termDiv.style.height = '100%';
    termDiv.style.background = '#000';
    termDiv.style.padding = '5px';

    term = new window.Terminal({
      cursorBlink: true,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      theme: { background: '#000000', foreground: '#ffcc00', cursor: '#ffcc00' }
    });

    fitAddon = new window.FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    
    // Connect to backend logs once
    eventSource = new EventSource('/ctrl/logs');
    eventSource.onmessage = (e) => {
      try {
        const log = JSON.parse(e.data);
        term.write(log.data);
      } catch {}
    };

    term.onData(data => {
      fetch('/ctrl/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: data, isRaw: true })
      });
    });
  }

  // Layout for the page
  container.innerHTML = `
    <div class="page" style="display:flex; flex-direction:column; height:100%; background: #000; padding: 0; position: relative; overflow: hidden;">
      <div id="term-host" style="flex:1; width: 100%; height: 100%;"></div>
      <div id="drop-overlay" style="display:none; position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(255,204,0,0.1); border: 2px dashed var(--accent); z-index:100; align-items:center; justify-content:center; pointer-events:none;">
        <span style="font-family:var(--font-terminal); color:var(--accent); font-size:14px;">[ DROP_FILES_HERE ]</span>
      </div>
    </div>
  `;

  const host = container.querySelector('#term-host');
  const overlay = container.querySelector('#drop-overlay');

  // Re-attach the persistent terminal element
  host.appendChild(termDiv);
  if (!term.element) {
    term.open(termDiv);
  }

  const syncSize = () => {
    if (!fitAddon) return;
    fitAddon.fit();
    if (term.cols !== lastSyncedCols || term.rows !== lastSyncedRows) {
      lastSyncedCols = term.cols;
      lastSyncedRows = term.rows;
      fetch('/ctrl/resize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cols: term.cols, rows: term.rows })
      });
    }
  };

  setTimeout(() => {
    syncSize();
    term.focus();
  }, 100);

  // ── Drag & Drop ──
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); overlay.style.display = 'none';
    let paths = [];
    try {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        for (const f of files) {
          let p = f.path;
          if (!p && window.require) { try { p = window.require('electron').webUtils.getPathForFile(f); } catch {} }
          if (p) paths.push(p.includes(' ') ? `"${p}"` : p);
        }
      }
    } catch {}
    if (paths.length > 0) { 
        const cmd = paths.join(' ') + ' ';
        fetch('/ctrl/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmd, isRaw: true })
        });
        term.focus(); 
    }
  };

  const handlers = {
    dragover: (e) => { e.preventDefault(); e.stopPropagation(); overlay.style.display = 'flex'; },
    dragleave: (e) => { e.preventDefault(); e.stopPropagation(); overlay.style.display = 'none'; },
    drop: onDrop,
    resize: () => syncSize()
  };

  window.addEventListener('dragover', handlers.dragover);
  window.addEventListener('dragleave', handlers.dragleave);
  window.addEventListener('drop', handlers.drop);
  window.addEventListener('resize', handlers.resize);

  container.cleanup = () => {
    window.removeEventListener('dragover', handlers.dragover);
    window.removeEventListener('dragleave', handlers.dragleave);
    window.removeEventListener('drop', handlers.drop);
    window.removeEventListener('resize', handlers.resize);
    // Note: We DO NOT dispose term or eventSource because we want them to persist!
  };
}
