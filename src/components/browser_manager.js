// ── Browser Page Manager (Add / Edit / Delete Custom Pages) ──
import { getCustomPages, saveCustomPages, resetToDefaults, generateId } from '../utils/pageConfig.js';
import { ICON_MAP, PICKER_ICONS } from '../utils/icons.js';

export function renderBrowserManager(container) {
  let editingId = null;
  let selectedIcon = null;

  function render() {
    const pages = getCustomPages();

    container.innerHTML = `
      <div style="padding:24px; height:100%; overflow-y:auto; animation:fadeIn .3s ease;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
          <h2 style="font-size:18px; font-weight:600; color:var(--text-main); margin:0;">Browser Pages</h2>
          <button class="glass-btn glass-btn-sm" id="bm-add-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Page
          </button>
        </div>

        <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:12px;">
          Manage your browser-based agent pages. Add, edit, or remove pages below.
          The <strong>Core UI</strong> is always available in the sidebar and cannot be modified.
        </div>

        <div id="bm-form" style="display:none; margin-bottom:16px; padding:16px; border-radius:10px; background:var(--fill-quaternary);">
          <h3 id="bm-form-title" style="font-size:14px; font-weight:600; color:var(--text-main); margin:0 0 12px;">Add Page</h3>
          <div style="display:flex; flex-direction:column; gap:10px;">
            <div>
              <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:4px;">Label</label>
              <input id="bm-label" type="text" style="width:100%; padding:8px 10px; border-radius:6px; border:0.5px solid rgba(255,255,255,0.1); background:var(--fill-quinary); color:var(--text-main); font-size:13px; font-family:inherit; outline:none; transition:border-color .15s;">
            </div>
            <div>
              <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:4px;">URL</label>
              <input id="bm-url" type="text" style="width:100%; padding:8px 10px; border-radius:6px; border:0.5px solid rgba(255,255,255,0.1); background:var(--fill-quinary); color:var(--text-main); font-size:13px; font-family:inherit; outline:none; transition:border-color .15s;" placeholder="https://example.com">
            </div>
            <div>
              <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:4px;">Icon</label>
              <div id="bm-icon-grid" style="display:flex; flex-wrap:wrap; gap:5px;">
                ${PICKER_ICONS.map(name => `
                  <div class="bm-icon-opt" data-icon="${name}" style="width:34px;height:34px;border-radius:7px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:var(--fill-quinary);color:var(--text-tertiary);transition:all .12s;">
                    ${ICON_MAP[name]}
                  </div>
                `).join('')}
              </div>
            </div>
            <div style="display:flex; gap:8px; margin-top:4px;">
              <button class="glass-btn" id="bm-cancel-btn" style="font-size:12px; padding:6px 14px;">Cancel</button>
              <button class="glass-btn" id="bm-save-btn" style="font-size:12px; padding:6px 14px; background:var(--accent); border-color:var(--accent);">Save</button>
            </div>
          </div>
        </div>

        <div id="bm-list" style="display:flex; flex-direction:column; gap:6px;">
          ${pages.length === 0 ? `
            <div style="text-align:center; padding:40px 20px; color:var(--text-tertiary); font-size:13px;">
              <div style="font-size:28px; margin-bottom:8px; opacity:0.3;">${ICON_MAP.browser}</div>
              No custom browser pages yet.
              <br>Click <strong>"Add Page"</strong> to get started.
            </div>
          ` : pages.map((p, i) => `
            <div class="bm-page-row" draggable="true" data-id="${p.id}" data-index="${i}" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;background:var(--fill-quaternary);transition:background .15s,box-shadow .15s;cursor:grab;user-select:none;">
              <span class="bm-grip" style="width:16px;height:20px;display:flex;align-items:center;justify-content:center;color:var(--text-quaternary);flex-shrink:0;cursor:grab;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="5" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="5" r="1.5" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="9" cy="19" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="19" r="1.5" fill="currentColor" stroke="none"/></svg>
              </span>
              <span style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);flex-shrink:0;">${ICON_MAP[p.icon] || ICON_MAP.browser}</span>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:500;color:var(--text-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(p.label)}</div>
                <div style="font-size:10px;color:var(--text-tertiary);font-family:var(--font-mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(p.url)}</div>
              </div>
              <div style="display:flex;gap:2px;flex-shrink:0;">
                <button class="bm-edit-btn" data-id="${p.id}" style="width:24px;height:24px;border:none;border-radius:5px;background:transparent;color:var(--text-tertiary);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;" title="Edit">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="bm-delete-btn" data-id="${p.id}" style="width:24px;height:24px;border:none;border-radius:5px;background:transparent;color:var(--text-tertiary);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;" title="Delete">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          `).join('')}
        </div>

        ${pages.length > 0 ? `
          <button class="glass-btn" id="bm-reset-btn" style="margin-top:16px; font-size:12px; padding:6px 14px; color:var(--text-muted);">Reset to Defaults</button>
        ` : ''}
      </div>
    `;

    attachEvents(pages);
  }

  function attachEvents(pages) {
    const form = container.querySelector('#bm-form');
    const labelInput = container.querySelector('#bm-label');
    const urlInput = container.querySelector('#bm-url');
    const formTitle = container.querySelector('#bm-form-title');

    // Add button
    container.querySelector('#bm-add-btn')?.addEventListener('click', () => {
      editingId = null;
      selectedIcon = null;
      formTitle.textContent = 'Add Page';
      labelInput.value = '';
      urlInput.value = '';
      form.style.display = 'block';
      clearIconSelection();
      labelInput.focus();
    });

    // Cancel
    container.querySelector('#bm-cancel-btn')?.addEventListener('click', () => {
      form.style.display = 'none';
      editingId = null;
    });

    // Save
    container.querySelector('#bm-save-btn')?.addEventListener('click', () => {
      const label = labelInput.value.trim();
      let url = urlInput.value.trim();
      if (!label) { shakeElement(labelInput); return; }
      if (!url) { shakeElement(urlInput); return; }
      if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
      if (!selectedIcon && !editingId) { shakeElement(container.querySelector('#bm-icon-grid')); return; }

      let pages = getCustomPages();

      if (editingId) {
        pages = pages.map(p => {
          if (p.id === editingId) {
            return { ...p, label, url, icon: selectedIcon || p.icon };
          }
          return p;
        });
      } else {
        pages.push({ id: generateId(), label, url, icon: selectedIcon || 'globe' });
      }

      saveCustomPages(pages);
      form.style.display = 'none';
      editingId = null;
      refreshSidebarAndNav();
      render();
    });

    // Icon picker
    container.querySelectorAll('.bm-icon-opt').forEach(el => {
      el.addEventListener('click', () => {
        clearIconSelection();
        el.style.background = 'var(--accent-bg)';
        el.style.color = 'var(--accent)';
        selectedIcon = el.dataset.icon;
      });
    });

    // Edit
    container.querySelectorAll('.bm-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const page = pages.find(p => p.id === id);
        if (!page) return;

        editingId = id;
        formTitle.textContent = 'Edit Page';
        labelInput.value = page.label;
        urlInput.value = page.url;
        selectedIcon = page.icon;
        form.style.display = 'block';

        clearIconSelection();
        container.querySelector(`.bm-icon-opt[data-icon="${page.icon}"]`)?.style.setProperty('background', 'var(--accent-bg)');
        container.querySelector(`.bm-icon-opt[data-icon="${page.icon}"]`)?.style.setProperty('color', 'var(--accent)');

        labelInput.focus();
      });
    });

    // Delete
    container.querySelectorAll('.bm-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (!confirm('Delete this browser page?')) return;

        let pages = getCustomPages();
        pages = pages.filter(p => p.id !== id);
        saveCustomPages(pages);

        // If currently viewing the deleted page, navigate to dashboard
        const currentPage = window.__currentPage;
        if (currentPage === id && window.__navigateTo) {
          window.__navigateTo('dashboard');
        }

        refreshSidebarAndNav();
        render();
      });
    });

    // Drag-and-drop reorder
    const list = container.querySelector('#bm-list');
    let dragSrcId = null;

    list.addEventListener('dragstart', (e) => {
      const row = e.target.closest('.bm-page-row');
      if (!row) return;
      dragSrcId = row.dataset.id;
      row.style.opacity = '0.4';
      e.dataTransfer.effectAllowed = 'move';
    });

    list.addEventListener('dragend', (e) => {
      const row = e.target.closest('.bm-page-row');
      if (row) row.style.opacity = '';
      list.querySelectorAll('.bm-page-row').forEach(r => {
        r.style.boxShadow = '';
        r.style.background = '';
      });
      dragSrcId = null;
    });

    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      const target = e.target.closest('.bm-page-row');
      if (!target || target.dataset.id === dragSrcId) return;
      // Show insertion line above/below based on mouse position
      const rect = target.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      target.style.boxShadow = e.clientY < mid ? '0 -2px 0 var(--accent)' : '0 2px 0 var(--accent)';
    });

    list.addEventListener('dragleave', (e) => {
      const target = e.target.closest('.bm-page-row');
      if (target) target.style.boxShadow = '';
    });

    list.addEventListener('drop', (e) => {
      e.preventDefault();
      const target = e.target.closest('.bm-page-row');
      if (!target || !dragSrcId || target.dataset.id === dragSrcId) return;

      let pages = getCustomPages();
      const fromIdx = pages.findIndex(p => p.id === dragSrcId);
      const toIdx = pages.findIndex(p => p.id === target.dataset.id);
      if (fromIdx === -1 || toIdx === -1) return;

      const [moved] = pages.splice(fromIdx, 1);
      pages.splice(toIdx, 0, moved);
      saveCustomPages(pages);
      refreshSidebarAndNav();
      render();
    });

    // Reset
    container.querySelector('#bm-reset-btn')?.addEventListener('click', () => {
      if (!confirm('Reset all browser pages to defaults? This will replace your custom entries.')) return;
      resetToDefaults();
      refreshSidebarAndNav();
      render();
    });
  }

  function clearIconSelection() {
    container.querySelectorAll('.bm-icon-opt').forEach(el => {
      el.style.background = '';
      el.style.color = '';
    });
  }

  function shakeElement(el) {
    if (!el) return;
    el.style.animation = 'none';
    void el.offsetHeight;
    el.style.animation = 'shake 0.3s ease';
    setTimeout(() => { el.style.animation = ''; }, 300);
  }

  render();
}

function refreshSidebarAndNav() {
  if (window.refreshNav) window.refreshNav();
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
