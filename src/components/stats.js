// ── Token Usage & Analytics ──
import { icons } from '../utils/icons.js';
import * as api from '../api.js';

export function renderStats(container, { status }) {
  if (!status?.webui_running) {
    container.innerHTML = `<div class="page"><div class="empty-state">${icons.stats}<h3>Hermes 未运行</h3><p>请先启动服务</p></div></div>`;
    return;
  }

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">用量统计</h1>
        <p class="page-subtitle">Token 使用量、模型分布与活动分析</p>
      </div>
      <div style="display:flex; gap:8px; margin-bottom:20px;">
        <button class="btn period-btn active" data-days="7">7 天</button>
        <button class="btn period-btn" data-days="30">30 天</button>
        <button class="btn period-btn" data-days="90">90 天</button>
        <button class="btn period-btn" data-days="365">一年</button>
      </div>
      <div id="stats-content"><div style="color:var(--text-muted);">加载中...</div></div>
    </div>`;

  loadStats(container, 7);

  container.querySelectorAll('.period-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.period-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      loadStats(container, parseInt(btn.dataset.days));
    });
  });
}

async function loadStats(container, days) {
  const area = container.querySelector('#stats-content');
  try {
    const data = await api.insights.get(days);

    const totalTokens = data.total_tokens || 0;
    const inputTokens = data.total_input_tokens || 0;
    const outputTokens = data.total_output_tokens || 0;
    const inputPct = totalTokens > 0 ? (inputTokens / totalTokens * 100) : 0;
    const outputPct = totalTokens > 0 ? (outputTokens / totalTokens * 100) : 0;

    area.innerHTML = `
      <!-- Summary Cards -->
      <div class="grid-4" style="margin-bottom:24px;">
        <div class="stat-card">
          <div class="stat-label">总 Token</div>
          <div class="stat-value">${formatNumber(totalTokens)}</div>
          <div class="stat-sub">${days} 天内</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">总会话</div>
          <div class="stat-value">${data.total_sessions || 0}</div>
          <div class="stat-sub">sessions</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">总消息</div>
          <div class="stat-value">${formatNumber(data.total_messages || 0)}</div>
          <div class="stat-sub">messages</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">预估费用</div>
          <div class="stat-value">$${(data.total_cost || 0).toFixed(4)}</div>
          <div class="stat-sub">USD</div>
        </div>
      </div>

      <!-- Token Breakdown -->
      <div class="card" style="margin-bottom:16px;">
        <div class="card-title" style="margin-bottom:16px;">Token 分布</div>
        <div class="token-bar">
          <span style="font-size:12px; color:var(--accent); min-width:80px;">输入</span>
          <div class="token-bar-track">
            <div class="token-bar-fill input" style="width:${inputPct}%;"></div>
          </div>
          <span style="font-size:12px; color:var(--text-secondary); min-width:90px; text-align:right;">${formatNumber(inputTokens)}</span>
        </div>
        <div class="token-bar">
          <span style="font-size:12px; color:var(--accent-purple); min-width:80px;">输出</span>
          <div class="token-bar-track">
            <div class="token-bar-fill output" style="width:${outputPct}%;"></div>
          </div>
          <span style="font-size:12px; color:var(--text-secondary); min-width:90px; text-align:right;">${formatNumber(outputTokens)}</span>
        </div>
      </div>

      <!-- Model Breakdown -->
      <div class="grid-2">
        <div class="card">
          <div class="card-title" style="margin-bottom:16px;">模型使用</div>
          ${renderModelBreakdown(data.models_breakdown || [])}
        </div>
        <div class="card">
          <div class="card-title" style="margin-bottom:16px;">活跃时段</div>
          ${renderActivityChart(data.hour_of_day || [])}
        </div>
      </div>

      <!-- Day of Week -->
      <div class="card" style="margin-top:16px;">
        <div class="card-title" style="margin-bottom:16px;">每周活跃</div>
        ${renderDayOfWeek(data.day_of_week || [])}
      </div>
    `;
  } catch (e) {
    area.innerHTML = `<div style="color:var(--accent-red);">加载失败: ${e.message}</div>`;
  }
}

function renderModelBreakdown(models) {
  if (!models.length) return '<div style="color:var(--text-muted); font-size:13px;">暂无数据</div>';

  const total = models.reduce((sum, m) => sum + m.sessions, 0);
  const colors = ['var(--accent)', 'var(--accent-purple)', 'var(--accent-green)', 'var(--accent-amber)', 'var(--accent-red)'];

  return models.slice(0, 8).map((m, i) => {
    const pct = total > 0 ? (m.sessions / total * 100) : 0;
    return `
      <div style="margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
          <span style="color:${colors[i % colors.length]};">${m.model}</span>
          <span style="color:var(--text-muted);">${m.sessions} 会话 (${pct.toFixed(0)}%)</span>
        </div>
        <div class="token-bar-track">
          <div style="height:100%; width:${pct}%; background:${colors[i % colors.length]}; border-radius:4px; transition:width 0.6s;"></div>
        </div>
      </div>`;
  }).join('');
}

function renderActivityChart(hours) {
  if (!hours.length) return '<div style="color:var(--text-muted); font-size:13px;">暂无数据</div>';

  const max = Math.max(...hours.map((h) => h.sessions), 1);
  return `<div style="display:flex; align-items:flex-end; gap:2px; height:80px;">
    ${Array.from({ length: 24 }, (_, i) => {
      const h = hours.find((x) => x.hour === i);
      const count = h?.sessions || 0;
      const height = Math.max((count / max) * 100, 2);
      return `<div title="${i}:00 — ${count} 会话" style="flex:1; height:${height}%; background:var(--accent); border-radius:2px 2px 0 0; opacity:${count > 0 ? 1 : 0.15}; transition:height 0.4s;"></div>`;
    }).join('')}
  </div>
  <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:10px; color:var(--text-muted);">
    <span>0时</span><span>6时</span><span>12时</span><span>18时</span><span>23时</span>
  </div>`;
}

function renderDayOfWeek(days) {
  if (!days.length) return '<div style="color:var(--text-muted); font-size:13px;">暂无数据</div>';

  const max = Math.max(...days.map((d) => d.sessions), 1);
  return `<div style="display:flex; gap:8px;">
    ${days.map((d) => {
      const height = Math.max((d.sessions / max) * 100, 5);
      return `<div style="flex:1; text-align:center;">
        <div style="height:100px; display:flex; align-items:flex-end; justify-content:center;">
          <div style="width:100%; height:${height}%; background:var(--accent-purple); border-radius:4px 4px 0 0; transition:height 0.4s;"></div>
        </div>
        <div style="font-size:11px; color:var(--text-secondary); margin-top:6px;">${d.day}</div>
        <div style="font-size:10px; color:var(--text-muted);">${d.sessions}</div>
      </div>`;
    }).join('')}
  </div>`;
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}
