// ── Session Manager Component ──
import * as api from '../api.js';
import { icons } from '../utils/icons.js';

let currentSessions = [];
let currentFilter = '';

export async function renderSessionManager(container) {
  container.innerHTML = `
    <div class="page page-padded">
      <div style="max-width: 900px;">
        <div style="margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
          <div class="page-header" style="margin-bottom: 0;">
            <h1 class="page-title">Session Manager</h1>
            <p class="page-subtitle">View and manage active chat sessions.</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <input id="sm-search" type="text" placeholder="Search sessions..." value="${esc(currentFilter)}"
              style="background: var(--fill-quinary); border: 0.5px solid var(--fill-quaternary); border-radius: 8px;
                     padding: 8px 12px; color: var(--text-main); font-size: 13px; outline: none; width: 200px; font-family: inherit;">
            <button id="sm-refresh" style="background: var(--fill-quinary); border: 0.5px solid var(--fill-quaternary); border-radius: 8px;
                    color: var(--text-main); padding: 8px 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; font-family: inherit;">
              ${icons.refresh} Refresh
            </button>
          </div>
        </div>
        <div id="sm-content">
          <div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px;">Loading sessions...</div>
        </div>
      </div>
    </div>
  `;

  const contentEl = container.querySelector('#sm-content');
  const searchEl = container.querySelector('#sm-search');
  const refreshEl = container.querySelector('#sm-refresh');

  async function load() {
    contentEl.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px;">Loading sessions...</div>';
    try {
      const data = await api.sessions.list();
      const sessions = Array.isArray(data) ? data : (data.sessions || data.data || []);
      if (sessions.length === 0) {
        contentEl.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px;">No active sessions.</div>';
        currentSessions = [];
        return;
      }
      currentSessions = sessions;
      renderSessions(contentEl, sessions, currentFilter);
    } catch {
      contentEl.innerHTML = '<div style="padding: 40px; text-align: center; color: #ff453a; font-size: 14px;">Failed to load sessions.<br>WebUI may be offline.</div>';
    }
  }

  searchEl.addEventListener('input', () => {
    currentFilter = searchEl.value;
    renderSessions(contentEl, currentSessions, currentFilter);
  });

  refreshEl.addEventListener('click', load);
  load();
}

function renderSessions(containerEl, sessions, filter) {
  const filtered = filter
    ? sessions.filter(s => {
        const search = filter.toLowerCase();
        const title = (s.title || s.name || s.id || '').toLowerCase();
        const id = (s.session_id || s.id || '').toLowerCase();
        return title.includes(search) || id.includes(search);
      })
    : sessions;

  if (filtered.length === 0) {
    containerEl.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px;">No sessions match your search.</div>';
    return;
  }

  containerEl.innerHTML = filtered.map(s => {
    const id = s.session_id || s.id || '';
    const title = s.title || s.name || 'Untitled';
    const model = s.model || s.model_id || '—';
    const msgCount = s.messages || s.message_count || s.total_messages || 0;
    const created = s.created_at || s.created || s.timestamp || '';
    const preview = s.last_message || s.preview || '';
    const dateStr = formatDate(created);

    return `
      <div class="card sm-session" style="padding: 18px 20px; margin-bottom: 10px; display: flex; align-items: center; gap: 16px; cursor: default;">
        <div style="width: 36px; height: 36px; border-radius: 10px; background: var(--accent-gradient);
                    display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; color: #fff;">
          ${icons.chat.replace('stroke-width="2"', 'stroke-width="2" width="16" height="16"')}
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${esc(title)}
          </div>
          <div style="display: flex; gap: 12px; font-size: 11px; color: var(--text-muted);">
            <span>${esc(model)}</span>
            <span>${msgCount} msgs</span>
            ${dateStr ? `<span>${dateStr}</span>` : ''}
          </div>
          ${preview ? `<div style="font-size: 12px; color: var(--text-muted); margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(preview)}</div>` : ''}
        </div>
        <div style="display: flex; gap: 6px; flex-shrink: 0;">
          <button class="sm-delete" data-id="${esc(id)}" style="background: rgba(255,69,58,0.15); border: none; color: #ff453a;
                  padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 4px;">
            ${icons.trash.replace('stroke-width="2"', 'stroke-width="2" width="14" height="14"')}
            Delete
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Delete handlers
  containerEl.querySelectorAll('.sm-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const sessionId = btn.dataset.id;
      const card = btn.closest('.sm-session');
      card.style.opacity = '0.4';
      btn.disabled = true;
      btn.textContent = 'Deleting...';
      try {
        await api.sessions.delete(sessionId);
        currentSessions = currentSessions.filter(s => (s.session_id || s.id) !== sessionId);
        // Remove card with animation
        card.style.transition = 'all 0.3s';
        card.style.opacity = '0';
        card.style.transform = 'translateX(20px)';
        setTimeout(() => {
          renderSessions(containerEl, currentSessions, currentFilter || '');
        }, 300);
      } catch (err) {
        card.style.opacity = '1';
        btn.disabled = false;
        btn.innerHTML = `${icons.trash.replace('stroke-width="2"', 'stroke-width="2" width="14" height="14"')} Delete`;
        showError(containerEl, err.message);
      }
    });
  });
}

function showError(containerEl, msg) {
  const existing = containerEl.querySelector('.sm-error');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'sm-error';
  el.style.cssText = 'padding: 12px 16px; margin-bottom: 10px; background: rgba(255,69,58,0.1); border-radius: 10px; color: #ff453a; font-size: 13px;';
  el.textContent = msg;
  containerEl.prepend(el);
  setTimeout(() => el.remove(), 4000);
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
