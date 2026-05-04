// ── Quick Actions System (Toolbar + Command Palette + Drawer) ──
import { icons } from '../utils/icons.js';
import * as api from '../api.js';

let ctx = null;
let cleanupFns = [];

const ALL_ACTIONS = [
  { id: 'dashboard',   label: 'Control Center',     icon: icons.dashboard,  color: '#BB2649', pinned: true,  run: a => a.ctx.onNavigate('dashboard') },
  { id: 'terminal',    label: 'Command Line',        icon: icons.code,       color: '#32d74b', pinned: true,  run: a => a.ctx.onNavigate('terminal') },
  { id: 'theme_cycle', label: 'Cycle Theme',         icon: icons.palette,    color: '#bf5af2', pinned: true,  run: () => {
    const themes = ['default','matrix','vapor','white','fig1','fig2','fig3','fig4','fig5'];
    const cur = localStorage.getItem('hermes_theme') || 'default';
    const idx = (themes.indexOf(cur) + 1) % themes.length;
    localStorage.setItem('hermes_theme', themes[idx]);
    if (window.applyVisuals) window.applyVisuals();
  }},
  { id: 'restart',     label: 'Restart WebUI',       icon: icons.refresh,    color: '#ff453a', pinned: true,  run: async a => {
    try {
      await api.ctrl.stop(() => {});
      await new Promise(r => setTimeout(r, 1000));
      await api.ctrl.start(() => {});
      await new Promise(r => setTimeout(r, 2000));
      if (a.ctx.onStatusChange) a.ctx.onStatusChange(true);
    } catch {}
  }},
  { id: 'sessions',    label: 'Session Manager',     icon: icons.layers,    color: '#64d2ff', run: a => a.ctx.onNavigate('sessions') },
  { id: 'models',      label: 'Model Explorer',      icon: icons.cpu,        color: '#10a37f', run: a => a.ctx.onNavigate('models') },
  { id: 'logs',        label: 'Log Viewer',          icon: icons.code,       color: '#32d74b', run: a => a.ctx.onNavigate('logs') },
  { id: 'theme',       label: 'Theme Customizer',    icon: icons.palette,    color: '#bf5af2', run: a => a.ctx.onNavigate('theme') },
  { id: 'settings',    label: 'Settings',            icon: icons.settings,   color: '#86868b', run: a => a.ctx.onNavigate('settings') },
  { id: 'monitor',     label: 'Activity Monitor',    icon: icons.pulse,      color: '#86868b', run: a => a.ctx.onNavigate('monitor') },
  { id: 'skills',      label: 'Skills',              icon: icons.skills,     color: '#f1c40f', run: a => a.ctx.onNavigate('skills') },
  { id: 'memory',      label: 'Memory',              icon: icons.memory,     color: '#e67e22', run: a => a.ctx.onNavigate('memory') },
  { id: 'calendar',    label: 'Calendar',            icon: icons.calendar,  color: '#e74c3c', run: a => a.ctx.onNavigate('calendar') },
  { id: 'insights',    label: 'Usage Insights',       icon: icons.trending,  color: '#BB2649', run: a => a.ctx.onNavigate('insights') },
  { id: 'killall',     label: 'Kill All Sessions',   icon: icons.trash,      color: '#ff453a', run: async () => {
    try {
      const data = await api.sessions.list();
      const sessions = Array.isArray(data) ? data : (data.sessions || data.data || []);
      for (const s of sessions) {
        const id = s.session_id || s.id;
        if (id) await api.sessions.delete(id).catch(() => {});
      }
    } catch {}
  }},
];

const DRAWER_GROUPS = [
  { title: 'Navigation', items: ['dashboard', 'terminal', 'monitor', 'settings', 'calendar'] },
  { title: 'Manage', items: ['sessions', 'models', 'logs', 'skills', 'memory', 'insights'] },
  { title: 'Customize', items: ['theme_cycle', 'theme'] },
  { title: 'System', items: ['restart', 'killall'] },
];

// ── Exported: call once from main.js ──
export function initQuickActions(appCtx) {
  ctx = appCtx;
  cleanupFns = [];
  ALL_ACTIONS.forEach(a => { a.ctx = ctx; });

  const toolbar = createToolbar();
  const palette = createPalette();
  const drawer = createDrawer();

  document.getElementById('qa-toolbar').appendChild(toolbar);
  document.body.appendChild(palette);
  document.body.appendChild(drawer);

  // Keyboard shortcuts
  const onKey = e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openPalette(); }
    if (e.key === 'Escape') { closePalette(); closeDrawer(); }
  };
  document.addEventListener('keydown', onKey);
  cleanupFns.push(() => document.removeEventListener('keydown', onKey));

  return () => cleanupFns.forEach(f => f());
}

// ── Toolbar ──
function createToolbar() {
  const bar = document.createElement('div');
  bar.id = 'qa-bar';

  ALL_ACTIONS.filter(a => a.pinned).forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'qa-tb-btn';
    btn.dataset.action = a.id;
    const shortcutHint = ({dashboard:'⌘1',terminal:'⌘2',calendar:'⌘0'})[a.id] || '';
    btn.title = a.label + (shortcutHint ? ` (${shortcutHint})` : '');
    btn.innerHTML = a.icon;
    // Active state for current page
    if (a.id === ctx.activePage || (a.id === 'theme_cycle' && ctx.activePage === 'theme')) {
      btn.dataset.active = 'true';
    }
    btn.addEventListener('click', () => runAction(a.id));
    bar.appendChild(btn);

    // Label tooltip popover
    const tip = document.createElement('div');
    tip.textContent = a.label;
    tip.style.cssText = `
      position: fixed; z-index: 999; padding: 4px 10px; border-radius: 6px;
      background: var(--fill-quinary); border: 0.5px solid var(--fill-quaternary);
      color: var(--text-main); font-size: 11px; font-weight: 500;
      white-space: nowrap; pointer-events: none; opacity: 0;
      transition: opacity .12s; transform: translateY(-100%); margin-top: -6px;
    `;
    document.body.appendChild(tip);
    let tipTimer;
    btn.addEventListener('mouseenter', () => {
      tipTimer = setTimeout(() => {
        const r = btn.getBoundingClientRect();
        const tipW = tip.offsetWidth;
        let left = r.left + r.width / 2 - tipW / 2;
        left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));
        tip.style.left = left + 'px';
        tip.style.top = (r.top - 6) + 'px';
        tip.style.opacity = '1';
      }, 400);
    });
    btn.addEventListener('mouseleave', () => { clearTimeout(tipTimer); tip.style.opacity = '0'; });
  });

  // Separator
  const sep = document.createElement('div');
  sep.className = 'qa-sep';
  bar.appendChild(sep);

  // Spacer
  const spacer = document.createElement('div');
  spacer.style.cssText = 'flex:1;';
  bar.appendChild(spacer);

  // Cmd+K pill
  const chip = document.createElement('button');
  chip.className = 'qa-search-chip';
  chip.title = 'Search actions (⌘K)';
  chip.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Search<span class="qa-kbd">⌘K</span>';
  chip.addEventListener('click', openPalette);
  bar.appendChild(chip);

  // Drawer toggle
  const menuBtn = document.createElement('button');
  menuBtn.className = 'qa-menu-btn';
  menuBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>';
  menuBtn.title = 'All Actions';
  menuBtn.addEventListener('click', toggleDrawer);
  bar.appendChild(menuBtn);

  // Recalculate toolbar button active state on navigate
  const origNav = ctx.onNavigate;
  const wrappedNav = (page, ...rest) => {
    bar.querySelectorAll('.qa-tb-btn').forEach(b => {
      const a = ALL_ACTIONS.find(x => x.id === b.dataset.action);
      if (!a) return;
      const isActive = a.id === page || (a.id === 'theme_cycle' && page === 'theme');
      b.toggleAttribute('data-active', isActive);
    });
    origNav(page, ...rest);
  };
  ctx.onNavigate = wrappedNav;

  return bar;
}

// ── Command Palette ──
function createPalette() {
  const overlay = document.createElement('div');
  overlay.id = 'qa-palette';
  overlay.style.cssText = `
    display: none; position: fixed; inset: 0; z-index: 1000;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
    align-items: flex-start; justify-content: center; padding-top: 15vh;
    opacity: 0; transition: opacity .15s;
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) closePalette(); });

  let selectedIdx = 0;

  overlay.innerHTML = `
    <div style="width: 520px; max-width: 90vw; background: transparent; border: none;
                border-radius: 16px; overflow: visible; box-shadow: 0 25px 60px rgba(0,0,0,0.5);
                transform: scale(0.96); transition: transform .15s;">
      <div style="display: flex; align-items: center; border-bottom: 1px solid var(--card-border); padding: 0 16px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;color:var(--text-muted);">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input id="qa-palette-input" type="text" placeholder="Search actions…" autofocus
          style="flex:1; background: none; border: none; outline: none; padding: 14px 12px;
                 color: var(--text-main); font-size: 15px; font-family: inherit;">
        <span style="font-size:10px; color:var(--text-muted); background:var(--card-bg);
                     padding:2px 6px; border-radius:4px; font-family:var(--font-mono);">esc</span>
      </div>
      <div id="qa-palette-list" style="max-height: 360px; overflow-y: auto; padding: 6px 8px;"></div>
    </div>
  `;

  const card = overlay.querySelector('div > div');
  const input = overlay.querySelector('#qa-palette-input');
  const listEl = overlay.querySelector('#qa-palette-list');

  function getFiltered(query) {
    if (!query) return ALL_ACTIONS;
    const q = query.toLowerCase();
    return ALL_ACTIONS.filter(a => a.label.toLowerCase().includes(q) || a.id.includes(q));
  }

  function filterList() {
    const q = input.value;
    selectedIdx = 0;
    renderList(getFiltered(q), q);
  }

  function renderList(actions, query) {
    if (actions.length === 0) {
      listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">No matching actions</div>';
      return;
    }
    listEl.innerHTML = actions.map((a, i) => {
      const label = query ? highlightText(a.label, query) : esc(a.label);
      return `
        <div class="qa-palette-item" data-idx="${i}" style="
          display: flex; align-items: center; gap: 10px; padding: 8px 12px;
          border-radius: 8px; cursor: pointer; margin-bottom: 1px;
          background: ${i === selectedIdx ? 'var(--nav-hover)' : 'transparent'};
          transition: all .06s;
        ">
          <span style="flex-shrink:0; width: 24px; height: 24px; border-radius: 6px;
                       display:flex; align-items:center; justify-content:center; font-size:13px; color:${a.color};">
            ${a.icon}
          </span>
          <span style="font-size: 13px; font-weight: ${i === selectedIdx ? '600' : '500'}; flex:1; color: ${i === selectedIdx ? 'var(--text-main)' : 'var(--text-muted)'};">${label}</span>
          <span style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono);opacity:${i === selectedIdx ? '1' : '0'};">↵</span>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.qa-palette-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx);
        const action = getFiltered(input.value)[idx];
        if (action) { closePalette(); runAction(action.id); }
      });
      el.addEventListener('mouseenter', () => {
        selectedIdx = parseInt(el.dataset.idx);
        renderList(getFiltered(input.value), input.value);
      });
    });
  }

  let queryAtInput = '';
  input.addEventListener('input', () => { queryAtInput = input.value; filterList(); });
  input.addEventListener('keydown', e => {
    const actions = getFiltered(input.value);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIdx = Math.min(selectedIdx + 1, actions.length - 1);
      renderList(actions, input.value);
      listEl.children[selectedIdx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIdx = Math.max(selectedIdx - 1, 0);
      renderList(actions, input.value);
      listEl.children[selectedIdx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const action = actions[selectedIdx];
      if (action) { closePalette(); runAction(action.id); }
    }
  });

  overlay._open = () => {
    selectedIdx = 0;
    input.value = '';
    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      card.style.transform = 'scale(1)';
    });
    filterList();
    setTimeout(() => input.focus(), 80);
  };

  overlay._close = () => {
    overlay.style.opacity = '0';
    card.style.transform = 'scale(0.96)';
    setTimeout(() => { overlay.style.display = 'none'; }, 150);
  };

  overlay._card = card;
  return overlay;
}

function openPalette() {
  document.getElementById('qa-palette')?._open();
}
function closePalette() {
  document.getElementById('qa-palette')?._close();
}

// ── Drawer ──
function createDrawer() {
  const backdrop = document.createElement('div');
  backdrop.id = 'qa-drawer-backdrop';
  backdrop.style.cssText = 'display:none;position:fixed;inset:0;z-index:900;background:rgba(0,0,0,0.3);opacity:0;transition:opacity .2s;';
  backdrop.addEventListener('click', closeDrawer);

  const panel = document.createElement('div');
  panel.id = 'qa-drawer';
  panel.style.cssText = `
    position: fixed; top: 60px; right: 16px; width: 280px; max-height: calc(100% - 80px);
    z-index: 901; border-radius: 16px;
    background: linear-gradient(145deg, var(--glass-card-light, rgba(255,255,255,0.12)), var(--glass-bg-dark-hero, rgba(0,0,0,0.18)));
    backdrop-filter: blur(25px) saturate(180%);
    -webkit-backdrop-filter: blur(25px) saturate(180%);
    border: 0.5px solid rgba(255,255,255,0.10);
    display: flex; flex-direction: column;
    transform: translateY(-8px) scale(0.96);
    opacity: 0; pointer-events: none;
    transition: all .2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 16px 48px rgba(0,0,0,0.4);
  `;

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.06);">
      <span style="font-weight:700;font-size:14px;color:var(--text-main);">All Actions</span>
      <button id="qa-drawer-close" style="width:26px;height:26px;border:none;border-radius:6px;background:rgba(255,255,255,0.06);
             color:var(--text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;"
             onmouseenter="this.style.background='rgba(255,255,255,0.12)';this.style.color='var(--text-main)'"
             onmouseleave="this.style.background='rgba(255,255,255,0.06)';this.style.color='var(--text-muted)'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div id="qa-drawer-list" style="flex:1;overflow-y:auto;padding:4px 8px;max-height:400px;"></div>
  `;

  const listEl = panel.querySelector('#qa-drawer-list');

  listEl.innerHTML = DRAWER_GROUPS.map(g => `
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;
                color:var(--text-muted);padding:12px 12px 6px;opacity:.6;">${g.title}</div>
    ${g.items.map(id => {
      const a = ALL_ACTIONS.find(x => x.id === id);
      if (!a) return '';
      return `
        <div class="qa-drawer-item" data-id="${a.id}" style="
          display: flex; align-items: center; gap: 10px; padding: 8px 10px;
          border-radius: 8px; cursor: pointer; transition: all .1s;
          color: var(--text-muted);
        ">
          <span style="flex-shrink:0; width: 22px; height: 22px; border-radius: 6px;
                       background: ${a.color}18; display:flex; align-items:center; justify-content:center;
                       color: ${a.color};">${a.icon.replace('viewBox=', 'width="12" height="12" viewBox=')}</span>
          <span style="font-size: 13px; font-weight: 500;">${esc(a.label)}</span>
        </div>
      `;
    }).join('')}
  `).join('');

  listEl.querySelectorAll('.qa-drawer-item').forEach(el => {
    el.addEventListener('click', () => { closeDrawer(); runAction(el.dataset.id); });
    el.addEventListener('mouseenter', () => { el.style.background = 'var(--nav-hover)'; el.style.color = 'var(--text-main)'; });
    el.addEventListener('mouseleave', () => { el.style.background = 'transparent'; el.style.color = 'var(--text-muted)'; });
  });

  panel.querySelector('#qa-drawer-close').addEventListener('click', closeDrawer);

  backdrop._panel = panel;
  document.body.appendChild(panel);
  return backdrop;
}

function toggleDrawer() {
  const panel = document.getElementById('qa-drawer');
  const backdrop = document.getElementById('qa-drawer-backdrop');
  if (!panel || !backdrop) return;
  const open = panel.style.pointerEvents === 'auto';
  if (open) { closeDrawer(); return; }
  backdrop.style.display = 'block';
  requestAnimationFrame(() => {
    backdrop.style.opacity = '1';
    panel.style.transform = 'translateY(0) scale(1)';
    panel.style.opacity = '1';
    panel.style.pointerEvents = 'auto';
  });
}

function closeDrawer() {
  const panel = document.getElementById('qa-drawer');
  const backdrop = document.getElementById('qa-drawer-backdrop');
  if (panel) {
    panel.style.transform = 'translateY(-8px) scale(0.96)';
    panel.style.opacity = '0';
    panel.style.pointerEvents = 'none';
  }
  if (backdrop) {
    backdrop.style.opacity = '0';
    setTimeout(() => { backdrop.style.display = 'none'; }, 200);
  }
}

// ── Helpers ──
function runAction(id) {
  const action = ALL_ACTIONS.find(a => a.id === id);
  if (!action) return;
  Promise.resolve(action.run(action)).catch(() => {});
}

function highlightText(text, query) {
  if (!query) return esc(text);
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return esc(text);
  return esc(text.slice(0, idx)) + '<strong style="color:var(--accent);font-weight:700;">' + esc(text.slice(idx, idx + q.length)) + '</strong>' + esc(text.slice(idx + q.length));
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
