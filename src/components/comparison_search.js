// ── Comparison Search (Google + Bing side by side) ──

const NAV_ICONS = {
  back: '<polyline points="15 18 9 12 15 6"/>',
  forward: '<polyline points="9 18 15 12 9 6"/>',
  refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
};
const HISTORY_KEY = 'hermes_search_history';
const ZOOM_KEY_G = 'hermes_search_default_zoom_g';
const ZOOM_KEY_B = 'hermes_search_default_zoom_b';
const MAX_HISTORY = 20;

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
}
function saveHistory(h) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}
function addSearchHistory(q) {
  const h = getHistory().filter(s => s !== q);
  h.unshift(q);
  if (h.length > MAX_HISTORY) h.length = MAX_HISTORY;
  saveHistory(h);
}
function deleteHistoryItem(q) {
  saveHistory(getHistory().filter(s => s !== q));
}
function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

function getDefaultZoom(side) {
  const key = side === 'g' ? ZOOM_KEY_G : ZOOM_KEY_B;
  try { return parseFloat(localStorage.getItem(key)) || null; } catch { return null; }
}
function setDefaultZoom(side, pct) {
  localStorage.setItem(side === 'g' ? ZOOM_KEY_G : ZOOM_KEY_B, String(pct));
}

function zoomPctToLevel(pct) {
  return Math.max(-3, Math.min(3, Math.log(pct / 100) / Math.log(1.2)));
}

export function renderComparisonSearch(container) {
  const zoomG = getDefaultZoom('g');
  const zoomB = getDefaultZoom('b');
  const zoomLevels = {
    g: zoomG !== null ? zoomPctToLevel(zoomG) : 0,
    b: zoomB !== null ? zoomPctToLevel(zoomB) : 0,
  };
  const pctG = zoomG !== null ? zoomG + '%' : '100%';
  const pctB = zoomB !== null ? zoomB + '%' : '100%';

  container.innerHTML = `
    <div class="page" style="display:flex;flex-direction:column;height:100%;">
      <div style="padding:16px 24px 8px;flex-shrink:0;">
        <div class="page-header" style="margin-bottom:10px;">
          <h1 class="page-title">Search</h1>
          <div class="page-accent-bar"></div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;max-width:800px;position:relative;">
          <div style="flex:1;position:relative;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                 style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-tertiary);pointer-events:none;">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input id="cs-input" type="text" placeholder="Search Google & Bing simultaneously..." autocomplete="off"
              style="width:100%;padding:10px 14px 10px 38px;border-radius:10px;border:0.5px solid var(--fill-quaternary);
                     background:var(--fill-quinary);color:var(--text-main);font-size:14px;font-family:inherit;outline:none;
                     transition:border-color .15s;">
          </div>
          <button id="cs-search-btn" style="height:38px;padding:0 20px;border:none;border-radius:10px;
                  background:var(--accent);color:#fff;font-size:13px;font-weight:600;font-family:inherit;
                  cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .12s;white-space:nowrap;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Search
          </button>
        </div>
        <div id="cs-history" style="display:none;max-width:800px;margin-top:4px;"></div>
      </div>
      <div id="cs-panels" style="flex:1;display:flex;gap:1px;overflow:hidden;background:var(--fill-quaternary);min-height:0;">
        ${panelHTML('g', 'Google', '#4285f4', pctG)}
        ${panelHTML('b', 'Bing', '#00a4ef', pctB)}
      </div>
    </div>
  `;

  const input = container.querySelector('#cs-input');
  const searchBtn = container.querySelector('#cs-search-btn');
  const historyEl = container.querySelector('#cs-history');

  input.addEventListener('focus', renderHistory);
  input.addEventListener('input', () => { if (input.value.trim()) historyEl.style.display = 'none'; });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#cs-input') && !e.target.closest('#cs-history')) {
      historyEl.style.display = 'none';
    }
  });

  function renderHistory() {
    const h = getHistory();
    if (h.length === 0) { historyEl.style.display = 'none'; return; }
    historyEl.innerHTML = `
      <div style="background:var(--fill-quinary);border:0.5px solid var(--fill-quaternary);border-radius:8px;padding:4px;max-height:200px;overflow-y:auto;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 8px 2px;">
          <span style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-tertiary);">Recent Searches</span>
          <button id="cs-history-clear" style="background:none;border:none;color:var(--text-tertiary);font-size:9px;cursor:pointer;padding:2px 4px;border-radius:3px;">Clear All</button>
        </div>
        ${h.map(q => `
          <div class="cs-history-item" data-q="${escAttr(q)}" style="display:flex;align-items:center;gap:4px;padding:3px 6px;border-radius:5px;cursor:default;transition:background .1s;">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink:0;opacity:.4;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span class="cs-history-text" style="flex:1;font-size:12px;color:var(--text-muted);cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(q)}</span>
            <button class="cs-history-del" style="background:none;border:none;color:var(--text-tertiary);cursor:pointer;padding:1px 3px;font-size:11px;border-radius:3px;opacity:0;transition:opacity .1s;line-height:1;">&times;</button>
          </div>
        `).join('')}
      </div>
    `;
    historyEl.style.display = '';

    historyEl.querySelectorAll('.cs-history-text').forEach(el => {
      el.addEventListener('click', () => {
        input.value = el.closest('.cs-history-item').dataset.q;
        historyEl.style.display = 'none';
        doSearch();
      });
    });
    historyEl.querySelectorAll('.cs-history-del').forEach(btn => {
      const row = btn.closest('.cs-history-item');
      row.addEventListener('mouseenter', () => { btn.style.opacity = '1'; row.style.background = 'var(--fill-quaternary)'; });
      row.addEventListener('mouseleave', () => { btn.style.opacity = '0'; row.style.background = ''; });
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteHistoryItem(row.dataset.q);
        renderHistory();
      });
    });
    const clearBtn = historyEl.querySelector('#cs-history-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        clearHistory();
        historyEl.style.display = 'none';
      });
    }
  }

  setTimeout(() => input.focus(), 50);

  function doSearch() {
    const q = input.value.trim();
    if (!q) return;
    addSearchHistory(q);
    historyEl.style.display = 'none';
    const encoded = encodeURIComponent(q);
    embedSearch('cs-g-wrap', 'g', zoomLevels, `https://www.google.com/search?q=${encoded}`);
    embedSearch('cs-b-wrap', 'b', zoomLevels, `https://www.bing.com/search?q=${encoded}`);
  }

  searchBtn.addEventListener('click', doSearch);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); doSearch(); }
  });

  ['g', 'b'].forEach(side => {
    container.querySelector(`#cs-${side}-back`).addEventListener('click', () => {
      const wv = container.querySelector(`#cs-${side}-webview`);
      if (wv) wv.goBack();
    });
    container.querySelector(`#cs-${side}-forward`).addEventListener('click', () => {
      const wv = container.querySelector(`#cs-${side}-webview`);
      if (wv) wv.goForward();
    });
    container.querySelector(`#cs-${side}-refresh`).addEventListener('click', () => {
      const wv = container.querySelector(`#cs-${side}-webview`);
      if (wv) wv.reload();
    });
    container.querySelector(`#cs-${side}-zoom-in`).addEventListener('click', () => {
      const wv = container.querySelector(`#cs-${side}-webview`);
      const label = container.querySelector(`#cs-${side}-zoom`);
      if (wv) adjustZoom(wv, label, zoomLevels, side, 0.3);
    });
    container.querySelector(`#cs-${side}-zoom-out`).addEventListener('click', () => {
      const wv = container.querySelector(`#cs-${side}-webview`);
      const label = container.querySelector(`#cs-${side}-zoom`);
      if (wv) adjustZoom(wv, label, zoomLevels, side, -0.3);
    });
    const zoomLabel = container.querySelector(`#cs-${side}-zoom`);
    zoomLabel.addEventListener('click', () => startZoomEdit(zoomLabel, side, zoomLevels));
  });
}

function panelHTML(side, label, color, zoomPct) {
  return `
    <div style="flex:1;display:flex;flex-direction:column;background:var(--bg-primary);overflow:hidden;">
      <div style="display:flex;align-items:center;gap:4px;padding:4px 8px;border-bottom:0.5px solid var(--fill-quaternary);flex-shrink:0;background:var(--fill-seximal);">
        <button id="cs-${side}-back" style="width:24px;height:24px;border:none;border-radius:5px;background:transparent;color:var(--text-tertiary);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .1s;" title="Back">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">${NAV_ICONS.back}</svg>
        </button>
        <button id="cs-${side}-forward" style="width:24px;height:24px;border:none;border-radius:5px;background:transparent;color:var(--text-tertiary);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .1s;" title="Forward">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">${NAV_ICONS.forward}</svg>
        </button>
        <span style="font-size:12px;font-weight:700;color:${color};display:flex;align-items:center;gap:4px;margin:0 4px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">${side === 'g' ? '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>' : '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'}</svg>
          ${label}
        </span>
        <span style="flex:1;"></span>
        <span id="cs-${side}-zoom" style="font-size:9px;color:var(--text-muted);min-width:22px;text-align:center;cursor:pointer;padding:1px 4px;border-radius:3px;transition:background .1s;" title="Click to set default zoom for ${label}">${zoomPct}</span>
        <button id="cs-${side}-zoom-out" style="width:20px;height:20px;border:none;border-radius:4px;background:var(--fill-quaternary);color:var(--text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;transition:all .1s;" title="Zoom out">&minus;</button>
        <button id="cs-${side}-zoom-in" style="width:20px;height:20px;border:none;border-radius:4px;background:var(--fill-quaternary);color:var(--text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;transition:all .1s;" title="Zoom in">+</button>
        <button id="cs-${side}-refresh" style="width:24px;height:24px;border:none;border-radius:5px;background:transparent;color:var(--text-tertiary);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .1s;" title="Refresh">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">${NAV_ICONS.refresh}</svg>
        </button>
      </div>
      <div id="cs-${side}-wrap" style="flex:1;overflow:hidden;position:relative;">
        <div class="cs-empty" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
          <div style="text-align:center;color:var(--text-tertiary);font-size:13px;padding:20px;">
            <div style="margin-bottom:8px;opacity:.3;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            Enter a search query above
          </div>
        </div>
      </div>
    </div>`;
}

function startZoomEdit(zoomLabel, side, zoomLevels) {
  const current = zoomLabel.textContent.replace('%', '');
  const input = document.createElement('input');
  input.type = 'number';
  input.min = 10;
  input.max = 300;
  input.value = current;
  input.style.cssText = 'width:40px;padding:1px 2px;border:0.5px solid var(--accent);border-radius:3px;background:var(--fill-quinary);color:var(--text-main);font-size:9px;font-family:inherit;text-align:center;outline:none;';
  zoomLabel.replaceWith(input);
  input.focus();
  input.select();

  function commit() {
    const val = parseInt(input.value);
    if (!isNaN(val) && val >= 10 && val <= 300) {
      setDefaultZoom(side, val); // only this side
      const wv = document.querySelector(`#cs-${side}-webview`);
      const level = zoomPctToLevel(val);
      zoomLevels[side] = level;
      if (wv) try { wv.setZoomLevel(level); } catch {}
      document.getElementById(`cs-${side}-zoom`).textContent = val + '%';
    } else {
      // restore previous
      const prev = getDefaultZoom(side);
      document.getElementById(`cs-${side}-zoom`).textContent = prev !== null ? prev + '%' : '100%';
    }
    finishEdit(input, zoomLabel);
  }

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { finishEdit(input, zoomLabel); }
  });
}

function finishEdit(input, zoomLabel) {
  const parent = input.parentNode;
  if (parent) parent.replaceChild(zoomLabel, input);
}

function embedSearch(wrapId, side, zoomLevels, url) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;

  wrap.innerHTML = '';

  const webview = document.createElement('webview');
  webview.id = `cs-${side}-webview`;
  webview.src = url;
  webview.style.cssText = 'width:100%;height:100%;border:none;';
  webview.setAttribute('allowpopups', '');
  webview.setAttribute('disablewebsecurity', '');
  // Separate partitions so Google/Bing cookies don't conflict
  webview.setAttribute('partition', `persist:hermes-search-${side}`);

  const zoomLabel = document.getElementById(`cs-${side}-zoom`);

  webview.addEventListener('did-finish-load', () => {
    const saved = getDefaultZoom(side);
    if (saved !== null) {
      const level = zoomPctToLevel(saved);
      zoomLevels[side] = level;
      try { webview.setZoomLevel(level); } catch {}
      if (zoomLabel) zoomLabel.textContent = saved + '%';
    } else {
      zoomLevels[side] = 0;
      try { webview.setZoomLevel(0); } catch {}
      if (zoomLabel) zoomLabel.textContent = '100%';
    }
    // Inject script to override window.open and intercept target=_blank links
    try {
      webview.executeJavaScript(`
        (function(){
          window.open = function(url) { if(url&&typeof url==='string') window.location.href=url; return window; };
          document.addEventListener('click',function(e){
            var a=e.target.closest('a');
            if(a&&a.target==='_blank'&&a.href){ e.preventDefault(); window.location.href=a.href; }
          },true);
        })();
      `);
    } catch {}
  });

  // Intercept new-window (target="_blank", window.open) and navigate here instead
  webview.addEventListener('new-window', (e) => {
    e.preventDefault();
    const url = e.url;
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      webview.loadURL(url);
    }
  });

  webview.addEventListener('did-navigate', () => {
    const saved = getDefaultZoom(side);
    if (saved !== null) {
      const level = zoomPctToLevel(saved);
      zoomLevels[side] = level;
      try { webview.setZoomLevel(level); } catch {}
      if (zoomLabel) zoomLabel.textContent = saved + '%';
    }
  });
  webview.addEventListener('did-navigate-in-page', () => {
    const saved = getDefaultZoom(side);
    if (saved !== null) {
      const level = zoomPctToLevel(saved);
      zoomLevels[side] = level;
      try { webview.setZoomLevel(level); } catch {}
      if (zoomLabel) zoomLabel.textContent = saved + '%';
    }
  });

  wrap.appendChild(webview);
}

function adjustZoom(webview, zoomLabel, zoomLevels, side, delta) {
  const level = zoomLevels[side] || 0;
  const newLevel = Math.max(-3, Math.min(3, level + delta));
  zoomLevels[side] = newLevel;
  try { webview.setZoomLevel(newLevel); } catch {}
  if (zoomLabel) {
    const pct = Math.round(100 * Math.pow(1.2, newLevel));
    zoomLabel.textContent = pct + '%';
  }
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
