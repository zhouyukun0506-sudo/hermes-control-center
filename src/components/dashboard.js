// ── Dashboard Component (History-First Architecture) ──
import { icons } from '../utils/icons.js';
import * as api from '../api.js';

let consoleLines = [];

function ansiToHtml(text) {
  const map = { '0;32': '#32d74b', '0;31': '#ff453a', '1;33': '#ffcc00', '0;36': '#64d2ff', '0': 'inherit' };
  return text.replace(/\x1b\[([\d;]+)m/g, (m, c) => {
    if (c === '0') return '</span>';
    return `<span style="color: ${map[c] || '#aaa'}">`;
  }).replace(/\n/g, '<br>');
}

export function renderDashboard(container, { status, onStatusChange, onNavigate }) {
  const online = status?.webui_running;
  const gwOnline = status?.gateway_running;
  const ws = status?.webui_status;
  const ocOnline = status?.openclaw_running;
  const ocUrl = status?.openclaw_url;

  container.innerHTML = `
    <div class="page">
      <div class="page-padded">
        <div class="page-header">
          <h1 class="page-title">Control Center</h1>
          <div class="page-accent-bar"></div>
        </div>

        <!-- Hero Card -->
        <div class="card hero-card" style="margin-bottom: 28px; padding: 24px 28px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
            <div style="z-index: 2;">
              <div style="color: var(--accent); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Workbench</div>
              <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 4px; letter-spacing: -0.3px; color: inherit;">
                Control Center
              </h2>
              <p style="color: var(--text-muted); font-size: 13px; max-width: 400px; line-height: 1.5;">
                ${online ? 'Hermes is active.' : 'Hermes is idle.'} ${ocOnline ? 'OpenClaw detected.' : ''}
              </p>
            </div>
          </div>

          <div style="display: flex; gap: 16px;">
            <!-- Hermes Power -->
            <div style="flex:1; display:flex; align-items:center; gap:14px; background:rgba(255,255,255,0.03); border:0.5px solid rgba(255,255,255,0.06); border-radius:12px; padding:14px 18px;">
              <div id="power-btn-hermes" style="cursor:pointer; position:relative; width:52px; height:52px; flex-shrink:0; display:flex; align-items:center; justify-content:center; transition:transform 0.2s;">
                <div style="position:absolute; width:100%; height:100%; border-radius:50%; border:1.5px solid ${online ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}; opacity:${online ? '0.2' : '0.5'}; animation:${online ? 'pulse 2s infinite' : 'none'};"></div>
                <div style="width:40px; height:40px; border-radius:50%; background:${online ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.04)'}; display:flex; align-items:center; justify-content:center; transition:all 0.3s; box-shadow:${online ? '0 4px 16px rgba(0,135,255,0.35), inset 0 1px 0 rgba(255,255,255,0.2)' : '0 2px 12px rgba(0,0,0,0.3), inset 0 2px 4px rgba(0,0,0,0.2)'}; border:1px solid ${online ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'};">
                  <div style="color:${online ? '#fff' : 'var(--text-main)'};">
                    ${online
                      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="6" width="12" height="12"></rect></svg>'
                      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="8 5 19 12 8 19 8 5" fill="rgba(255,255,255,0.9)" stroke="none"></polygon></svg>'}
                  </div>
                </div>
              </div>
              <div>
                <div style="font-size:13px; font-weight:600; color:var(--text-main); margin-bottom:2px;">Hermes</div>
                <div style="font-size:11px; color:${online ? 'var(--online-color)' : 'var(--text-muted)'};">${online ? 'Running' : 'Stopped'}</div>
              </div>
              <button id="history-btn" class="glass-btn" style="margin-left:auto; border-radius:8px; padding:6px 14px; font-size:11px; font-weight:600; white-space:nowrap;">
                ${online ? 'Stop' : 'Start'}
              </button>
            </div>

            <!-- OpenClaw Power -->
            <div style="flex:1; display:flex; align-items:center; gap:14px; background:rgba(255,255,255,0.03); border:0.5px solid rgba(255,255,255,0.06); border-radius:12px; padding:14px 18px;">
              <div id="power-btn-openclaw" style="cursor:pointer; position:relative; width:52px; height:52px; flex-shrink:0; display:flex; align-items:center; justify-content:center; transition:transform 0.2s;">
                <div style="position:absolute; width:100%; height:100%; border-radius:50%; border:1.5px solid ${ocOnline ? '#32d74b' : 'rgba(255,255,255,0.12)'}; opacity:${ocOnline ? '0.2' : '0.5'}; animation:${ocOnline ? 'pulse 2s infinite' : 'none'};"></div>
                <div style="width:40px; height:40px; border-radius:50%; background:${ocOnline ? 'linear-gradient(135deg,#32d74b,#30d158)' : 'rgba(255,255,255,0.04)'}; display:flex; align-items:center; justify-content:center; transition:all 0.3s; box-shadow:${ocOnline ? '0 4px 16px rgba(50,215,75,0.35), inset 0 1px 0 rgba(255,255,255,0.2)' : '0 2px 12px rgba(0,0,0,0.3), inset 0 2px 4px rgba(0,0,0,0.2)'}; border:1px solid ${ocOnline ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'};">
                  <div style="color:${ocOnline ? '#fff' : 'var(--text-main)'};">
                    ${ocOnline
                      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="6" width="12" height="12"></rect></svg>'
                      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="8 5 19 12 8 19 8 5" fill="rgba(255,255,255,0.9)" stroke="none"></polygon></svg>'}
                  </div>
                </div>
              </div>
              <div>
                <div style="font-size:13px; font-weight:600; color:var(--text-main); margin-bottom:2px;">OpenClaw</div>
                <div style="font-size:11px; color:${ocOnline ? 'var(--online-color)' : 'var(--text-muted)'};">${ocOnline ? `Running :${ocUrl?.replace('http://127.0.0.1', '') || ''}` : 'Not Found'}</div>
              </div>
              <button id="openclaw-status-btn" class="glass-btn" style="margin-left:auto; border-radius:8px; padding:6px 14px; font-size:11px; font-weight:600; white-space:nowrap; ${ocOnline ? 'color:var(--online-color);' : ''}">
                ${ocOnline ? 'Open' : 'N/A'}
              </button>
            </div>
          </div>
        </div>

        <h3 style="font-size: 17px; font-weight: 600; margin-bottom: 16px; letter-spacing: -0.2px;">Live Telemetry</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 32px;">
          <div class="card" style="padding: 18px;">
            <div style="color: var(--text-muted); font-size: 10px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.8px;">Service</div>
            <div style="font-size: 18px; font-weight: 600; color: ${online ? 'var(--online-color)' : 'var(--error-color)'}; display: flex; align-items: center; gap: 8px;">
              <div style="width: 6px; height: 6px; border-radius: 50%; background: currentColor;"></div>
              ${online ? 'Active' : 'Offline'}
            </div>
          </div>
          <div class="card" style="padding: 18px;">
            <div style="color: var(--text-muted); font-size: 10px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.8px;">Gateway</div>
            <div style="font-size: 18px; font-weight: 600; color: ${gwOnline ? 'var(--online-color)' : 'var(--error-color)'};">${gwOnline ? 'OK' : 'Error'}</div>
          </div>
          <div class="card" style="padding: 18px;">
            <div style="color: var(--text-muted); font-size: 10px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.8px;">Sessions</div>
            <div style="font-size: 18px; font-weight: 600;">${ws?.sessions ?? '0'}</div>
          </div>
          <div class="card" style="padding: 18px;">
            <div style="color: var(--text-muted); font-size: 10px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.8px;">Uptime</div>
            <div style="font-size: 18px; font-weight: 600;">${formatUptime(ws?.uptime_seconds)}</div>
          </div>
          <div class="card" style="padding: 18px; cursor: ${ocOnline ? 'pointer' : 'default'};" ${ocOnline ? `onclick="window.__navigateTo && window.__navigateTo('openclaw_webui')"` : ''}>
            <div style="color: var(--text-muted); font-size: 10px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.8px;">OpenClaw</div>
            <div style="font-size: 18px; font-weight: 600; color: ${ocOnline ? 'var(--online-color)' : 'var(--text-muted)'}; display: flex; align-items: center; gap: 8px;">
              <div style="width: 6px; height: 6px; border-radius: 50%; background: currentColor;"></div>
              ${ocOnline ? `Active :${ocUrl?.replace('http://127.0.0.1', '') || ''}` : 'Not Found'}
            </div>
          </div>
        </div>

        <div id="console-host">
           ${consoleLines.length > 0 ? `<div class="console-output">${ansiToHtml(consoleLines.join('\n'))}</div>` : ''}
        </div>

        <!-- WebUI Tabs -->
        <div style="margin-top: 24px;">
          <div style="display:flex;gap:2px;background:var(--fill-quinary);border-radius:10px;padding:3px;margin-bottom:16px;" id="webui-tabs">
            <button class="webui-tab active" data-tab="hermes" style="flex:1;padding:8px 16px;border:none;border-radius:8px;background:var(--accent-gradient);color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;">
              Hermes${online ? ' · Online' : ''}
            </button>
            <button class="webui-tab${ocOnline ? ' active' : ''}" data-tab="openclaw" style="flex:1;padding:8px 16px;border:none;border-radius:8px;background:${ocOnline && !online ? 'var(--accent-gradient)' : 'transparent'};color:${ocOnline && !online ? '#fff' : 'var(--text-muted)'};font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;transition:all .15s;">
              OpenClaw${ocOnline ? ` · :${ocUrl?.replace('http://127.0.0.1', '') || ''}` : ' · Not Found'}
            </button>
          </div>
          <div id="webui-frame" style="border-radius:12px;overflow:hidden;border:0.5px solid rgba(255,255,255,0.06);background:#000;height:500px;">
            <iframe id="webui-iframe-hermes" src="http://localhost:8787/" style="width:100%;height:100%;border:none;display:block;"></iframe>
            ${ocOnline ? `<iframe id="webui-iframe-openclaw" src="${escAttr(ocUrl)}" style="width:100%;height:100%;border:none;display:none;"></iframe>` : ''}
          </div>
        </div>

        <!-- Sticky Notes -->
        <div class="notes-section" style="margin-top: 24px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <h3 style="font-size:17px;font-weight:600;letter-spacing:-0.2px;">Quick Notes</h3>
            <button id="notes-add-btn" class="glass-btn" style="font-size:11px;padding:4px 10px;height:28px;">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Note
            </button>
          </div>
          <div id="notes-list" style="display:flex;flex-direction:column;gap:6px;"></div>
        </div>

    <style>
      #power-btn-hermes:hover, #power-btn-openclaw:hover { transform: scale(1.04); }
      #power-btn-hermes:active, #power-btn-openclaw:active { transform: scale(0.97); }
      #history-btn:hover { background: rgba(255,255,255,0.1); }
      .console-output {
        background: var(--fill-quinary);
        border: 0.5px solid var(--fill-quaternary);
        border-radius: 10px;
        padding: 14px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        color: var(--text-muted);
        max-height: 160px;
        overflow-y: auto;
        white-space: pre-wrap;
      }
      .note-card { animation: fadeIn .2s ease; }
      .note-card textarea {
        resize: vertical; min-height: 48px; max-height: 200px;
        background: transparent; border: none; outline: none;
        color: var(--text-main); font-size: 12px; font-family: inherit; line-height: 1.5;
      }
      .note-card textarea::placeholder { color: var(--text-tertiary); }
    </style>
  `;

  // ── Hermes Start/Stop (shared by power circle + text button) ──
  function handleHermesToggle() {
    return async () => {
      const btns = [hermesPowerBtn, historyBtn].filter(Boolean);
      if (btns.some(b => b.classList.contains('loading'))) return;
      btns.forEach(b => b.classList.add('loading'));
      if (historyBtn) historyBtn.textContent = online ? 'Stopping...' : 'Starting...';
      consoleLines = [];

      try {
        if (online) {
          await api.ctrl.stop((ev) => {
            if (ev.type === 'stdout' || ev.type === 'stderr') {
              consoleLines.push(ev.data.trim());
              updateConsole(container);
            }
          });
        } else {
          await api.ctrl.start((ev) => {
            if (ev.type === 'stdout' || ev.type === 'stderr') {
              consoleLines.push(ev.data.trim());
              updateConsole(container);
            }
          });
        }
        await new Promise((r) => setTimeout(r, 2000));
        if (onStatusChange) onStatusChange(true);
      } catch (err) {
        consoleLines.push(`Error: ${err.message}`);
        updateConsole(container);
        btns.forEach(b => b.classList.remove('loading'));
        if (historyBtn) historyBtn.textContent = online ? 'Stop' : 'Start';
      }
    };
  }

  const hermesPowerBtn = container.querySelector('#power-btn-hermes');
  const historyBtn = container.querySelector('#history-btn');
  if (hermesPowerBtn) hermesPowerBtn.addEventListener('click', handleHermesToggle());
  if (historyBtn) historyBtn.addEventListener('click', handleHermesToggle());

  // ── OpenClaw Power Button ──
  const ocPowerBtn = container.querySelector('#power-btn-openclaw');
  if (ocPowerBtn) {
    ocPowerBtn.addEventListener('click', () => {
      if (ocOnline && ocUrl) {
        window.__navigateTo && window.__navigateTo('openclaw_webui');
      }
    });
  }

  // ── OpenClaw Open/N/A Button ──
  const ocStatusBtn = container.querySelector('#openclaw-status-btn');
  if (ocStatusBtn) {
    ocStatusBtn.addEventListener('click', () => {
      if (ocOnline && ocUrl) {
        window.__navigateTo && window.__navigateTo('openclaw_webui');
      }
    });
  }

  // ── Sticky Notes ──
  const NOTES_KEY = 'hermes_notes';
  function getNotes() { try { const r = localStorage.getItem(NOTES_KEY); return r ? JSON.parse(r) : []; } catch { return []; } }
  function saveNotes(notes) { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); }

  function renderNotes() {
    const list = container.querySelector('#notes-list');
    if (!list) return;
    const notes = getNotes();
    if (notes.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-tertiary);font-size:12px;">No notes yet. Click "Add Note" to start.</div>';
      return;
    }
    list.innerHTML = notes.map(n => `
      <div class="note-card" data-id="${n.id}" style="background:var(--fill-quaternary);border-radius:8px;padding:10px 10px 6px;border:0.5px solid rgba(255,255,255,0.04);">
        <textarea placeholder="Write something..." style="width:100%;">${escHtml(n.text)}</textarea>
        <div style="display:flex;justify-content:flex-end;gap:4px;padding-top:4px;">
          <button class="note-delete-btn" data-id="${n.id}" style="width:22px;height:22px;border:none;border-radius:4px;background:transparent;color:var(--text-tertiary);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;" title="Delete">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.note-card textarea').forEach(ta => {
      const id = ta.closest('.note-card').dataset.id;
      ta.addEventListener('input', () => {
        const notes = getNotes();
        const n = notes.find(n => n.id === id);
        if (n) { n.text = ta.value; saveNotes(notes); }
      });
    });

    list.querySelectorAll('.note-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        saveNotes(getNotes().filter(n => n.id !== btn.dataset.id));
        renderNotes();
      });
    });
  }

  container.querySelector('#notes-add-btn').addEventListener('click', () => {
    const notes = getNotes();
    notes.unshift({ id: 'note_' + Date.now(), text: '' });
    saveNotes(notes);
    renderNotes();
    setTimeout(() => {
      const first = container.querySelector('.note-card textarea');
      if (first) first.focus();
    }, 50);
  });

  renderNotes();

  // ── WebUI Tab Switching ──
  const tabs = container.querySelectorAll('.webui-tab');
  const hermesFrame = container.querySelector('#webui-iframe-hermes');
  const openclawFrame = container.querySelector('#webui-iframe-openclaw');
  let activeTab = online ? 'hermes' : (ocOnline ? 'openclaw' : 'hermes');

  function switchTab(tab) {
    activeTab = tab;
    tabs.forEach(t => {
      const isActive = t.dataset.tab === tab;
      t.classList.toggle('active', isActive);
      if (isActive) {
        t.style.background = 'var(--accent-gradient)';
        t.style.color = '#fff';
        t.style.fontWeight = '600';
      } else {
        t.style.background = 'transparent';
        t.style.color = 'var(--text-muted)';
        t.style.fontWeight = '500';
      }
    });
    if (hermesFrame) hermesFrame.style.display = tab === 'hermes' ? 'block' : 'none';
    if (openclawFrame) openclawFrame.style.display = tab === 'openclaw' ? 'block' : 'none';
  }

  tabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
  switchTab(activeTab);
}

function updateConsole(container) {
  let host = container.querySelector('#console-host');
  if (!host) return;
  if (!host.querySelector('.console-output')) {
    host.innerHTML = `<div class="console-output"></div>`;
  }
  const el = host.querySelector('.console-output');
  el.innerHTML = ansiToHtml(consoleLines.join('\n'));
  el.scrollTop = el.scrollHeight;
}

function escHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function escAttr(s) { return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function formatUptime(seconds) {
  if (!seconds) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
