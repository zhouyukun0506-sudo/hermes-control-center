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
        <div class="card hero-card" style="margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between; padding: 24px 28px;">
          <div style="z-index: 2;">
            <div style="color: var(--accent); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Workbench</div>
            <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.3px; color: inherit;">
              ${online ? 'Systems Live' : 'System Paused'}
            </h2>
            <p style="color: var(--text-muted); font-size: 14px; max-width: 340px; line-height: 1.5; margin-bottom: 20px;">
              ${online ? 'All services are active and running. Your workspace is ready.' : 'The service is currently idle. Tap the broadcast control to start.'}
            </p>

            <div style="display: flex; gap: 10px;">
              ${!online ? `
                <button id="history-btn" class="glass-btn" style="border-radius: 20px; padding: 8px 20px; font-weight: 600; box-shadow: 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08);">
                  Initialize WebUI
                </button>
              ` : ''}
            </div>
          </div>

          <div id="power-btn" style="cursor: pointer; position: relative; width: 88px; height: 88px; display: flex; align-items: center; justify-content: center; z-index: 2; transition: transform 0.2s;">
            <div class="pulse-ring" style="position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 1.5px solid ${online ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}; opacity: ${online ? '0.2' : '0.5'}; animation: ${online ? 'pulse 2s infinite' : 'none'};"></div>
            <div style="width: 56px; height: 56px; border-radius: 50%; background: ${online ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.04)'}; display: flex; align-items: center; justify-content: center; transition: all 0.3s; box-shadow: ${online ? '0 4px 16px rgba(0,135,255,0.35), inset 0 1px 0 rgba(255,255,255,0.2)' : '0 2px 12px rgba(0,0,0,0.3), inset 0 2px 4px rgba(0,0,0,0.2), inset 0 -1px 0 rgba(255,255,255,0.05)'}; border: 1px solid ${online ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'};">
               <div style="color: ${online ? '#fff' : 'var(--text-main)'};">
                 ${online ? `
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12"></rect></svg>
                 ` : `
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="8 5 19 12 8 19 8 5" fill="rgba(255,255,255,0.9)" stroke="none"></polygon></svg>
                 `}
               </div>
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
      #power-btn:hover { transform: scale(1.04); }
      #power-btn:active { transform: scale(0.97); }
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

  const powerBtn = container.querySelector('#power-btn');
  if (powerBtn) {
    powerBtn.addEventListener('click', async () => {
      if (powerBtn.classList.contains('loading')) return;
      powerBtn.classList.add('loading');
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
        powerBtn.classList.remove('loading');
      }
    });
  }

  const historyBtn = container.querySelector('#history-btn');
  if (historyBtn) {
    historyBtn.addEventListener('click', async () => {
      if (historyBtn.classList.contains('loading')) return;
      historyBtn.classList.add('loading');
      historyBtn.textContent = 'Launching...';
      consoleLines = [];

      try {
        await api.ctrl.startWebUI((ev) => {
          if (ev.type === 'stdout' || ev.type === 'stderr') {
            consoleLines.push(ev.data.trim());
            updateConsole(container);
          }
        });
        await new Promise((r) => setTimeout(r, 2000));
        if (onStatusChange) onStatusChange(true);
      } catch (err) {
        consoleLines.push(`Error: ${err.message}`);
        updateConsole(container);
        historyBtn.classList.remove('loading');
        historyBtn.innerHTML = 'Initialize WebUI';
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

function formatUptime(seconds) {
  if (!seconds) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
