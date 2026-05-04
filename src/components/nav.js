// ── Navigation Sidebar (Floating Glass Panel with Collapse) ──
import { icons } from '../utils/icons.js';

const SECTIONS = [
  {
    title: 'Core',
    items: [
      { id: 'original_webui', label: 'Hermes Core UI', icon: icons.shield },
    ]
  },
  {
    title: 'Tools',
    items: [
      { id: 'dashboard', label: 'Control Center', icon: icons.dashboard },
      { id: 'terminal', label: 'Command Line', icon: icons.code },
      { id: 'calendar', label: 'Calendar', icon: icons.calendar },
    ]
  },
  {
    title: 'Agents',
    items: [
      { id: 'mimo_plan', label: 'Mimo', icon: icons.lightbulb },
      { id: 'kimi_plan', label: 'Kimi Intelligence', icon: icons.spark },
      { id: 'deepseek', label: 'DeepSeek', icon: icons.search },
      { id: 'gemini', label: 'Gemini Pro', icon: icons.chat },
    ]
  },
  {
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
      { id: 'settings', label: 'Settings', icon: icons.settings },
    ]
  }
];

export function renderNav(container, { activePage, onNavigate, status }) {
  const online = status?.webui_running;
  const collapsed = localStorage.getItem('hermes_sidebar_collapsed') === 'true';
  const gwOnline = status?.gateway_running;

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
        Hermes
      </span>
    </span>

    <div class="nav-scroll-area" style="flex: 1; overflow-y: auto;">
      ${SECTIONS.map(section => `
        <div class="nav-group">
          <div style="padding: 8px 10px 4px; font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .8px; opacity: 0.5; white-space: nowrap;">
            ${section.title}
          </div>
          ${section.items.map(item => `
            <div class="nav-item ${activePage === item.id ? 'active' : ''}" data-page="${item.id}">
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
  });

  // Toggle collapse
  const toggleBtn = container.querySelector('#sidebar-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCollapsed = container.classList.toggle('sidebar-collapsed');
      localStorage.setItem('hermes_sidebar_collapsed', isCollapsed);
      toggleBtn.title = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
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
