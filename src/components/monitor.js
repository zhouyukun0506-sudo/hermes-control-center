// ── Activity Monitor (Fixed Data Source) ──
import * as api from '../api.js';

export function renderMonitor(container) {
  container.innerHTML = `
    <div class="page">
      <div class="page-padded">
        <div style="margin-bottom: 40px;">
          <h1 style="font-size: 36px; font-weight: 800; letter-spacing: -1.5px; margin-bottom: 6px;">Activity Monitor</h1>
          <div style="width: 50px; height: 5px; background: var(--accent); border-radius: 3px;"></div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 30px;">
          <!-- CPU Card -->
          <div class="card" style="display: flex; flex-direction: column; gap: 24px; background: rgba(255,255,255,0.03);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 14px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">Processor</span>
                <div style="font-size: 19px; font-weight: 700; margin-top: 4px;">CPU Load</div>
              </div>
              <span id="cpu-val" style="font-size: 32px; font-weight: 800; color: var(--accent);">0.0%</span>
            </div>
            <div style="height: 10px; width: 100%; background: rgba(255,255,255,0.05); border-radius: 5px; overflow: hidden; position: relative;">
              <div id="cpu-fill" style="height: 100%; width: 0%; background: var(--accent-gradient); transition: width 0.8s cubic-bezier(0.2, 0, 0, 1); box-shadow: 0 0 20px rgba(187, 38, 73, 0.4);"></div>
            </div>
          </div>

          <!-- Memory Card -->
          <div class="card" style="display: flex; flex-direction: column; gap: 24px; background: rgba(255,255,255,0.03);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 14px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">Memory</span>
                <div style="font-size: 19px; font-weight: 700; margin-top: 4px;">Memory Usage</div>
              </div>
              <span id="mem-val" style="font-size: 32px; font-weight: 800; color: #00A3E0;">0.0%</span>
            </div>
            <div style="height: 10px; width: 100%; background: rgba(255,255,255,0.05); border-radius: 5px; overflow: hidden;">
              <div id="mem-fill" style="height: 100%; width: 0%; background: linear-gradient(90deg, #007aff, #00A3E0); transition: width 0.8s cubic-bezier(0.2, 0, 0, 1); box-shadow: 0 0 20px rgba(0, 163, 224, 0.3);"></div>
            </div>
          </div>
        </div>

        <div style="margin-top: 40px; padding: 24px; background: rgba(255,255,255,0.02); border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between;">
           <div style="display: flex; align-items: center; gap: 12px;">
             <div id="status-dot" style="width: 10px; height: 10px; border-radius: 50%; background: #32d74b; box-shadow: 0 0 10px #32d74b;"></div>
             <span id="poll-status" style="font-size: 14px; font-weight: 600; color: var(--text-muted);">Syncing live data...</span>
           </div>
           <div style="font-size: 12px; color: rgba(255,255,255,0.2); font-weight: 500;">Polling interval: 2000ms</div>
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
      statusDot.style.background = '#32d74b';
      statusDot.style.boxShadow = '0 0 15px #32d74b';
    } catch (err) {
      pollStatus.textContent = 'Telemetry Sync Interrupted';
      statusDot.style.background = '#ff453a';
      statusDot.style.boxShadow = '0 0 15px #ff453a';
    }
  }

  const interval = setInterval(update, 2000);
  update();

  container.cleanup = () => {
    clearInterval(interval);
  };
}
