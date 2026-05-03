// ── Settings Component (v1.0.5) ──

const THEMES = [
  { id: 'default', label: 'Apple Music Red', colors: ['#fa243c', '#000000'] },
  { id: 'matrix', label: 'Midnight Green', colors: ['#32d74b', '#1c1c1e'] },
  { id: 'vapor', label: 'Vibrant Pink', colors: ['#ff375f', '#1c1c1e'] },
  { id: 'white', label: 'Clean White', colors: ['#ffffff', '#f2f2f7'] },
];

const FONTS = [
  { id: 'default', label: 'System Default (Inter)', class: 'font-default' },
  { id: 'mono', label: 'Developer Mono (JetBrains)', class: 'font-mono' },
  { id: 'apple', label: 'Apple Standard (San Francisco)', class: 'font-apple' },
];

export function renderSettings(container) {
  const currentTheme = localStorage.getItem('hermes_theme') || 'default';
  const currentFont = localStorage.getItem('hermes_font') || 'default';

  container.innerHTML = `
    <div class="page">
      <div class="page-padded">
        <div style="margin-bottom: 30px;">
          <h1 style="font-size: 32px; font-weight: 800; letter-spacing: -1px; margin-bottom: 4px;">Settings</h1>
          <div style="width: 40px; height: 4px; background: var(--accent); border-radius: 2px;"></div>
        </div>

        <!-- Appearance Section -->
        <h3 style="font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; margin-left: 4px;">Appearance</h3>
        <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 30px;">
          ${THEMES.map((theme, index) => `
            <div class="settings-row ${currentTheme === theme.id ? 'active' : ''}" data-theme="${theme.id}" style="padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; border-bottom: ${index === THEMES.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)'}; transition: background 0.2s;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 20px; height: 20px; border-radius: 50%; background: linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]}); border: 2px solid rgba(255,255,255,0.1);"></div>
                <span style="font-size: 15px; font-weight: 500;">${theme.label}</span>
              </div>
              ${currentTheme === theme.id ? '<div style="color: var(--accent);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>' : ''}
            </div>
          `).join('')}
        </div>

        <!-- Typography Section -->
        <h3 style="font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; margin-left: 4px;">Typography</h3>
        <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 30px;">
          ${FONTS.map((font, index) => `
            <div class="settings-row ${currentFont === font.id ? 'active' : ''}" data-font="${font.id}" style="padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; border-bottom: ${index === FONTS.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)'}; transition: background 0.2s;">
              <span style="font-size: 15px; font-weight: 500;">${font.label}</span>
              <span style="font-size: 13px; color: var(--text-muted); font-family: ${getFontFamily(font.id)};">Sample Text</span>
            </div>
          `).join('')}
        </div>

        <div style="text-align: center; color: var(--text-muted); font-size: 12px; margin-top: 40px;">
          Hermes Control Center v1.0.5-Preview
        </div>
      </div>
    </div>

    <style>
      .settings-row:hover { background: rgba(255, 255, 255, 0.05); }
      .settings-row.active { background: rgba(250, 36, 60, 0.05); }
    </style>
  `;

  // Theme click
  container.querySelectorAll('[data-theme]').forEach(el => {
    el.addEventListener('click', () => {
      const themeId = el.dataset.theme;
      localStorage.setItem('hermes_theme', themeId);
      if (window.applyVisuals) window.applyVisuals();
      renderSettings(container);
    });
  });

  // Font click
  container.querySelectorAll('[data-font]').forEach(el => {
    el.addEventListener('click', () => {
      const fontId = el.dataset.font;
      localStorage.setItem('hermes_font', fontId);
      if (window.applyVisuals) window.applyVisuals();
      renderSettings(container);
    });
  });
}

function getFontFamily(id) {
  if (id === 'mono') return "'JetBrains Mono'";
  if (id === 'apple') return "-apple-system, BlinkMacSystemFont, sans-serif";
  return 'inherit';
}
