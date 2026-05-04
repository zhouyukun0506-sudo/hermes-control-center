// ── Activity Monitor (Fixed Data Source) ──
import * as api from '../api.js';

export function renderMonitor(container) {
  container.innerHTML = `
    <div class="page">
      <div class="page-padded">
        <div class="page-header">
          <h1 class="page-title">Activity Monitor</h1>
          <div class="page-accent-bar"></div>
          <p class="page-subtitle">Real-time system telemetry</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
          <!-- CPU Card -->
          <div class="card" style="display: flex; flex-direction: column; gap: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span class="section-header" style="margin-bottom: 2px;">Processor</span>
                <div style="font-size: 19px; font-weight: 700; margin-top: 4px;">CPU Load</div>
              </div>
              <span id="cpu-val" style="font-size: 28px; font-weight: 700; color: var(--accent); font-variant-numeric: tabular-nums;">0.0%</span>
            </div>
            <div style="height: 6px; width: 100%; background: var(--fill-quinary); border-radius: 3px; overflow: hidden; position: relative;">
              <div id="cpu-fill" style="height: 100%; width: 0%; background: var(--accent-gradient); transition: width 0.8s cubic-bezier(0.2, 0, 0, 1); border-radius: 3px;"></div>
            </div>
          </div>

          <!-- Memory Card -->
          <div class="card" style="display: flex; flex-direction: column; gap: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span class="section-header" style="margin-bottom: 2px;">Memory</span>
                <div style="font-size: 19px; font-weight: 700; margin-top: 4px;">Memory Usage</div>
              </div>
              <span id="mem-val" style="font-size: 28px; font-weight: 700; color: var(--accent-blue); font-variant-numeric: tabular-nums;">0.0%</span>
            </div>
            <div style="height: 6px; width: 100%; background: var(--fill-quinary); border-radius: 3px; overflow: hidden;">
              <div id="mem-fill" style="height: 100%; width: 0%; background: linear-gradient(90deg, var(--accent-blue), #40c8ff); transition: width 0.8s cubic-bezier(0.2, 0, 0, 1); border-radius: 3px;"></div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top: 28px; display: flex; align-items: center; justify-content: space-between;">
           <div style="display: flex; align-items: center; gap: 10px;">
             <div id="status-dot" style="width: 8px; height: 8px; border-radius: 50%; background: var(--online-color);"></div>
             <span id="poll-status" style="font-size: 13px; font-weight: 500; color: var(--text-muted);">Syncing live data...</span>
           </div>
           <span style="font-size: 11px; color: var(--text-tertiary);">Polling interval: 2000ms</span>
        </div>
      </div>
    </div>
  `;

  const cpuFill = container.querySelector('#cpu-fill');
  const cpuVal = container.querySelector('#cpu-val');
  const memFill = container.querySelector('#mem-fill');
  const memVal = container.querySelector('#mem-val');
  const pollStatus = container.querySelector('#poll-status');
  const statusDot = container.querySelector('#status-dot');

  async function update() {
    try {
      const status = await api.ctrl.status();
      // The server returns stats in `status.stats`
      const stats = status.stats || { cpu: 0, mem: 0 };
      
      const cpu = parseFloat(stats.cpu) || 0;
      const mem = parseFloat(stats.mem) || 0;

      cpuFill.style.width = `${Math.min(100, cpu)}%`;
      cpuVal.textContent = `${cpu.toFixed(1)}%`;
      
      memFill.style.width = `${Math.min(100, mem)}%`;
      memVal.textContent = `${mem.toFixed(1)}%`;
      
      pollStatus.textContent = 'Last updated at ' + new Date().toLocaleTimeString([], { hour12: false });
      statusDot.style.background = 'var(--online-color)';
      statusDot.style.boxShadow = '0 0 10px var(--online-color)';
    } catch (err) {
      pollStatus.textContent = 'Telemetry Sync Interrupted';
      statusDot.style.background = 'var(--error-color)';
      statusDot.style.boxShadow = '0 0 10px var(--error-color)';
    }
  }

  const interval = setInterval(update, 2000);
  update();

  container.cleanup = () => {
    clearInterval(interval);
  };
}
