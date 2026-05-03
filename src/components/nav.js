// ── Navigation Sidebar (Apple Music Style Refined) ──
import { icons } from '../utils/icons.js';

const SECTIONS = [
  {
    title: 'Library',
    items: [
      { id: 'dashboard', label: 'Control Center', icon: icons.dashboard },
      { id: 'terminal', label: 'Command Line', icon: icons.code },
    ]
  },
  {
    title: 'Agents',
    items: [
      { id: 'mimo_plan', label: 'Mimo', icon: icons.stats },
      { id: 'kimi_plan', label: 'Kimi Intelligence', icon: icons.stats },
      { id: 'deepseek', label: 'DeepSeek', icon: icons.stats },
      { id: 'gemini', label: 'Gemini Pro', icon: icons.chat },
    ]
  },
  {
    title: 'System',
    items: [
      { id: 'monitor', label: 'Activity Monitor', icon: icons.stats },
      { id: 'original_webui', label: 'Core WebUI', icon: icons.dashboard },
      { id: 'settings', label: 'Settings', icon: icons.settings },
    ]
  }
];

export function renderNav(container, { activePage, onNavigate, status }) {
  const online = status?.webui_running;

  container.innerHTML = `
    <div class="logo-container" style="justify-content: flex-start; padding-left: 28px;">
      <span class="logo-text">Hermes</span>
    </div>

    <div style="flex: 1; overflow-y: auto;">
      ${SECTIONS.map(section => `
        <div class="nav-group">
          <div style="padding: 0 15px 8px; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px;">
            ${section.title}
          </div>
          ${section.items.map(item => `
            <div class="nav-item ${activePage === item.id ? 'active' : ''}" data-page="${item.id}">
              <div class="nav-icon">${item.icon || ''}</div>
              <span>${item.label}</span>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>

    <div style="padding: 24px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
       <div class="status-indicator ${online ? 'online' : 'offline'}">
         <div class="dot"></div>
         <span>${online ? 'Systems Live' : 'Systems Idle'}</span>
       </div>
    </div>
  `;

  container.querySelectorAll('.nav-item').forEach((el) => {
    el.addEventListener('click', () => onNavigate(el.dataset.page));
  });
}
