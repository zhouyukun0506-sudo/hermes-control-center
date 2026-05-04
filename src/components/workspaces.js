// ── Workspace Manager Component ──
import * as api from '../api.js';

export async function renderWorkspaces(container) {
  container.innerHTML = `
    <div class="page page-padded">
      <div style="max-width: 740px;">
        <div class="page-header">
          <h1 class="page-title">Workspaces</h1>
          <p class="page-subtitle">Manage directories the agent uses as context sources.</p>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 28px;">
          <input id="ws-path-input" type="text" placeholder="/path/to/project"
            style="flex: 1; background: var(--fill-quinary); border: 0.5px solid var(--fill-quaternary); border-radius: 10px;
                   padding: 10px 14px; color: var(--text-main); font-size: 14px; outline: none; font-family: var(--font-mono);">
          <button id="ws-add-btn" style="background: var(--accent-gradient); color: #fff; border: none; border-radius: 8px;
                  padding: 0 24px; font-weight: 600; font-size: 14px; cursor: pointer; white-space: nowrap;">
            + Add
          </button>
        </div>

        <div id="ws-list" style="display: flex; flex-direction: column; gap: 6px;">
          <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 14px;">Loading workspaces...</div>
        </div>
      </div>
    </div>
  `;

  const listEl = container.querySelector('#ws-list');
  const inputEl = container.querySelector('#ws-path-input');
  const addBtn = container.querySelector('#ws-add-btn');

  async function load() {
    try {
      const data = await api.workspaces.list();
      const workspaces = data.workspaces || data || [];
      const list = Array.isArray(workspaces) ? workspaces : [];

      if (list.length === 0) {
        listEl.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px;">No workspaces added yet.</div>';
        return;
      }

      listEl.innerHTML = list.map(ws => {
        const path = typeof ws === 'string' ? ws : ws.path || '';
        return '\
          <div class="card" style="display: flex; align-items: center; gap: 14px; padding: 16px 20px;">\
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" \
              stroke-linecap="round" stroke-linejoin="round" style="opacity: .5; flex-shrink: 0;">\
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>\
            <span style="flex: 1; font-size: 14px; font-family: var(--font-mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\
              ' + escapeHtml(path) + '\
            </span>\
            <button class="ws-remove-btn" data-path="' + escapeHtml(path) + '" \
              style="background: none; border: 0.5px solid var(--fill-quaternary); border-radius: 8px; \
                     color: var(--text-muted); font-size: 12px; padding: 6px 12px; cursor: pointer; \
                     transition: all .15s;">Remove</button>\
          </div>';
      }).join('');

      listEl.querySelectorAll('.ws-remove-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const path = btn.dataset.path;
          try {
            await api.workspaces.remove(path);
            load();
          } catch (err) {
            console.error('Remove failed:', err);
          }
        });
      });
    } catch (err) {
      listEl.innerHTML = '<div style="padding: 40px; text-align: center; color: #ff453a; font-size: 14px;">Failed to load workspaces.<br>WebUI may be offline.</div>';
    }
  }

  addBtn.addEventListener('click', async () => {
    const path = inputEl.value.trim();
    if (!path) return;
    try {
      await api.workspaces.add(path);
      inputEl.value = '';
      load();
    } catch (err) {
      console.error('Add failed:', err);
    }
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addBtn.click();
  });

  load();
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;');
}
