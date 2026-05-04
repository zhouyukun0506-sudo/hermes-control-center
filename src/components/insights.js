// ── Usage Insights Component ──
import * as api from '../api.js';

export async function renderInsights(container) {
  container.innerHTML = `
    <div class="page page-padded">
      <div style="max-width: 740px;">
        <div style="margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between;">
          <div class="page-header" style="margin-bottom: 0;">
            <h1 class="page-title">Usage Insights</h1>
            <p class="page-subtitle">Token consumption and activity statistics.</p>
          </div>
          <select id="insights-days" style="background: var(--fill-quinary); border: 0.5px solid var(--fill-quaternary); border-radius: 8px;
                  padding: 8px 12px; color: var(--text-main); font-size: 13px; outline: none; cursor: pointer; font-family: inherit;">
            <option value="7">Last 7 days</option>
            <option value="30" selected>Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        <div id="insights-content">
          <div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px;">Loading...</div>
        </div>
      </div>
    </div>
  `;

  const contentEl = container.querySelector('#insights-content');
  const daysSelect = container.querySelector('#insights-days');

  async function load() {
    contentEl.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px;">Loading...</div>';
    try {
      const data = await api.insights.get(parseInt(daysSelect.value));
      // data might be: { insights: { stats: {...}, history: [...] } }
      // or:          { stats: {...}, history: [...] }
      // or:          { total_tokens: ..., total_sessions: ..., history: [...] }
      const root = (data && data.insights) || data || {};
      const stats = root.stats || root;
      const history = root.history || data.history || [];

      let html = '';

      // Stats cards — only show simple string/number values, skip arrays/objects
      if (stats && typeof stats === 'object') {
        const entries = Object.entries(stats).filter(([, v]) =>
          typeof v === 'string' || typeof v === 'number'
        );
        if (entries.length > 0) {
          html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; margin-bottom: 32px;">';
          for (const [key, val] of entries) {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const value = typeof val === 'number' ? val.toLocaleString() : String(val);
            html += '\
              <div class="card" style="padding: 20px;">\
                <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); margin-bottom: 6px;">' + esc(label) + '</div>\
                <div style="font-size: 28px; font-weight: 800; letter-spacing: -1px;">' + esc(value) + '</div>\
              </div>';
          }
          html += '</div>';
        }
      }

      // History bar chart
      if (history.length > 0) {
        const recent = history.slice(-30);
        const maxVal = Math.max(...recent.map(d => {
          const n = Number(d.count ?? d.messages ?? d.tokens ?? 0);
          return isNaN(n) ? 0 : n;
        }), 1);

        html += '<div class="card" style="padding: 24px;">';
        html += '<div style="font-size: 12px; font-weight: 700; margin-bottom: 14px; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted);">Daily Activity</div>';
        for (const day of recent) {
          const dateStr = formatDate(day.date || day.day || '');
          const count = Number(day.count ?? day.messages ?? day.tokens ?? 0);
          const pct = Math.max(0, Math.min(100, (count / maxVal) * 100));
          html += '\
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px; font-size: 11px;">\
              <span style="width: 60px; flex-shrink: 0; color: var(--text-muted);">' + esc(dateStr) + '</span>\
              <div style="flex: 1; height: 8px; background: rgba(255,255,255,.06); border-radius: 4px; overflow: hidden;">\
                <div style="height: 100%; width: ' + pct + '%; background: var(--accent-gradient); border-radius: 4px;"></div>\
              </div>\
              <span style="width: 50px; text-align: right; color: var(--text-muted);">' + count.toLocaleString() + '</span>\
            </div>';
        }
        html += '</div>';
      }

      if (!html) {
        html = '<div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px;">No data available for this period.</div>';
      }
      contentEl.innerHTML = html;
    } catch {
      contentEl.innerHTML = '<div style="padding: 40px; text-align: center; color: #ff453a; font-size: 14px;">Failed to load insights.<br>WebUI may be offline.</div>';
    }
  }

  daysSelect.addEventListener('change', load);
  load();
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[d.getMonth()] + ' ' + d.getDate();
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
