// ── Log Viewer Component ──

const MAX_VISIBLE = 500;
let logEntries = [];
let filterText = '';
let filterLevel = 'all';
let logSource = null;

export function renderLogViewer(container) {
  container.innerHTML = `
    <div class="page page-padded">
      <div style="display: flex; flex-direction: column; height: calc(100vh - 120px);">
        <div style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
          <div class="page-header" style="margin-bottom: 0;">
            <h1 class="page-title">Log Viewer</h1>
            <p class="page-subtitle">Real-time system log stream.</p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <select id="lv-level" style="background: var(--fill-quinary); border: 0.5px solid var(--fill-quaternary); border-radius: 8px;
                    padding: 8px 12px; color: var(--text-main); font-size: 12px; outline: none; cursor: pointer;">
              <option value="all">All Levels</option>
              <option value="stdout">stdout</option>
              <option value="stderr">stderr</option>
              <option value="info">info</option>
            </select>
            <input id="lv-search" type="text" placeholder="Search logs..." value="${esc(filterText)}"
              style="background: var(--fill-quinary); border: 0.5px solid var(--fill-quaternary); border-radius: 8px;
                     padding: 8px 12px; color: var(--text-main); font-size: 12px; outline: none; width: 180px; font-family: var(--font-mono);">
            <span id="lv-count" style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);"></span>
            <button id="lv-clear" style="background: var(--fill-quinary); border: 0.5px solid var(--fill-quaternary); border-radius: 8px;
                    color: var(--text-muted); padding: 8px 14px; cursor: pointer; font-size: 12px; font-family: inherit;">Clear</button>
          </div>
        </div>

        <div id="lv-output" style="flex: 1; overflow-y: auto; background: var(--fill-quinary); border: 0.5px solid var(--fill-quaternary);
             border-radius: 10px; padding: 16px; font-family: var(--font-mono); font-size: 12px; line-height: 1.6;">
          <div style="padding: 40px; text-align: center; color: var(--text-muted); font-family: var(--font-main); font-size: 13px;">
            Connecting to log stream...
          </div>
        </div>
      </div>
    </div>
  `;

  const outputEl = container.querySelector('#lv-output');
  const searchEl = container.querySelector('#lv-search');
  const levelEl = container.querySelector('#lv-level');
  const clearEl = container.querySelector('#lv-clear');
  const countEl = container.querySelector('#lv-count');

  // Connect to SSE
  function connect() {
    if (logSource) {
      logSource.close();
      logSource = null;
    }
    logSource = new EventSource('/ctrl/logs');
    logSource.onmessage = (event) => {
      try {
        const entry = JSON.parse(event.data);
        logEntries.push(entry);
        if (logEntries.length > MAX_VISIBLE * 2) {
          logEntries = logEntries.slice(-MAX_VISIBLE);
        }
        render();
      } catch {}
    };
    logSource.onerror = () => {
      // Connection lost — show stale data with warning
      if (outputEl && !outputEl.querySelector('.lv-offline')) {
        const warn = document.createElement('div');
        warn.className = 'lv-offline';
        warn.style.cssText = 'padding: 8px 12px; margin-bottom: 12px; background: rgba(255,204,0,0.1); border-radius: 8px; color: #ffcc00; font-size: 11px; font-family: var(--font-main);';
        warn.textContent = '⚠ Log stream disconnected. Showing cached entries.';
        outputEl.prepend(warn);
      }
    };
  }

  function render() {
    if (!outputEl) return;
    const filtered = logEntries.filter(e => {
      if (filterLevel !== 'all' && e.type !== filterLevel) return false;
      if (filterText && !e.data.toLowerCase().includes(filterText.toLowerCase())) return false;
      return true;
    });
    const visible = filtered.slice(-MAX_VISIBLE);

    countEl.textContent = `${filtered.length} / ${logEntries.length}`;

    if (visible.length === 0) {
      outputEl.innerHTML = logEntries.length === 0
        ? '<div style="padding: 40px; text-align: center; color: var(--text-muted); font-family: var(--font-main); font-size: 13px;">No logs yet. Start the system to see output.</div>'
        : '<div style="padding: 40px; text-align: center; color: var(--text-muted); font-family: var(--font-main); font-size: 13px;">No logs match the current filter.</div>';
      return;
    }

    let html = '';
    for (const entry of visible) {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      const levelClass = entry.type === 'stderr' ? 'color: #ff453a;' : entry.type === 'stdout' ? 'color: #32d74b;' : 'color: var(--accent);';
      html += `<div style="display: flex; gap: 10px;">
        <span style="flex-shrink: 0; color: var(--text-muted); width: 70px;">${esc(time)}</span>
        <span style="flex-shrink: 0; width: 50px; font-weight: 700; ${levelClass}">${esc(entry.type)}</span>
        <span style="color: var(--text-main); white-space: pre-wrap; word-break: break-all;">${esc(entry.data)}</span>
      </div>`;
    }

    outputEl.innerHTML = html;
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  // Filters
  searchEl.addEventListener('input', () => {
    filterText = searchEl.value;
    render();
  });

  levelEl.addEventListener('change', () => {
    filterLevel = levelEl.value;
    render();
  });

  clearEl.addEventListener('click', () => {
    logEntries = [];
    render();
  });

  // Cleanup on page leave
  container.cleanup = () => {
    if (logSource) {
      logSource.close();
      logSource = null;
    }
  };

  connect();
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
