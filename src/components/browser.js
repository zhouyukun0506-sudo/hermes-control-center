// ── Workspace Browser Component ──
import { icons } from '../utils/icons.js';
import * as api from '../api.js';

export function renderBrowser(container) {
  let currentWorkspace = null;
  let currentDir = '';
  let items = [];

  async function loadWorkspaces() {
    try {
      const ws = await api.workspaces.list();
      if (ws.length > 0) {
        currentWorkspace = ws[0];
        currentDir = ws[0];
        await loadDir();
      } else {
        renderEmpty();
      }
    } catch (err) {
      renderError(err.message);
    }
  }

  async function loadDir() {
    try {
      items = await api.files.list(currentDir, currentWorkspace);
      render();
    } catch (err) {
      renderError(err.message);
    }
  }

  function renderEmpty() {
    container.innerHTML = `
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">WORKSPACE_BROWSER</h1>
          <p class="page-subtitle">No active workspaces found. Add one in Hermes WebUI.</p>
        </div>
      </div>
    `;
  }

  function renderError(msg) {
    container.innerHTML = `
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">BROWSER_ERROR</h1>
          <p class="page-subtitle" style="color: var(--error-color);">${msg}</p>
        </div>
      </div>
    `;
  }

  function render() {
    container.innerHTML = `
      <div class="page" style="display:flex; flex-direction:column; height:100%;">
        <div class="page-header">
          <h1 class="page-title">WORKSPACE_BROWSER</h1>
          <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
            <div style="font-family:var(--font-mono); font-size:11px; color:var(--text-muted); background:var(--fill-quinary); padding:4px 8px; border:0.5px solid var(--fill-quaternary); border-radius:6px; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              ${currentDir}
            </div>
            <button id="btn-up" class="btn" style="padding:4px 8px;">UP</button>
          </div>
        </div>

        <div class="card" style="flex:1; overflow-y:auto; padding:0;">
          <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead style="background:var(--fill-quinary); border-bottom:0.5px solid var(--fill-quaternary); position:sticky; top:0; z-index:5;">
              <tr>
                <th style="text-align:left; padding:10px 12px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted);">NAME</th>
                <th style="text-align:left; padding:10px 12px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted);">TYPE</th>
                <th style="text-align:right; padding:10px 12px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted);">SIZE</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr class="browser-row" data-path="${item.path}" data-type="${item.type}" style="border-bottom:0.5px solid var(--fill-quaternary); cursor:pointer;">
                  <td style="padding:10px 12px; display:flex; align-items:center; gap:8px;">
                    <span style="color: ${item.type === 'directory' ? 'var(--accent)' : 'var(--text-muted)'};">
                      ${item.type === 'directory' ? icons.folder : icons.file}
                    </span>
                    ${item.name}
                  </td>
                  <td style="padding:10px 12px; color:var(--text-muted); font-size:11px;">${item.type.toUpperCase()}</td>
                  <td style="padding:10px 12px; text-align:right; color:var(--text-muted); font-size:11px;">
                    ${item.type === 'file' ? formatSize(item.size) : '--'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Row clicks
    container.querySelectorAll('.browser-row').forEach(row => {
      row.addEventListener('click', () => {
        const path = row.dataset.path;
        const type = row.dataset.type;
        if (type === 'directory') {
          currentDir = path;
          loadDir();
        } else {
          alert(`Selected File: ${path}\n(Preview not yet implemented)`);
        }
      });
    });

    // Up button
    const upBtn = container.querySelector('#btn-up');
    if (upBtn) {
      upBtn.addEventListener('click', () => {
        if (currentDir === currentWorkspace) return;
        const parts = currentDir.split('/');
        parts.pop();
        currentDir = parts.join('/');
        loadDir();
      });
    }
  }

  loadWorkspaces();
}

function formatSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
