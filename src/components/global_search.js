// ── Global Search Overlay (⌘F) ──
import { getCustomPages } from '../utils/pageConfig.js';
import { getShortcuts } from '../utils/shortcuts.js';
import { icons } from '../utils/icons.js';

const SEARCH_ITEMS = [
  { id: 'dashboard', label: 'Control Center', keywords: 'home dashboard main' },
  { id: 'terminal', label: 'Command Line', keywords: 'terminal shell bash cmd' },
  { id: 'original_webui', label: 'Core UI', keywords: 'core webui' },
  { id: 'browser_pages', label: 'Browser Manager', keywords: 'browser pages agents manage' },
  { id: 'monitor', label: 'Activity Monitor', keywords: 'monitor activity cpu memory' },
  { id: 'models', label: 'Model Explorer', keywords: 'model explorer ai llm' },
  { id: 'sessions', label: 'Session Manager', keywords: 'session manager chat history' },
  { id: 'logs', label: 'Log Viewer', keywords: 'log viewer output' },
  { id: 'theme', label: 'Theme Customizer', keywords: 'theme customize color accent font' },
  { id: 'skills', label: 'Skills', keywords: 'skills capabilities' },
  { id: 'memory', label: 'Memory', keywords: 'memory context' },
  { id: 'insights', label: 'Usage Insights', keywords: 'insights usage analytics stats' },
  { id: 'settings', label: 'Settings', keywords: 'settings preferences config' },
  { id: 'calendar', label: 'Calendar', keywords: 'calendar date event' },
  { id: 'split_view', label: 'Split View', keywords: 'split view side by side pane column' },
  { id: 'comparison_search', label: 'Comparison Search', keywords: 'search compare google bing comparison side by side' },
  { id: 'flip_clock', label: 'Flip Clock', keywords: 'flip clock time fullscreen' },
];

export function initGlobalSearch() {
  // Create overlay element
  const overlay = document.createElement('div');
  overlay.id = 'global-search-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    display:none;align-items:flex-start;justify-content:center;
    padding-top:15vh;
    background:rgba(0,0,0,0.5);
    backdrop-filter:blur(8px);
    -webkit-backdrop-filter:blur(8px);
  `;
  overlay.innerHTML = `
    <div style="width:480px;max-width:90vw;background:var(--glass-bg-dark);border-radius:14px;box-shadow:0 16px 64px rgba(0,0,0,0.5),0 0 0 0.5px rgba(255,255,255,0.08);overflow:hidden;animation:scaleIn .15s ease;">
      <div style="display:flex;align-items:center;padding:12px 14px;border-bottom:0.5px solid rgba(255,255,255,0.06);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="color:var(--text-tertiary);flex-shrink:0;margin-right:8px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input id="gs-input" type="text" placeholder="Search pages, settings, agents..." autofocus
          style="flex:1;border:none;outline:none;background:transparent;color:var(--text-main);font-size:14px;font-family:inherit;">
        <span style="font-size:10px;color:var(--text-tertiary);padding:2px 6px;border-radius:4px;background:var(--fill-quinary);">⌘F</span>
      </div>
      <div id="gs-results" style="max-height:360px;overflow-y:auto;padding:6px;"></div>
      <div style="padding:8px 14px;border-top:0.5px solid rgba(255,255,255,0.04);display:flex;gap:12px;font-size:10px;color:var(--text-tertiary);">
        <span>↑↓ Navigate</span>
        <span>⏎ Open</span>
        <span>Esc Close</span>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('#gs-input');
  const resultsEl = overlay.querySelector('#gs-results');
  let selectedIdx = -1;
  let currentResults = [];

  function close() { overlay.style.display = 'none'; selectedIdx = -1; currentResults = []; }
  function open() {
    overlay.style.display = 'flex';
    input.value = '';
    resultsEl.innerHTML = '';
    input.focus();
    selectedIdx = -1;
    currentResults = [];
  }

  // Build search index
  function getSearchableItems() {
    const customPages = getCustomPages();
    return [
      ...SEARCH_ITEMS,
      ...customPages.map(p => ({ id: p.id, label: p.label, keywords: p.label + ' ' + (p.url || '') })),
    ];
  }

  function search(query) {
    if (!query.trim()) { resultsEl.innerHTML = ''; currentResults = []; selectedIdx = -1; return; }
    const q = query.toLowerCase();
    const items = getSearchableItems();
    currentResults = items.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.keywords.toLowerCase().includes(q)
    );
    renderResults();
  }

  function renderResults() {
    if (currentResults.length === 0) {
      resultsEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-tertiary);font-size:13px;">No results found</div>';
      return;
    }
    resultsEl.innerHTML = currentResults.map((r, i) => `
      <div class="gs-result ${i === selectedIdx ? 'gs-selected' : ''}" data-id="${r.id}" data-index="${i}"
        style="padding:8px 12px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:background .1s;${i === selectedIdx ? 'background:var(--accent-bg);color:var(--accent);' : 'color:var(--text-muted);'}">
        <span style="width:16px;height:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;opacity:0.5;">${icons.browser}</span>
        <span style="font-size:13px;font-weight:500;">${escHtml(r.label)}</span>
      </div>
    `).join('');
  }

  // Event handlers
  input.addEventListener('input', () => {
    selectedIdx = -1;
    search(input.value);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIdx = Math.min(selectedIdx + 1, currentResults.length - 1);
      renderResults();
      scrollToSelected();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIdx = Math.max(selectedIdx - 1, 0);
      renderResults();
      scrollToSelected();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const idx = selectedIdx >= 0 ? selectedIdx : 0;
      if (currentResults[idx] && window.__navigateTo) {
        window.__navigateTo(currentResults[idx].id);
        close();
      }
    }
  });

  resultsEl.addEventListener('mouseover', (e) => {
    const row = e.target.closest('.gs-result');
    if (!row) return;
    selectedIdx = parseInt(row.dataset.index);
    renderResults();
  });

  resultsEl.addEventListener('click', (e) => {
    const row = e.target.closest('.gs-result');
    if (!row) return;
    if (window.__navigateTo) window.__navigateTo(row.dataset.id);
    close();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Expose open function
  window.__openGlobalSearch = open;

  function scrollToSelected() {
    const sel = resultsEl.querySelector('.gs-selected');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
