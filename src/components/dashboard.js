// ── Dashboard Component (CSS Variable Powered) ──
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

export function renderDashboard(container, { status, onStatusChange }) {
  const online = status?.webui_running;
  const gwOnline = status?.gateway_running;
  const ws = status?.webui_status;

  container.innerHTML = `
    <div class="page">
      <div class="page-padded">
        <div style="margin-bottom: 30px;">
          <h1 style="font-size: 32px; font-weight: 800; letter-spacing: -1px; margin-bottom: 4px;">Control Center</h1>
          <div style="width: 40px; height: 4px; background: var(--accent); border-radius: 2px;"></div>
        </div>

        <!-- Hero Card -->
        <div class="card hero-card" style="position: relative; overflow: hidden; margin-bottom: 30px; border: none; display: flex; align-items: center; justify-content: space-between; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
          <div style="position: absolute; top: -50%; right: -20%; width: 300px; height: 300px; background: radial-gradient(circle, var(--accent) 0%, transparent 70%); opacity: 0.15; filter: blur(50px); pointer-events: none;"></div>
          
          <div style="z-index: 2;">
            <div style="color: var(--accent); font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">Hermes Core</div>
            <h2 style="font-size: 28px; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.5px; color: inherit;">
              ${online ? 'Systems Live' : 'System Paused'}
            </h2>
            <p style="color: var(--hero-muted); font-size: 15px; max-width: 360px; line-height: 1.5; margin-bottom: 0;">
              ${online ? 'The Hermes AI environment is currently active and broadcasting on all local endpoints.' : 'The service is currently idle. Tap the broadcast control to initialize the environment.'}
            </p>
          </div>
          
          <div id="power-btn" style="cursor: pointer; position: relative; width: 140px; height: 140px; display: flex; align-items: center; justify-content: center; z-index: 2; transition: transform 0.2s;">
            <div class="pulse-ring" style="position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 2px solid var(--accent); opacity: 0.3; animation: ${online ? 'pulse 2s infinite' : 'none'};"></div>
            <div style="width: 90px; height: 90px; border-radius: 50%; background: ${online ? 'var(--accent-gradient)' : 'rgba(200,200,200,0.1)'}; display: flex; align-items: center; justify-content: center; box-shadow: ${online ? '0 15px 30px rgba(187, 38, 73, 0.4)' : '0 10px 20px rgba(0,0,0,0.1)'}; transition: all 0.4s;">
               <div style="color: ${online ? '#fff' : 'var(--text-muted)'}; transform: scale(1.4);">
                 ${online ? `
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12"></rect></svg>
                 ` : `
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M7 6v12l10-6z"></path></svg>
                 `}
               </div>
            </div>
          </div>
        </div>

        <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 20px; letter-spacing: -0.5px;">Live Telemetry</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; margin-bottom: 40px;">
          <div class="card">
            <div style="color: var(--text-muted); font-size: 11px; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">Service Status</div>
            <div style="font-size: 20px; font-weight: 700; color: ${online ? '#28a745' : '#ff453a'}; display: flex; align-items: center; gap: 8px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: currentColor; box-shadow: 0 0 10px currentColor;"></div>
              ${online ? 'Active' : 'Offline'}
            </div>
          </div>
          <div class="card">
            <div style="color: var(--text-muted); font-size: 11px; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">Gateway</div>
            <div style="font-size: 20px; font-weight: 700; color: ${gwOnline ? '#28a745' : '#ff453a'};">${gwOnline ? 'OK' : 'Error'}</div>
          </div>
          <div class="card">
            <div style="color: var(--text-muted); font-size: 11px; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">Active Load</div>
            <div style="font-size: 20px; font-weight: 700;">${ws?.sessions ?? '0'} <span style="font-size: 12px; color: var(--text-muted);">Sessions</span></div>
          </div>
          <div class="card">
            <div style="color: var(--text-muted); font-size: 11px; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">Uptime</div>
            <div style="font-size: 20px; font-weight: 700;">${formatUptime(ws?.uptime_seconds)}</div>
          </div>
        </div>

        <div id="console-host">
           ${consoleLines.length > 0 ? `<div class="console-output">${ansiToHtml(consoleLines.join('\n'))}</div>` : ''}
        </div>
      </div>
    </div>

    <style>
      @keyframes pulse { 0% { transform: scale(0.95); opacity: 1; } 100% { transform: scale(1.4); opacity: 0; } }
      #power-btn:hover { transform: scale(1.05); }
      #power-btn:active { transform: scale(0.95); }
      .console-output {
        background: var(--bg-primary);
        border: 1px solid var(--card-border);
        border-radius: 14px;
        padding: 16px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        color: var(--text-muted);
        max-height: 200px;
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
