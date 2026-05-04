// ── Model Explorer Component ──
import * as api from '../api.js';
import { icons } from '../utils/icons.js';

let allModels = [];
let activeProvider = null;
let defaultModel = null;
let modelBadges = {};
let filterText = '';

export async function renderModelExplorer(container) {
  container.innerHTML = `
    <div class="page page-padded">
      <div style="max-width: 900px;">
        <div style="margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
          <div class="page-header" style="margin-bottom: 0;">
            <h1 class="page-title">Model Explorer</h1>
            <p class="page-subtitle">Browse available models and manage default selection.</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <input id="me-search" type="text" placeholder="Search models..." value="${esc(filterText)}"
              style="background: var(--fill-quinary); border: 0.5px solid var(--fill-quaternary); border-radius: 8px;
                     padding: 8px 12px; color: var(--text-main); font-size: 13px; outline: none; width: 200px; font-family: inherit;">
            <button id="me-refresh" style="background: var(--fill-quinary); border: 0.5px solid var(--fill-quaternary); border-radius: 8px;
                    color: var(--text-main); padding: 8px 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; font-family: inherit;">
              ${icons.refresh} Refresh
            </button>
          </div>
        </div>

        <!-- Summary Bar -->
        <div id="me-summary" style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;"></div>

        <!-- Model List -->
        <div id="me-content">
          <div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px;">Loading models...</div>
        </div>
      </div>
    </div>
  `;

  const contentEl = container.querySelector('#me-content');
  const summaryEl = container.querySelector('#me-summary');
  const searchEl = container.querySelector('#me-search');
  const refreshEl = container.querySelector('#me-refresh');

  async function load() {
    contentEl.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px;">Loading models...</div>';
    summaryEl.innerHTML = '';
    try {
      const data = await api.models.list();
      let models = [];
      if (Array.isArray(data)) {
        models = data;
      } else if (data.models && Array.isArray(data.models)) {
        models = data.models;
      } else if (data.data && Array.isArray(data.data)) {
        models = data.data;
      }
      allModels = models;
      activeProvider = data.active_provider || null;
      defaultModel = data.default_model || null;
      modelBadges = data.configured_model_badges || {};
      renderSummary(summaryEl, models);
      renderModels(contentEl, models, filterText);
    } catch {
      contentEl.innerHTML = '<div style="padding: 40px; text-align: center; color: #ff453a; font-size: 14px;">Failed to load models.<br>WebUI may be offline.</div>';
    }
  }

  searchEl.addEventListener('input', () => {
    filterText = searchEl.value;
    renderModels(contentEl, allModels, filterText);
  });

  refreshEl.addEventListener('click', load);
  load();
}

function renderSummary(el, models) {
  const total = models.length;
  const byProvider = {};
  models.forEach(m => {
    const prov = (m.provider || m.owned_by || m.origin || 'unknown').replace(/^llama-/, '');
    byProvider[prov] = (byProvider[prov] || 0) + 1;
  });

  let html = `
    <div class="card" style="padding: 14px 18px; display: flex; align-items: center; gap: 10px; font-size: 13px;">
      <span style="font-weight: 700;">${total}</span>
      <span style="color: var(--text-muted);">models total</span>
      <span style="width: 1px; height: 20px; background: var(--card-border); margin: 0 4px;"></span>
  `;
  for (const [provider, count] of Object.entries(byProvider).sort()) {
    html += `<span style="font-size: 12px;"><span style="color: var(--accent); font-weight: 600;">${count}</span> ${esc(provider)}</span>`;
    html += `<span style="width: 3px; height: 3px; border-radius: 50%; background: var(--card-border);"></span>`;
  }
  html += '</div>';
  el.innerHTML = html;
}

function renderModels(containerEl, models, filter) {
  const filtered = filter
    ? models.filter(m => {
        const s = filter.toLowerCase();
        return (m.id || m.name || m.model || '').toLowerCase().includes(s)
          || (m.provider || m.owned_by || '').toLowerCase().includes(s);
      })
    : models;

  if (filtered.length === 0) {
    containerEl.innerHTML = models.length === 0
      ? '<div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px;">No models available.</div>'
      : '<div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px;">No models match your search.</div>';
    return;
  }

  // Determine which model IDs are "active" (default model)
  const activeModelIds = new Set();
  if (defaultModel) {
    activeModelIds.add(defaultModel);
    // Also check for provider-prefixed versions
    if (activeProvider) {
      activeModelIds.add(`@${activeProvider}:${defaultModel}`);
    }
  }
  // Also match from configured_model_badges
  for (const [mid, badge] of Object.entries(modelBadges)) {
    if (badge.role === 'primary') {
      activeModelIds.add(mid);
      // Remove @provider: prefix for bare matching
      const bare = mid.replace(/^@[^:]+:/, '');
      activeModelIds.add(bare);
    }
  }

  // Build active model card
  let html = '';
  if (defaultModel && !filter) {
    const activeModel = allModels.find(m => {
      const id = m.id || m.name || m.model || '';
      return activeModelIds.has(id) || id === defaultModel;
    });

    html += `
      <div class="card" style="padding: 0; margin-bottom: 20px; overflow: hidden; border: 1px solid rgba(46,204,113,0.25);">
        <div style="padding: 16px 20px; display: flex; align-items: center; gap: 14px;
                    background: linear-gradient(135deg, rgba(46,204,113,0.08), rgba(46,204,113,0.02));">
          <div style="width: 40px; height: 40px; border-radius: 10px;
                      background: linear-gradient(135deg, #2ecc71, #27ae60);
                      display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div style="flex: 1;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #2ecc71; margin-bottom: 2px;">Active Model</div>
            <div style="font-size: 17px; font-weight: 700;">${esc(defaultModel)}</div>
            ${activeProvider ? `<div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">via ${esc(activeProvider)}</div>` : ''}
          </div>
          <span style="padding: 3px 10px; border-radius: 20px; background: rgba(46,204,113,0.2); color: #2ecc71; font-size: 11px; font-weight: 600; border: 0.5px solid rgba(46,204,113,0.3);">In Use</span>
        </div>
      </div>
    `;
  }

  html += filtered.map(m => {
    const id = m.id || m.name || m.model || 'unknown';
    const provider = m.provider || m.owned_by || m.origin || '';
    const ctxLen = formatContext(m.context_length || m.max_tokens || m.max_context_length || 0);
    const desc = m.description || m.note || '';
    const pricing = m.pricing || {};
    const priceStr = formatPricing(pricing);
    const capabilities = m.capabilities || m.traits || [];

    const isActive = activeModelIds.has(id) || (defaultModel && id === defaultModel);
    const badge = modelBadges[id] || modelBadges[`@${provider}:${id}`] || null;

    return `
      <div class="card me-model" style="padding: 18px 20px; margin-bottom: 8px; ${isActive ? 'border: 1px solid rgba(46,204,113,0.2);' : ''}">
        <div style="display: flex; align-items: flex-start; gap: 14px;">
          <div style="width: 36px; height: 36px; border-radius: 8px;
                      background: linear-gradient(135deg, ${isActive ? '#2ecc71' : getModelColor(id)}, ${isActive ? '#27ae60' : shiftColor(getModelColor(id), 30)});
                      display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; color: #fff;">
            ${icons.cpu.replace('stroke-width="2"', 'stroke-width="2" width="18" height="18"')}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
              <span style="font-weight: 700; font-size: 15px;">${esc(id)}</span>
              ${badge ? `<span style="font-size: 10px; font-weight: 700; background: ${badge.role === 'primary' ? '#2ecc71' : '#bf5af2'}20; color: ${badge.role === 'primary' ? '#2ecc71' : '#bf5af2'}; padding: 2px 8px; border-radius: 20px; border: 0.5px solid ${badge.role === 'primary' ? '#2ecc71' : '#bf5af2'}40;">${esc(badge.label)}</span>` : ''}
              ${isActive && !badge ? `<span style="font-size: 10px; font-weight: 700; background: rgba(46,204,113,0.15); color: #2ecc71; padding: 2px 8px; border-radius: 20px; border: 0.5px solid rgba(46,204,113,0.3);">Active</span>` : ''}
              ${provider ? `<span style="font-size: 11px; background: var(--fill-quinary); border: 0.5px solid var(--fill-quaternary); padding: 2px 8px; border-radius: 6px; color: var(--text-muted);">${esc(provider)}</span>` : ''}
            </div>
            ${desc ? `<div style="font-size: 13px; color: var(--text-muted); margin-bottom: 6px;">${esc(desc)}</div>` : ''}
            <div style="display: flex; gap: 14px; font-size: 11px; color: var(--text-muted); flex-wrap: wrap;">
              ${ctxLen ? `<span style="display:inline-flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg> ${ctxLen} context</span>` : ''}
              ${priceStr ? `<span style="display:inline-flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> ${priceStr}</span>` : ''}
              ${Array.isArray(capabilities) && capabilities.length ? `<span style="display:inline-flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> ${capabilities.slice(0, 4).join(', ')}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  containerEl.innerHTML = html;
}

function formatContext(n) {
  if (!n || n <= 0) return '';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return String(n);
}

function formatPricing(p) {
  if (!p || typeof p !== 'object') return '';
  const parts = [];
  if (p.input || p.input_price) {
    const val = parseFloat(p.input || p.input_price);
    if (!isNaN(val)) parts.push(`$${val.toFixed(2)}/M in`);
  }
  if (p.output || p.output_price) {
    const val = parseFloat(p.output || p.output_price);
    if (!isNaN(val)) parts.push(`$${val.toFixed(2)}/M out`);
  }
  return parts.join(' ');
}

function getModelColor(id) {
  const lc = (id || '').toLowerCase();
  if (lc.includes('gpt') || lc.includes('o1') || lc.includes('o3')) return '#10a37f';
  if (lc.includes('claude') || lc.includes('sonnet') || lc.includes('opus')) return '#d97706';
  if (lc.includes('gemini')) return '#4285f4';
  if (lc.includes('llama') || lc.includes('meta')) return '#1877f2';
  if (lc.includes('mistral')) return '#b22222';
  if (lc.includes('deepseek')) return '#8b5cf6';
  if (lc.includes('qwen')) return '#ff6b35';
  if (lc.includes('command') || lc.includes('cohere')) return '#39594d';
  return '#BB2649';
}

function shiftColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
