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
            <div style="color: var(--accent); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Hermes Core</div>
            <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.3px; color: inherit;">
              ${online ? 'Systems Live' : 'System Paused'}
            </h2>
            <p style="color: var(--text-muted); font-size: 14px; max-width: 340px; line-height: 1.5; margin-bottom: 20px;">
              ${online ? 'The Hermes AI environment is currently active and broadcasting on all local endpoints.' : 'The service is currently idle. Tap the broadcast control to initialize the environment.'}
            </p>

            <div style="display: flex; gap: 10px;">
              ${!online ? `
                <button id="history-btn" class="glass-btn">
                  Initialize WebUI
                </button>
              ` : ''}
            </div>
          </div>

          <div id="power-btn" style="cursor: pointer; position: relative; width: 88px; height: 88px; display: flex; align-items: center; justify-content: center; z-index: 2; transition: transform 0.2s;">
            <div class="pulse-ring" style="position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 1.5px solid var(--accent); opacity: 0.2; animation: ${online ? 'pulse 2s infinite' : 'none'};"></div>
            <div style="width: 56px; height: 56px; border-radius: 50%; background: ${online ? 'var(--accent-gradient)' : 'var(--fill-quaternary)'}; display: flex; align-items: center; justify-content: center; transition: all 0.3s;">
               <div style="color: ${online ? '#fff' : 'var(--text-muted)'};">
                 ${online ? `
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12"></rect></svg>
                 ` : `
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M7 6v12l10-6z"></path></svg>
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
        </div>

        <div id="console-host">
           ${consoleLines.length > 0 ? `<div class="console-output">${ansiToHtml(consoleLines.join('\n'))}</div>` : ''}
        </div>
      </div>
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

function formatUptime(seconds) {
  if (!seconds) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
