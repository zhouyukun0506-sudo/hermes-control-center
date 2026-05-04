// ── Split View (Side-by-Side Pages) ──
import { getCustomPages } from '../utils/pageConfig.js';
import { icons } from '../utils/icons.js';
import { ICON_MAP } from '../utils/icons.js';

const ALL_NAV_ITEMS = [
  { id: 'dashboard', label: 'Control Center' },
  { id: 'terminal', label: 'Command Line' },
  { id: 'original_webui', label: 'Core WebUI' },
  { id: 'monitor', label: 'Activity Monitor' },
  { id: 'models', label: 'Model Explorer' },
  { id: 'sessions', label: 'Session Manager' },
  { id: 'logs', label: 'Log Viewer' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'theme', label: 'Theme Customizer' },
  { id: 'settings', label: 'Settings' },
  { id: 'browser_pages', label: 'Browser Manager' },
];

let state = { active: false, left: null, right: null, ratio: 50 };

export function initSplitView() {
  // Load saved state
  try {
    const raw = localStorage.getItem('hermes_split_state');
    if (raw) state = { ...state, ...JSON.parse(raw) };
  } catch {}
}

function saveState() {
  localStorage.setItem('hermes_split_state', JSON.stringify(state));
}

export function isSplitActive() {
  return state.active;
}

export function getSplitState() {
  return { ...state };
}

export function enterSplit(leftPage) {
  state.active = true;
  state.left = leftPage || 'dashboard';
  state.right = null;
  saveState();
}

export function exitSplit() {
  state.active = false;
  state.left = null;
  state.right = null;
  saveState();
}

export function setPane(side, pageId) {
  if (side === 'left') state.left = pageId;
  else state.right = pageId;
  saveState();
}

export function setRatio(pct) {
  state.ratio = Math.max(20, Math.min(80, pct));
  saveState();
}

function getPageLabel(id) {
  const all = [...ALL_NAV_ITEMS, ...getCustomPages().map(p => ({ id: p.id, label: p.label }))];
  const found = all.find(i => i.id === id);
  return found ? found.label : id;
}

export function renderSplitView(container) {
  const customPages = getCustomPages();
  const allItems = [...ALL_NAV_ITEMS, ...customPages.map(p => ({ id: p.id, label: p.label }))];

  container.innerHTML = `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;background:rgba(0,0,0,0.15);">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 12px;border-bottom:0.5px solid rgba(255,255,255,0.06);flex-shrink:0;">
        <span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-tertiary);">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="vertical-align:middle;margin-right:4px;"><line x1="12" y1="3" x2="12" y2="21"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          Split View
        </span>
        <button id="sv-close-btn" style="width:24px;height:24px;border:none;border-radius:5px;background:transparent;color:var(--text-tertiary);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;" title="Close Split View">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div id="sv-panes" style="flex:1;display:flex;overflow:hidden;position:relative;">
        <!-- Left Pane -->
        <div id="sv-left" style="flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 10px;border-bottom:0.5px solid rgba(255,255,255,0.04);flex-shrink:0;">
            <select id="sv-left-select" style="background:transparent;border:none;color:var(--text-muted);font-size:11px;font-weight:500;font-family:inherit;outline:none;cursor:pointer;max-width:140px;">
              ${allItems.map(i => `<option value="${i.id}" ${state.left === i.id ? 'selected' : ''}>${i.label}</option>`).join('')}
            </select>
          </div>
          <div id="sv-left-content" style="flex:1;overflow:hidden;"></div>
        </div>
        <!-- Divider -->
        <div id="sv-divider" style="width:4px;cursor:col-resize;flex-shrink:0;background:transparent;position:relative;z-index:10;transition:background .15s;">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:2px;height:32px;border-radius:2px;background:var(--fill-tertiary);transition:background .15s;"></div>
        </div>
        <!-- Right Pane -->
        <div id="sv-right" style="flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 10px;border-bottom:0.5px solid rgba(255,255,255,0.04);flex-shrink:0;">
            <select id="sv-right-select" style="background:transparent;border:none;color:var(--text-muted);font-size:11px;font-weight:500;font-family:inherit;outline:none;cursor:pointer;max-width:140px;">
              <option value="">Select page...</option>
              ${allItems.map(i => `<option value="${i.id}" ${state.right === i.id ? 'selected' : ''}>${i.label}</option>`).join('')}
            </select>
          </div>
          <div id="sv-right-content" style="flex:1;overflow:hidden;${!state.right ? 'display:flex;align-items:center;justify-content:center;' : ''}">
            ${!state.right ? '<div style="text-align:center;color:var(--text-tertiary);font-size:13px;">Select a page for this pane</div>' : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  // Apply ratio
  document.getElementById('sv-left').style.flex = `${state.ratio}`;
  document.getElementById('sv-right').style.flex = `${100 - state.ratio}`;

  // Close button
  container.querySelector('#sv-close-btn').addEventListener('click', () => {
    exitSplit();
    if (window.__navigateTo) window.__navigateTo(state.left || 'dashboard');
  });

  // Pane selectors
  container.querySelector('#sv-left-select').addEventListener('change', (e) => {
    setPane('left', e.target.value);
    reloadPane(container, 'left');
  });
  container.querySelector('#sv-right-select').addEventListener('change', (e) => {
    setPane('right', e.target.value);
    reloadPane(container, 'right');
  });

  // Draggable divider
  const divider = container.querySelector('#sv-divider');
  let dragging = false;
  divider.addEventListener('mousedown', (e) => {
    dragging = true;
    divider.style.background = 'var(--accent-bg)';
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const panes = container.querySelector('#sv-panes');
    const rect = panes.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setRatio(pct);
    document.getElementById('sv-left').style.flex = `${state.ratio}`;
    document.getElementById('sv-right').style.flex = `${100 - state.ratio}`;
  });
  document.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      divider.style.background = 'transparent';
    }
  });

  // Render panes
  if (state.left) reloadPane(container, 'left');
  if (state.right) reloadPane(container, 'right');
}

function reloadPane(container, side) {
  const pageId = side === 'left' ? state.left : state.right;
  if (!pageId) return;
  const content = container.querySelector(`#sv-${side}-content`);
  if (!content) return;
  content.style.display = '';
  content.innerHTML = '';
  content.style.alignItems = '';
  content.style.justifyContent = '';
  if (window.__renderPageToContainer) {
    window.__renderPageToContainer(pageId, content);
  }
}
