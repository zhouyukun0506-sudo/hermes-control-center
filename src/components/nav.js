// ── Navigation Sidebar (Floating Glass Panel with Collapse) ──
import { icons } from '../utils/icons.js';
import { ICON_MAP } from '../utils/icons.js';
import { getCustomPages } from '../utils/pageConfig.js';

const ORDER_KEY = 'hermes_nav_order';
const COLLAPSED_SECTIONS_KEY = 'hermes_collapsed_sections';
const GROUP_CONFIG_KEY = 'hermes_nav_groups';
const SECTION_CONFIG_KEY = 'hermes_nav_section_config';

// ── localStorage helpers ──

function getCollapsedSections() {
  try {
    const raw = localStorage.getItem(COLLAPSED_SECTIONS_KEY);
    if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) return p; }
  } catch {}
  return [];
}

function saveCollapsedSections(arr) {
  localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify(arr));
}

function toggleSection(title) {
  const collapsed = getCollapsedSections();
  const idx = collapsed.indexOf(title);
  if (idx === -1) collapsed.push(title);
  else collapsed.splice(idx, 1);
  saveCollapsedSections(collapsed);
}

function getNavOrder() {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) return p; }
  } catch {}
  return null;
}

function saveNavOrder(order) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(order));
}

function applyOrder(sections, savedOrder) {
  sections.forEach(section => {
    section.items.sort((a, b) => {
      const ai = savedOrder.indexOf(a.id);
      const bi = savedOrder.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  });
}

function getGroupConfig() {
  try {
    const raw = localStorage.getItem(GROUP_CONFIG_KEY);
    if (raw) { const p = JSON.parse(raw); if (p && typeof p === 'object') return p; }
  } catch {}
  return null;
}

function saveGroupConfig(map) {
  localStorage.setItem(GROUP_CONFIG_KEY, JSON.stringify(map));
}

function getSectionConfig() {
  try {
    const raw = localStorage.getItem(SECTION_CONFIG_KEY);
    if (raw) { const p = JSON.parse(raw); if (p && typeof p === 'object') return p; }
  } catch {}
  return null;
}

function saveSectionConfig(config) {
  localStorage.setItem(SECTION_CONFIG_KEY, JSON.stringify(config));
}

// ── Default sections (source of truth for item definitions) ──

const DEFAULT_SECTIONS = [
  {
    key: 'core', title: 'Core',
    items: [
      { id: 'original_webui', label: 'Core UI', icon: icons.shield },
    ]
  },
  {
    key: 'tools', title: 'Tools',
    items: [
      { id: 'dashboard', label: 'Control Center', icon: icons.dashboard },
      { id: 'terminal', label: 'Command Line', icon: icons.code },
      { id: 'calendar', label: 'Calendar', icon: icons.calendar },
    ]
  },
  {
    key: 'system', title: 'System',
    items: [
      { id: 'monitor', label: 'Activity Monitor', icon: icons.pulse },
      { id: 'models', label: 'Model Explorer', icon: icons.cpu },
      { id: 'sessions', label: 'Session Manager', icon: icons.layers },
      { id: 'logs', label: 'Log Viewer', icon: icons.code },
      { id: 'theme', label: 'Theme Customizer', icon: icons.palette },
      { id: 'skills', label: 'Skills', icon: icons.skills },
      { id: 'memory', label: 'Memory', icon: icons.memory },
      { id: 'insights', label: 'Usage Insights', icon: icons.trending },
      { id: 'browser_pages', label: 'Browser Manager', icon: icons.browser },
      { id: 'flip_clock', label: 'Flip Clock', icon: icons.clock },
      { id: 'split_view', label: 'Split View', icon: icons.columns },
      { id: 'comparison_search', label: 'Comparison Search', icon: icons.search },
      { id: 'settings', label: 'Settings', icon: icons.settings },
    ]
  },
];

// Build a lookup of all known items by ID
function getAllKnownItems() {
  const map = {};
  DEFAULT_SECTIONS.forEach(s => s.items.forEach(i => { map[i.id] = { ...i }; }));
  // Add custom/agent pages
  getCustomPages().forEach(p => {
    if (!map[p.id]) {
      map[p.id] = { id: p.id, label: p.label, icon: ICON_MAP[p.icon] || icons.browser };
    }
  });
  return map;
}

// Build sections from config, falling back to defaults
function buildSections(status) {
  const allItems = getAllKnownItems();

  // Add OpenClaw item dynamically if running
  if (status?.openclaw_running && status?.openclaw_url) {
    allItems['openclaw_webui'] = { id: 'openclaw_webui', label: 'OpenClaw', icon: icons.shield };
  } else {
    delete allItems['openclaw_webui'];
  }

  const groupConfig = getGroupConfig();
  const sectionConfig = getSectionConfig();

  // Determine section order
  const defaultSectionKeys = DEFAULT_SECTIONS.map(s => s.key);
  const agentsKey = 'agents';
  let sectionOrder = (sectionConfig?.sections && sectionConfig.sections.length > 0)
    ? sectionConfig.sections
    : [...defaultSectionKeys];
  // Ensure agents key is present if custom pages exist
  if (getCustomPages().length > 0 && !sectionOrder.includes(agentsKey)) {
    sectionOrder.splice(1, 0, agentsKey); // After core
  }

  // Determine section names
  const sectionNames = sectionConfig?.names || {};
  function getName(key) {
    if (sectionNames[key]) return sectionNames[key];
    if (key === agentsKey) return 'Agents';
    const def = DEFAULT_SECTIONS.find(s => s.key === key);
    return def ? def.title : key;
  }

  // Assign items to sections based on groupConfig
  const sectionItems = {};
  sectionOrder.forEach(key => { sectionItems[key] = []; });

  Object.keys(allItems).forEach(id => {
    let targetKey = null;
    if (groupConfig && groupConfig[id]) {
      targetKey = groupConfig[id];
    } else {
      // Find default section
      const defSection = DEFAULT_SECTIONS.find(s => s.items.some(i => i.id === id));
      if (defSection) targetKey = defSection.key;
      else targetKey = agentsKey; // Unknown items go to agents
    }
    if (!sectionItems[targetKey]) sectionItems[targetKey] = [];
    sectionItems[targetKey].push(allItems[id]);
  });

  // Build final sections array
  return sectionOrder
    .filter(key => sectionItems[key] && sectionItems[key].length > 0)
    .map(key => ({
      key,
      title: getName(key),
      items: sectionItems[key],
    }));
}

// Save the current item-to-section mapping from the DOM
function saveCurrentGroupMapping(scrollArea) {
  const mapping = {};
  scrollArea.querySelectorAll('.nav-group').forEach(group => {
    const sectionKey = group.dataset.sectionKey;
    group.querySelectorAll('.nav-item').forEach(item => {
      mapping[item.dataset.page] = sectionKey;
    });
  });
  saveGroupConfig(mapping);
}

// ── Context Menu ──
let activeCtxMenu = null;

function dismissCtxMenu() {
  if (activeCtxMenu) { activeCtxMenu.remove(); activeCtxMenu = null; }
  document.removeEventListener('click', dismissCtxMenu);
  document.removeEventListener('contextmenu', dismissCtxMenu);
}

function showContextMenu(x, y, pageId, sections) {
  dismissCtxMenu();

  const pageLabels = {
    dashboard: 'Control Center', terminal: 'Command Line', original_webui: 'Core UI', openclaw_webui: 'OpenClaw',
    monitor: 'Activity Monitor', models: 'Model Explorer', sessions: 'Session Manager',
    logs: 'Log Viewer', theme: 'Theme Customizer', settings: 'Settings',
    calendar: 'Calendar', skills: 'Skills', memory: 'Memory',
    insights: 'Usage Insights', browser_pages: 'Browser Manager',
    flip_clock: 'Flip Clock', split_view: 'Split View', comparison_search: 'Comparison Search',
  };

  const pageLabel = pageLabels[pageId] || pageId;
  const shortcutMap = { dashboard:'⌘1', terminal:'⌘2', original_webui:'⌘3', monitor:'⌘5', settings:'⌘6', calendar:'⌘7', sessions:'⌘8', logs:'⌘9', theme:'⌘0' };
  const shortcut = shortcutMap[pageId] || '';

  // Find current section of this item
  let currentSectionKey = '';
  const scrollArea = document.querySelector('.nav-scroll-area');
  if (scrollArea) {
    const itemEl = scrollArea.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (itemEl) {
      const group = itemEl.closest('.nav-group');
      if (group) currentSectionKey = group.dataset.sectionKey;
    }
  }

  // Build "Move to" submenu items
  const moveItems = sections
    .filter(s => s.key !== currentSectionKey)
    .map(s => `<div class="ctx-menu-item ctx-submenu-item" data-action="move" data-target="${s.key}">
      <span>${s.title}</span>
    </div>`).join('');

  const menu = document.createElement('div');
  menu.className = 'ctx-menu';
  menu.innerHTML = `
    <div class="ctx-menu-item" data-action="open">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      <span>Open${shortcut ? ` <span style="margin-left:auto;font-family:var(--font-mono);font-size:10px;opacity:0.5;">${shortcut}</span>` : ''}</span>
    </div>
    <div class="ctx-menu-item" data-action="copy-name">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      <span>Copy Name</span>
    </div>
    ${moveItems ? `
    <div class="ctx-menu-sep"></div>
    <div class="ctx-menu-item ctx-menu-parent" data-action="move-to" style="position:relative;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9l4-4 4 4"/><path d="M9 5v14"/><path d="M19 15l-4 4-4-4"/><path d="M15 19V5"/></svg>
      <span>Move to…</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="margin-left:auto;opacity:0.4;"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
    <div class="ctx-submenu" style="display:none;">
      ${moveItems}
    </div>
    ` : ''}
    <div class="ctx-menu-sep"></div>
    <div class="ctx-menu-item" data-action="open-new-window">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      <span>Open in New Window</span>
    </div>
  `;

  document.body.appendChild(menu);
  activeCtxMenu = menu;

  // Position: clamp to viewport
  const mw = menu.offsetWidth;
  const mh = menu.offsetHeight;
  menu.style.left = Math.min(x, window.innerWidth - mw - 8) + 'px';
  menu.style.top = Math.min(y, window.innerHeight - mh - 8) + 'px';

  // Dismiss on next click
  setTimeout(() => {
    document.addEventListener('click', dismissCtxMenu);
    document.addEventListener('contextmenu', dismissCtxMenu);
  }, 0);

  // Actions
  menu.querySelector('[data-action="open"]').addEventListener('click', () => {
    dismissCtxMenu();
    if (window.__navigateTo) window.__navigateTo(pageId);
  });

  menu.querySelector('[data-action="copy-name"]').addEventListener('click', () => {
    dismissCtxMenu();
    navigator.clipboard.writeText(pageLabel).catch(() => {});
  });

  menu.querySelector('[data-action="open-new-window"]').addEventListener('click', () => {
    dismissCtxMenu();
    window.open(window.location.href, '_blank');
  });

  // Move-to submenu
  const moveParent = menu.querySelector('[data-action="move-to"]');
  const submenu = menu.querySelector('.ctx-submenu');
  if (moveParent && submenu) {
    moveParent.addEventListener('mouseenter', () => {
      submenu.style.display = 'block';
      const rect = moveParent.getBoundingClientRect();
      submenu.style.left = (rect.right + 2) + 'px';
      submenu.style.top = rect.top + 'px';
      // Clamp submenu to viewport
      requestAnimationFrame(() => {
        const smr = submenu.getBoundingClientRect();
        if (smr.right > window.innerWidth) {
          submenu.style.left = (rect.left - smr.width - 2) + 'px';
        }
        if (smr.bottom > window.innerHeight) {
          submenu.style.top = (window.innerHeight - smr.height - 8) + 'px';
        }
      });
    });
    moveParent.addEventListener('mouseleave', () => {
      setTimeout(() => { if (!submenu.matches(':hover')) submenu.style.display = 'none'; }, 100);
    });
    submenu.addEventListener('mouseenter', () => { submenu.style.display = 'block'; });
    submenu.addEventListener('mouseleave', () => { submenu.style.display = 'none'; });
  }

  // Move-to item clicks
  menu.querySelectorAll('[data-action="move"]').forEach(el => {
    el.addEventListener('click', () => {
      dismissCtxMenu();
      const targetKey = el.dataset.target;
      moveItemToSection(pageId, targetKey);
    });
  });
}

function moveItemToSection(pageId, targetKey) {
  const groupConfig = getGroupConfig() || {};
  // Get default section key for this item
  const defSection = DEFAULT_SECTIONS.find(s => s.items.some(i => i.id === pageId));
  const defKey = defSection ? defSection.key : (getCustomPages().some(p => p.id === pageId) ? 'agents' : 'system');
  groupConfig[pageId] = targetKey;
  saveGroupConfig(groupConfig);
  // Re-render
  if (window.__renderNav) window.__renderNav();
}

// ── Section rename ──

function startRenameSection(headerEl, sectionKey, renderFn) {
  const span = headerEl.querySelector('span');
  if (!span || headerEl.querySelector('input')) return;

  const currentName = span.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.className = 'nav-group-rename-input';
  input.style.cssText = `
    background: rgba(255,255,255,0.08); border: 1px solid rgba(0,135,255,0.4);
    border-radius: 4px; color: var(--text-main); font: inherit; font-size: 11px;
    font-weight: 600; text-transform: uppercase; letter-spacing: .8px;
    padding: 1px 6px; width: 120px; outline: none;
  `;

  span.replaceWith(input);
  input.focus();
  input.select();

  function save() {
    const newName = input.value.trim() || currentName;
    const config = getSectionConfig() || {};
    if (!config.names) config.names = {};
    // Always ensure sections array includes all known keys
    if (!config.sections || !Array.isArray(config.sections) || config.sections.length === 0) {
      const agentsKey = 'agents';
      config.sections = [...DEFAULT_SECTIONS.map(s => s.key)];
      if (getCustomPages().length > 0 && !config.sections.includes(agentsKey)) {
        config.sections.splice(1, 0, agentsKey);
      }
    }
    if (newName !== currentName) {
      config.names[sectionKey] = newName;
      saveSectionConfig(config);
      // Also update collapsed sections key if it was using old name
      const collapsed = getCollapsedSections();
      const idx = collapsed.indexOf(currentName);
      if (idx !== -1) {
        collapsed[idx] = newName;
        saveCollapsedSections(collapsed);
      }
    }
    renderFn();
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') { renderFn(); }
  });
  input.addEventListener('blur', save);
}

// ── Main render ──

export function renderNav(container, { activePage, onNavigate, status }) {
  const online = status?.webui_running;
  const collapsed = localStorage.getItem('hermes_sidebar_collapsed') === 'true';
  const gwOnline = status?.gateway_running;

  // Expose renderNav globally for context menu re-render
  window.__renderNav = () => renderNav(container, { activePage, onNavigate, status });

  const sections = buildSections(status);

  // Apply saved drag order within each section
  const savedOrder = getNavOrder();
  if (savedOrder) {
    applyOrder(sections, savedOrder);
  } else {
    saveNavOrder(sections.flatMap(s => s.items.map(i => i.id)));
  }

  // Set initial collapsed state
  if (collapsed) {
    container.classList.add('sidebar-collapsed');
  }

  const showFooter = localStorage.getItem('hermes_show_status_footer') !== 'false';

  container.innerHTML = `
    <div class="sidebar-edge"></div>

    <div class="traffic-lights">
      <button class="tl-btn tl-close" id="tl-close" title="Close">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 3l6 6M9 3l-6 6"/></svg>
      </button>
      <button class="tl-btn tl-minimize" id="tl-minimize" title="Minimize">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="2" y1="6" x2="10" y2="6"/></svg>
      </button>
      <button class="tl-btn tl-maximize" id="tl-maximize" title="Maximize">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="8" height="8" rx="1"/></svg>
      </button>
      <button class="tl-btn tl-fullscreen" id="tl-fullscreen" title="Fullscreen">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8"/>
        </svg>
      </button>
    </div>

    <span class="logo-text">
      <span style="display:inline-flex;align-items:center;gap:8px;">
        <span style="width:6px;height:6px;border-radius:50%;background:var(--accent);display:inline-block;"></span>
        Workbench
      </span>
    </span>

    <div class="nav-scroll-area" style="flex: 1; overflow-y: auto;">
      ${sections.map(section => {
        const isCollapsed = getCollapsedSections().includes(section.title);
        return `
        <div class="nav-group${isCollapsed ? ' nav-group-collapsed' : ''}" data-section="${section.title}" data-section-key="${section.key}">
          <div class="nav-group-header" data-section-toggle="${section.title}" data-section-key="${section.key}" draggable="true" title="Drag to reorder · Double-click to rename">
            <svg class="nav-group-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            <span>${section.title}</span>
          </div>
          <div class="nav-group-items" data-section-key="${section.key}">
          ${section.items.map(item => `
            <div class="nav-item ${activePage === item.id ? 'active' : ''}" data-page="${item.id}" draggable="true">
              <span class="nav-icon">${item.icon || ''}</span>
              <span>${item.label}</span>
            </div>
          `).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>

    <div class="sidebar-footer">
      <div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
        <div class="status-indicator ${online ? 'online' : 'offline'}">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0;"></span>
          <span>${online ? 'Online' : 'Offline'}</span>
        </div>
        <button class="sidebar-quit-btn" id="sidebar-quit" title="Quit Workbench" style="width:24px;height:24px;border:none;border-radius:5px;background:transparent;color:var(--text-tertiary);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
      ${showFooter ? `
      <div class="status-footer-text" style="font-size: 10px; color: var(--text-muted); text-align: center; padding: 0 8px; white-space: nowrap;">
        GW:${gwOnline ? 'OK' : 'ERR'} · UI:${online ? 'OK' : 'ERR'}
      </div>
      ` : ''}
      <button class="sidebar-toggle" id="sidebar-toggle" title="${collapsed ? 'Expand sidebar' : 'Collapse sidebar'}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <span class="sidebar-toggle-text">Collapse</span>
      </button>
    </div>
  `;

  // Traffic light buttons
  const tlClose = container.querySelector('#tl-close');
  const tlMin = container.querySelector('#tl-minimize');
  const tlMax = container.querySelector('#tl-maximize');
  const tlFs = container.querySelector('#tl-fullscreen');
  if (tlClose) tlClose.addEventListener('click', (e) => { e.stopPropagation(); window.electronAPI?.close(); });
  if (tlMin) tlMin.addEventListener('click', (e) => { e.stopPropagation(); window.electronAPI?.minimize(); });
  if (tlMax) tlMax.addEventListener('click', (e) => { e.stopPropagation(); window.electronAPI?.maximize(); });
  if (tlFs) tlFs.addEventListener('click', (e) => { e.stopPropagation(); window.electronAPI?.fullscreen(); });

  // Quit button
  const quitBtn = container.querySelector('#sidebar-quit');
  if (quitBtn) {
    quitBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.send('app-quit');
      } else {
        fetch('/ctrl/quit', { method: 'POST' }).catch(() => {});
      }
    });
    quitBtn.addEventListener('mouseenter', () => { quitBtn.style.color = '#ff453a'; quitBtn.style.background = 'rgba(255,69,58,0.15)'; });
    quitBtn.addEventListener('mouseleave', () => { quitBtn.style.color = 'var(--text-tertiary)'; quitBtn.style.background = 'transparent'; });
  }

  // Nav click events
  container.querySelectorAll('.nav-item').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onNavigate(el.dataset.page);
    });

    // Right-click context menu
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showContextMenu(e.clientX, e.clientY, el.dataset.page, sections);
    });
  });

  // Section collapse toggle
  container.querySelectorAll('[data-section-toggle]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('input')) return;
      e.preventDefault();
      e.stopPropagation();
      const title = el.dataset.sectionToggle;
      toggleSection(title);
      const group = el.closest('.nav-group');
      group.classList.toggle('nav-group-collapsed');
    });
  });

  // Double-click section header to rename
  container.querySelectorAll('.nav-group-header').forEach((el) => {
    el.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      startRenameSection(el, el.dataset.sectionKey, window.__renderNav);
    });
  });

  // Keyboard: make sidebar focusable
  {
    container.addEventListener('keydown', (e) => {
      if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
      // ↑/↓ handled globally in main.js — don't duplicate here
    });

    container.setAttribute('tabindex', '0');
    container.style.outline = 'none';
  }

  // Drag-to-reorder (items + sections)
  const scrollArea = container.querySelector('.nav-scroll-area');
  let dragType = null; // 'item' or 'section'
  let dragId = null;

  scrollArea.addEventListener('dragstart', (e) => {
    const header = e.target.closest('.nav-group-header');
    const item = e.target.closest('.nav-item');
    if (header) {
      dragType = 'section';
      dragId = header.dataset.sectionKey;
      header.classList.add('nav-section-dragging');
      e.dataTransfer.effectAllowed = 'move';
    } else if (item) {
      dragType = 'item';
      dragId = item.dataset.page;
      item.classList.add('nav-dragging');
      e.dataTransfer.effectAllowed = 'move';
    }
  });

  scrollArea.addEventListener('dragend', () => {
    scrollArea.querySelectorAll('.nav-dragging, .nav-section-dragging').forEach(el => {
      el.classList.remove('nav-dragging', 'nav-section-dragging');
    });
    scrollArea.querySelectorAll('.nav-drop-target').forEach(el => el.classList.remove('nav-drop-target'));
    scrollArea.querySelectorAll('.nav-group-drop-target').forEach(el => el.classList.remove('nav-group-drop-target'));
    scrollArea.querySelectorAll('.nav-group').forEach(el => {
      el.classList.remove('nav-group-drop-before', 'nav-group-drop-after');
      el.style.boxShadow = '';
    });
    scrollArea.querySelectorAll('.nav-item').forEach(el => { el.style.boxShadow = ''; });
    dragType = null;
    dragId = null;
  });

  scrollArea.addEventListener('dragover', (e) => {
    e.preventDefault();

    if (dragType === 'section') {
      // Section reordering — highlight between groups
      const group = e.target.closest('.nav-group');
      if (!group || group.dataset.sectionKey === dragId) return;

      scrollArea.querySelectorAll('.nav-group').forEach(el => {
        el.classList.remove('nav-group-drop-before', 'nav-group-drop-after');
      });

      const rect = group.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (e.clientY < mid) {
        group.classList.add('nav-group-drop-before');
      } else {
        group.classList.add('nav-group-drop-after');
      }
      return;
    }

    if (dragType === 'item') {
      const target = e.target.closest('.nav-item');
      if (!target || target.dataset.page === dragId) return;

      scrollArea.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('nav-drop-target');
        el.style.boxShadow = '';
      });

      const rect = target.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (e.clientY < mid) {
        target.classList.add('nav-drop-target');
        target.style.boxShadow = '';
      } else {
        target.style.boxShadow = '0 2px 0 var(--accent)';
      }

      const targetGroup = target.closest('.nav-group');
      scrollArea.querySelectorAll('.nav-group').forEach(el => el.classList.remove('nav-group-drop-target'));
      if (targetGroup) targetGroup.classList.add('nav-group-drop-target');
    }
  });

  scrollArea.addEventListener('dragleave', (e) => {
    if (dragType === 'section') {
      const group = e.target.closest('.nav-group');
      if (group) {
        group.classList.remove('nav-group-drop-before', 'nav-group-drop-after');
      }
    }
    if (dragType === 'item') {
      const target = e.target.closest('.nav-item');
      if (target) {
        target.classList.remove('nav-drop-target');
        target.style.boxShadow = '';
      }
      if (!e.target.closest('.nav-group-items')) {
        const group = e.target.closest('.nav-group');
        if (group) group.classList.remove('nav-group-drop-target');
      }
    }
  });

  scrollArea.addEventListener('drop', (e) => {
    e.preventDefault();

    // Clean up all visual states
    scrollArea.querySelectorAll('.nav-dragging, .nav-section-dragging').forEach(el => {
      el.classList.remove('nav-dragging', 'nav-section-dragging');
    });
    scrollArea.querySelectorAll('.nav-drop-target').forEach(el => el.classList.remove('nav-drop-target'));
    scrollArea.querySelectorAll('.nav-group-drop-target').forEach(el => el.classList.remove('nav-group-drop-target'));
    scrollArea.querySelectorAll('.nav-group').forEach(el => {
      el.classList.remove('nav-group-drop-before', 'nav-group-drop-after');
      el.style.boxShadow = '';
    });
    scrollArea.querySelectorAll('.nav-item').forEach(el => { el.style.boxShadow = ''; });

    if (dragType === 'section') {
      const targetGroup = e.target.closest('.nav-group');
      if (!targetGroup || targetGroup.dataset.sectionKey === dragId) return;

      const rect = targetGroup.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const insertBefore = e.clientY < mid;

      // Get current section order from DOM
      const currentOrder = [...scrollArea.querySelectorAll('.nav-group')].map(g => g.dataset.sectionKey);
      const fromIdx = currentOrder.indexOf(dragId);
      const toIdx = currentOrder.indexOf(targetGroup.dataset.sectionKey);
      if (fromIdx === -1 || toIdx === -1) return;

      // Reorder
      currentOrder.splice(fromIdx, 1);
      let newToIdx = currentOrder.indexOf(targetGroup.dataset.sectionKey);
      if (!insertBefore) newToIdx++;
      currentOrder.splice(newToIdx, 0, dragId);

      // Save
      const config = getSectionConfig() || {};
      config.sections = currentOrder;
      saveSectionConfig(config);

      renderNav(container, { activePage, onNavigate, status });
      return;
    }

    if (dragType === 'item') {
      const target = e.target.closest('.nav-item');
      if (!target || !dragId || target.dataset.page === dragId) return;

      // Determine if cross-section move
      const sourceItem = scrollArea.querySelector(`.nav-item[data-page="${dragId}"]`);
      const sourceGroup = sourceItem?.closest('.nav-group');
      const targetGroup = target.closest('.nav-group');

      if (sourceGroup && targetGroup && sourceGroup.dataset.sectionKey !== targetGroup.dataset.sectionKey) {
        const groupConfig = getGroupConfig() || {};
        groupConfig[dragId] = targetGroup.dataset.sectionKey;
        saveGroupConfig(groupConfig);
        renderNav(container, { activePage, onNavigate, status });
        return;
      }

      // Same-section reorder
      const allItems = [...scrollArea.querySelectorAll('.nav-item')].map(el => el.dataset.page);
      const fromIdx = allItems.indexOf(dragId);
      const toIdx = allItems.indexOf(target.dataset.page);
      if (fromIdx === -1 || toIdx === -1) return;

      allItems.splice(fromIdx, 1);
      allItems.splice(toIdx, 0, dragId);
      saveNavOrder(allItems);

      renderNav(container, { activePage, onNavigate, status });
    }
  });

  // Toggle collapse
  const toggleBtn = container.querySelector('#sidebar-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCollapsed = container.classList.toggle('sidebar-collapsed');
      localStorage.setItem('hermes_sidebar_collapsed', isCollapsed);
      toggleBtn.title = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
      if (isCollapsed) {
        container.style.width = '';
        document.documentElement.style.setProperty('--sidebar-w', 'var(--sidebar-collapsed-w)');
      } else {
        const saved = localStorage.getItem('hermes_sidebar_width');
        if (saved) {
          container.style.width = saved;
          document.documentElement.style.setProperty('--sidebar-w', saved);
        }
      }
    });
  }

  // Click sidebar anywhere to expand when collapsed
  container.addEventListener('click', () => {
    if (container.classList.contains('sidebar-collapsed')) {
      container.classList.remove('sidebar-collapsed');
      localStorage.setItem('hermes_sidebar_collapsed', 'false');
      if (toggleBtn) toggleBtn.title = 'Collapse sidebar';
    }
  });
}
