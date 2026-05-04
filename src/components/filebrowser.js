// ── File Browser Component (native fs backend) ──

const BASE = '';

async function fetchJSON(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function renderFileBrowser(container) {
  container.innerHTML = `
    <div class="page page-padded" style="display: flex; flex-direction: column; height: 100%; padding-bottom: 0;">
      <div style="margin-bottom: 24px;">
        <div class="page-header" style="margin-bottom: 0;">
          <h1 class="page-title">File Browser</h1>
          <p class="page-subtitle">Browse local files.</p>
        </div>
      </div>

      <div style="display: flex; gap: 16px; flex: 1; min-height: 0;">
        <div style="width: 300px; flex-shrink: 0; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; gap: 6px;">
            <input id="fb-path" type="text" value="~"
              style="flex:1; background: var(--fill-quinary); border: 0.5px solid var(--fill-quaternary); border-radius: 8px;
                     padding: 8px 12px; color: var(--text-main); font-size: 13px; outline: none; font-family: var(--font-mono);">
            <button id="fb-go" style="background: var(--fill-quinary); border: 0.5px solid var(--fill-quaternary); border-radius: 8px;
                    color: var(--text-main); padding: 8px 12px; cursor: pointer; font-size: 13px; font-family: inherit;">Go</button>
          </div>
          <div id="fb-tree" style="flex: 1; overflow-y: auto; background: var(--fill-quinary); border: 0.5px solid var(--fill-quaternary);
               border-radius: 10px; padding: 8px;">
            <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">
              Enter a path and click Go, or click a directory below.
            </div>
          </div>
        </div>
        <div id="fb-preview" style="flex: 1; background: var(--fill-quinary); border: 0.5px solid var(--fill-quaternary); border-radius: 10px;
             overflow-y: auto; padding: 24px; font-family: var(--font-mono); font-size: 12px; line-height: 1.6; white-space: pre-wrap; word-break: break-all;">
          <div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 13px; font-family: var(--font-main);">
            Select a file to preview
          </div>
        </div>
      </div>
    </div>
  `;

  const pathInput = container.querySelector('#fb-path');
  const goBtn = container.querySelector('#fb-go');
  const treeEl = container.querySelector('#fb-tree');
  const previewEl = container.querySelector('#fb-preview');

  let currentPath = '';

  async function loadDir(dir) {
    currentPath = dir;
    pathInput.value = dir;
    treeEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">Loading...</div>';
    try {
      const data = await fetchJSON(`/ctrl/list?path=${encodeURIComponent(dir)}`);
      const entries = data.entries || [];
      if (entries.length === 0) {
        treeEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">(empty directory)</div>';
        return;
      }
      let parentLink = '';
      if (dir !== '/') {
        const parentPath = dir.replace(/\/+$/, '').split('/').slice(0, -1).join('/') || '/';
        parentLink = '\
          <div class="fb-entry fb-parent" data-path="' + esc(parentPath) + '" \
               style="padding: 6px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 8px; \
                      font-size: 12px; color: var(--accent); font-weight: 600; transition: background .1s; margin-bottom: 4px;">\
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink:0;"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
            <span>..</span>\
          </div>';
      }
      treeEl.innerHTML = parentLink + entries.map(e => {
        const isDir = e.type === 'directory';
        const fullPath = dir === '/' ? '/' + e.name : dir + '/' + e.name;
        const sizeStr = e.size > 1024 * 1024
          ? (e.size / 1024 / 1024).toFixed(1) + ' MB'
          : e.size > 1024
            ? (e.size / 1024).toFixed(1) + ' KB'
            : e.size + ' B';
        return '\
          <div class="fb-entry" data-path="' + esc(fullPath) + '" data-dir="' + isDir + '" \
               style="padding: 5px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 8px; \
                      font-size: 12px; transition: background .1s;">\
            <span style="flex-shrink: 0; display:flex; align-items:center; width:16px; height:16px;">' + (isDir
              ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'
              : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>') + '</span>\
            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + esc(e.name) + '</span>\
            ' + (!isDir ? '<span style="color: var(--text-muted); font-size: 10px; flex-shrink: 0;">' + sizeStr + '</span>' : '') + '\
          </div>';
      }).join('');

      treeEl.querySelectorAll('.fb-entry').forEach(el => {
        el.addEventListener('click', async () => {
          const p = el.dataset.path;
          if (el.dataset.dir === 'true') {
            loadDir(p);
          } else {
            previewEl.innerHTML = '<div style="padding: 20px; color: var(--text-muted); font-size: 13px; font-family: var(--font-main);">Loading...</div>';
            try {
              const data = await fetchJSON(`/ctrl/file?path=${encodeURIComponent(p)}`);
              previewEl.textContent = data.content || '(empty)';
            } catch (err) {
              previewEl.innerHTML = '<div style="padding: 20px; text-align: center; color: #ff453a; font-size: 13px; font-family: var(--font-main);">' + esc(err.message) + '</div>';
            }
          }
        });
      });
    } catch (err) {
      treeEl.innerHTML = '<div style="padding: 20px; text-align: center; color: #ff453a; font-size: 13px;">' + esc(err.message) + '</div>';
    }
  }

  goBtn.addEventListener('click', () => {
    const dir = pathInput.value.trim();
    if (dir) loadDir(dir);
  });

  pathInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') goBtn.click();
  });

  // Initial load
  loadDir('~');
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
