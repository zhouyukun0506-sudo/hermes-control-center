// ── Navigation Sidebar (Floating Glass Panel with Collapse) ──
import { icons } from '../utils/icons.js';
import { ICON_MAP } from '../utils/icons.js';
import { getCustomPages } from '../utils/pageConfig.js';

const ORDER_KEY = 'hermes_nav_order';

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

const CORE_SECTION = {
  title: 'Core',
  items: [
    { id: 'original_webui', label: 'Core UI', icon: icons.shield },
  ]
};

// ── Context Menu ──
let activeCtxMenu = null;

function dismissCtxMenu() {
  if (activeCtxMenu) { activeCtxMenu.remove(); activeCtxMenu = null; }
  document.removeEventListener('click', dismissCtxMenu);
  document.removeEventListener('contextmenu', dismissCtxMenu);
}

function showContextMenu(x, y, pageId) {
  dismissCtxMenu();

  const pageLabels = {
    dashboard: 'Control Center', terminal: 'Command Line', original_webui: 'Core UI',
    monitor: 'Activity Monitor', models: 'Model Explorer', sessions: 'Session Manager',
    logs: 'Log Viewer', theme: 'Theme Customizer', settings: 'Settings',
    calendar: 'Calendar', skills: 'Skills', memory: 'Memory',
    insights: 'Usage Insights', browser_pages: 'Browser Manager',
    flip_clock: 'Flip Clock', split_view: 'Split View', comparison_search: 'Comparison Search',
  };

  const pageLabel = pageLabels[pageId] || pageId;
  const shortcutMap = { dashboard:'⌘1', terminal:'⌘2', original_webui:'⌘3', monitor:'⌘5', settings:'⌘6', calendar:'⌘7', sessions:'⌘8', logs:'⌘9', theme:'⌘0' };
  const shortcut = shortcutMap[pageId] || '';

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
}

const TOOLS_SECTION = {
  title: 'Tools',
  items: [
    { id: 'dashboard', label: 'Control Center', icon: icons.dashboard },
    { id: 'terminal', label: 'Command Line', icon: icons.code },
    { id: 'calendar', label: 'Calendar', icon: icons.calendar },
  ]
};

const SYSTEM_SECTION = {
  title: 'System',
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
};

export function renderNav(container, { activePage, onNavigate, status }) {
  const online = status?.webui_running;
  const collapsed = localStorage.getItem('hermes_sidebar_collapsed') === 'true';
  const gwOnline = status?.gateway_running;

  // Build sections dynamically — Agents section comes from config
  const customPages = getCustomPages();
  const AGENTS_SECTION = {
    title: 'Agents',
    items: customPages.map(p => ({
      id: p.id,
      label: p.label,
      icon: ICON_MAP[p.icon] || icons.browser,
    }))
  };

  const sections = [CORE_SECTION, TOOLS_SECTION];
  if (AGENTS_SECTION.items.length > 0) sections.push(AGENTS_SECTION);
  sections.push(SYSTEM_SECTION);

  // Apply saved drag order
  const savedOrder = getNavOrder();
  if (savedOrder) {
    applyOrder(sections, savedOrder);
  } else {
    // Seed initial order on first render
    saveNavOrder(sections.flatMap(s => s.items.map(i => i.id)));
  }

  // Set initial collapsed state
  if (collapsed) {
    container.classList.add('sidebar-collapsed');
  }

  const showFooter = localStorage.getItem('hermes_show_status_footer') !== 'false';

  container.innerHTML = `
    <div class="sidebar-edge"></div>

    <span class="logo-text">
      <span style="display:inline-flex;align-items:center;gap:8px;">
        <span style="width:6px;height:6px;border-radius:50%;background:var(--accent);display:inline-block;"></span>
        Workbench
      </span>
    </span>

    <div class="nav-scroll-area" style="flex: 1; overflow-y: auto;">
      ${sections.map(section => `
        <div class="nav-group">
          <div style="padding: 8px 10px 4px; font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .8px; opacity: 0.5; white-space: nowrap;">
            ${section.title}
          </div>
          ${section.items.map(item => `
            <div class="nav-item ${activePage === item.id ? 'active' : ''}" data-page="${item.id}" draggable="true">
              <span class="nav-icon">${item.icon || ''}</span>
              <span>${item.label}</span>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>

    <div class="sidebar-footer">
      <div class="status-indicator ${online ? 'online' : 'offline'}">
        <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0;"></span>
        <span>${online ? 'Online' : 'Offline'}</span>
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
      showContextMenu(e.clientX, e.clientY, el.dataset.page);
    });
  });

  // Drag-to-reorder
  const scrollArea = container.querySelector('.nav-scroll-area');
  let dragId = null;

  scrollArea.addEventListener('dragstart', (e) => {
    const item = e.target.closest('.nav-item');
    if (!item) return;
    dragId = item.dataset.page;
    item.classList.add('nav-dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  scrollArea.addEventListener('dragend', () => {
    scrollArea.querySelectorAll('.nav-item').forEach(el => {
      el.classList.remove('nav-dragging', 'nav-drop-target');
      el.style.boxShadow = '';
    });
    dragId = null;
  });

  scrollArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    const target = e.target.closest('.nav-item');
    if (!target || target.dataset.page === dragId) return;

    scrollArea.querySelectorAll('.nav-item').forEach(el => el.classList.remove('nav-drop-target'));
    const rect = target.getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    if (e.clientY < mid) {
      target.classList.add('nav-drop-target');
      target.style.boxShadow = '';
    } else {
      target.style.boxShadow = '0 2px 0 var(--accent)';
    }
  });

  scrollArea.addEventListener('dragleave', (e) => {
    const target = e.target.closest('.nav-item');
    if (target) {
      target.classList.remove('nav-drop-target');
      target.style.boxShadow = '';
    }
  });

  scrollArea.addEventListener('drop', (e) => {
    e.preventDefault();
    const target = e.target.closest('.nav-item');
    if (!target || !dragId || target.dataset.page === dragId) return;

    scrollArea.querySelectorAll('.nav-item').forEach(el => {
      el.classList.remove('nav-dragging', 'nav-drop-target');
      el.style.boxShadow = '';
    });

    const allItems = [...scrollArea.querySelectorAll('.nav-item')].map(el => el.dataset.page);
    const fromIdx = allItems.indexOf(dragId);
    const toIdx = allItems.indexOf(target.dataset.page);
    if (fromIdx === -1 || toIdx === -1) return;

    allItems.splice(fromIdx, 1);
    allItems.splice(toIdx, 0, dragId);
    saveNavOrder(allItems);

    renderNav(container, { activePage, onNavigate, status });
  });

  // Toggle collapse
  const toggleBtn = container.querySelector('#sidebar-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCollapsed = container.classList.toggle('sidebar-collapsed');
      localStorage.setItem('hermes_sidebar_collapsed', isCollapsed);
      toggleBtn.title = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
      // Clear inline width when collapsed so CSS takes over
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
