// ── Theme Customizer Component ──

const THEMES = [
  { id: 'default', label: 'Deep Dark', desc: 'Dark mode with Viva Magenta accent' },
  { id: 'matrix', label: 'Neon Matrix', desc: 'Green-on-black terminal aesthetic' },
  { id: 'vapor', label: 'Vaporwave', desc: 'Purple-pink gradient accents' },
  { id: 'white', label: 'Light Mode', desc: 'Clean white interface' },
  { id: 'fig1', label: '捣蓝·清水', desc: '图1 深海蓝配清水蓝' },
  { id: 'fig2', label: '紫·青绿', desc: '图2 深紫搭配青绿色' },
  { id: 'fig3', label: '无白·钛啡', desc: '图3 米白配钛啡红' },
  { id: 'fig4', label: '炭黑·甜粉', desc: '图4 炭黑配甜酷粉' },
  { id: 'fig5', label: '藤紫·钛绿', desc: '图5 藤紫配钛啡绿' },
];

const FONTS = [
  { id: 'default', label: 'Inter', desc: 'Smooth modern sans-serif' },
  { id: 'mono', label: 'JetBrains Mono', desc: 'Monospace everything' },
  { id: 'apple', label: 'SF Pro', desc: 'Apple system font' },
];

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function renderThemeCustomizer(container) {
  const curTheme = localStorage.getItem('hermes_theme') || 'default';
  const curFont = localStorage.getItem('hermes_font') || 'default';
  const hasCustom = !!localStorage.getItem('hermes_accent_custom');
  const curAccent = localStorage.getItem('hermes_accent_custom') || '';
  const curBg = localStorage.getItem('hermes_bg_custom') || '';

  container.innerHTML = `
    <div class="page page-padded">
      <div style="max-width: 800px;">
        <div class="page-header">
          <h1 class="page-title">Theme Customizer</h1>
          <p class="page-subtitle">Pick a preset or customize colors to your liking.</p>
          <div class="page-accent-bar"></div>
        </div>

        <!-- Theme Presets -->
        <div class="card" style="padding: 24px; margin-bottom: 20px;">
          <div class="section-header">Theme Preset</div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px;">
            ${THEMES.map(t => {
              const active = curTheme === t.id && !hasCustom;
              const preview = getThemePreview(t.id);
              return `
                <div class="tc-theme-card" data-theme="${t.id}" style="
                  padding: 16px; border-radius: 10px; cursor: pointer;
                  border: 2px solid ${active ? 'var(--accent)' : 'var(--fill-quaternary)'};
                  background: ${preview.bg}; transition: all .15s;
                  ${active ? 'box-shadow: 0 0 0 1px var(--accent);' : ''}
                ">
                  <div style="display: flex; gap: 4px; margin-bottom: 10px;">
                    ${preview.swatches.map(s => `<div style="width: 16px; height: 16px; border-radius: 4px; background: ${s};"></div>`).join('')}
                  </div>
                  <div style="font-size: 13px; font-weight: 700; color: ${preview.text}; margin-bottom: 2px;">${t.label}</div>
                  <div style="font-size: 11px; color: ${preview.muted};">${t.desc}</div>
                </div>
              `;
            }).join('')}
          </div>
          ${hasCustom ? '<div style="margin-top: 8px; font-size: 12px; color: var(--accent);">Using custom colors — select a preset to switch back</div>' : ''}
        </div>

        <!-- Font Presets -->
        <div class="card" style="padding: 24px; margin-bottom: 20px;">
          <div class="section-header">Font</div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${FONTS.map(f => `
              <div class="tc-font-card" data-font="${f.id}" style="
                padding: 12px 20px; border-radius: 10px; cursor: pointer;
                border: 2px solid ${curFont === f.id ? 'var(--accent)' : 'var(--fill-quaternary)'};
                background: var(--card-bg); transition: all .15s;
                ${curFont === f.id ? 'box-shadow: 0 0 0 1px var(--accent);' : ''}
              ">
                <div style="font-size: 14px; font-weight: 700; margin-bottom: 2px;">${f.label}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${f.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Custom Colors -->
        <div class="card" style="padding: 24px;">
          <div class="section-header">Custom Colors</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 440px;">
            <div>
              <label style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px; display: block;">Accent Color</label>
              <div style="display: flex; gap: 10px; align-items: center;">
                <input type="color" id="tc-accent" value="${curAccent || getDefaultAccent(curTheme)}" style="width: 44px; height: 44px; border: 2px solid var(--fill-quaternary); border-radius: 10px; cursor: pointer; background: none; padding: 2px;">
                <span id="tc-accent-hex" style="font-size: 12px; color: var(--text-muted); font-family: var(--font-mono);">${curAccent || getDefaultAccent(curTheme)}</span>
              </div>
            </div>
            <div>
              <label style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px; display: block;">Background</label>
              <div style="display: flex; gap: 10px; align-items: center;">
                <input type="color" id="tc-bg" value="${curBg || getDefaultBg(curTheme)}" style="width: 44px; height: 44px; border: 2px solid var(--fill-quaternary); border-radius: 10px; cursor: pointer; background: none; padding: 2px;">
                <span id="tc-bg-hex" style="font-size: 12px; color: var(--text-muted); font-family: var(--font-mono);">${curBg || getDefaultBg(curTheme)}</span>
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 20px; align-items: center;">
            <button id="tc-apply" class="glass-btn" style="padding: 8px 20px; font-size: 13px;">
              Apply Custom
            </button>
            <button id="tc-reset" style="background: var(--fill-quinary); border: 0.5px solid var(--fill-quaternary); color: var(--text-muted);
                    border-radius: 8px; padding: 8px 20px; font-weight: 500; font-size: 13px; cursor: pointer; font-family: inherit; transition: all .15s linear;">
              Reset All
            </button>
            <span id="tc-status" style="font-size: 12px; color: var(--text-muted);"></span>
          </div>
        </div>

        <!-- Live Preview -->
        <div class="card" style="padding: 24px; margin-top: 20px;">
          <div class="section-header">Preview</div>
          <div id="tc-preview" style="background: var(--fill-quinary); border: 0.5px solid var(--fill-quaternary); border-radius: 10px; padding: 20px; font-size: 14px;">
            <div style="font-weight: 700; margin-bottom: 8px; color: var(--text-main);">
              The quick brown fox jumps over the lazy dog
            </div>
            <div style="color: var(--accent); font-weight: 700; margin-bottom: 4px;">
              Accent Color
            </div>
            <div style="color: var(--text-muted); font-size: 13px;">
              Muted text appears like this. Cards use var(--card-bg) background.
            </div>
            <div style="display: flex; gap: 6px; margin-top: 12px;">
              <span style="background: var(--accent-gradient); color: #fff; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">Button</span>
              <span style="border: 0.5px solid var(--fill-quaternary); padding: 4px 12px; border-radius: 6px; font-size: 12px; color: var(--text-muted);">Outline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ── Events ──
  container.querySelectorAll('.tc-theme-card').forEach(el => {
    el.addEventListener('click', () => {
      const theme = el.dataset.theme;
      // Preset → clear custom overrides
      localStorage.setItem('hermes_theme', theme);
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--accent-gradient');
      document.documentElement.style.removeProperty('--bg-primary');
      document.body.style.removeProperty('background');
      localStorage.removeItem('hermes_accent_custom');
      localStorage.removeItem('hermes_bg_custom');
      apply();
      showStatus('Theme applied');
      const accentInput = container.querySelector('#tc-accent');
      const bgInput = container.querySelector('#tc-bg');
      accentInput.value = getDefaultAccent(theme);
      bgInput.value = getDefaultBg(theme);
      container.querySelector('#tc-accent-hex').textContent = getDefaultAccent(theme);
      container.querySelector('#tc-bg-hex').textContent = getDefaultBg(theme);
    });
  });

  container.querySelectorAll('.tc-font-card').forEach(el => {
    el.addEventListener('click', () => {
      localStorage.setItem('hermes_font', el.dataset.font);
      apply();
      showStatus('Font applied');
    });
  });

  function applyCustom() {
    const accent = container.querySelector('#tc-accent').value;
    const bg = container.querySelector('#tc-bg').value;
    localStorage.setItem('hermes_accent_custom', accent);
    localStorage.setItem('hermes_bg_custom', bg);
    const rgb = hexToRgb(accent);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-gradient',
      `linear-gradient(135deg, ${accent} 0%, hsl(${hsl.h}, ${Math.min(100, hsl.s + 20)}%, ${Math.min(85, hsl.l + 15)}%) 100%)`);
    document.documentElement.style.setProperty('--bg-primary', bg);
    // Apply custom background color to body
    document.body.style.background = bg;
    // Un-mark preset cards
    container.querySelectorAll('.tc-theme-card').forEach(c => {
      c.style.borderColor = 'var(--card-border)';
      c.style.boxShadow = 'none';
    });
    showStatus('Custom colors applied');
  }

  container.querySelector('#tc-apply').addEventListener('click', applyCustom);

  // Live preview on color picker change
  container.querySelector('#tc-accent').addEventListener('input', () => {
    const val = container.querySelector('#tc-accent').value;
    container.querySelector('#tc-accent-hex').textContent = val;
    // Preview-only update
    const rgb = hexToRgb(val);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const grad = `linear-gradient(135deg, ${val} 0%, hsl(${hsl.h}, ${Math.min(100, hsl.s + 20)}%, ${Math.min(85, hsl.l + 15)}%) 100%)`;
    document.documentElement.style.setProperty('--accent', val);
    document.documentElement.style.setProperty('--accent-gradient', grad);
  });

  container.querySelector('#tc-bg').addEventListener('input', () => {
    const val = container.querySelector('#tc-bg').value;
    container.querySelector('#tc-bg-hex').textContent = val;
    document.documentElement.style.setProperty('--bg-primary', val);
    document.body.style.background = val;
  });

  container.querySelector('#tc-reset').addEventListener('click', () => {
    localStorage.removeItem('hermes_accent_custom');
    localStorage.removeItem('hermes_bg_custom');
    localStorage.setItem('hermes_theme', 'default');
    localStorage.setItem('hermes_font', 'default');
    document.documentElement.style.removeProperty('--accent');
    document.documentElement.style.removeProperty('--accent-gradient');
    document.documentElement.style.removeProperty('--bg-primary');
    document.body.style.removeProperty('background');
    apply();
    container.querySelector('#tc-accent').value = getDefaultAccent('default');
    container.querySelector('#tc-bg').value = getDefaultBg('default');
    container.querySelector('#tc-accent-hex').textContent = getDefaultAccent('default');
    container.querySelector('#tc-bg-hex').textContent = getDefaultBg('default');
    showStatus('Reset to defaults');
  });

  function showStatus(msg) {
    const el = container.querySelector('#tc-status');
    if (el) {
      el.textContent = msg;
      setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 2000);
    }
  }

  function apply() {
    if (window.applyVisuals) window.applyVisuals();
    const curTheme = localStorage.getItem('hermes_theme') || 'default';
    const curFont = localStorage.getItem('hermes_font') || 'default';
    const hasCustom = !!localStorage.getItem('hermes_accent_custom');
    container.querySelectorAll('.tc-theme-card').forEach(c => {
      const active = c.dataset.theme === curTheme && !hasCustom;
      c.style.borderColor = active ? 'var(--accent)' : 'var(--card-border)';
      c.style.boxShadow = active ? '0 0 0 1px var(--accent)' : 'none';
    });
    container.querySelectorAll('.tc-font-card').forEach(c => {
      const active = c.dataset.font === curFont;
      c.style.borderColor = active ? 'var(--accent)' : 'var(--card-border)';
      c.style.boxShadow = active ? '0 0 0 1px var(--accent)' : 'none';
    });
  }
}

function getThemePreview(id) {
  const map = {
    'default': { bg: '#0a0a0a', text: '#f5f5f7', muted: '#86868b', swatches: ['#0a0a0a', '#BB2649', '#f5f5f7'] },
    'matrix': { bg: '#0a0a0a', text: '#00ff41', muted: '#007a20', swatches: ['#0a0a0a', '#00ff41', '#00ff41'] },
    'vapor': { bg: '#1a0a2e', text: '#e0b0ff', muted: '#9b59b6', swatches: ['#1a0a2e', '#bf5af2', '#ff375f'] },
    'white': { bg: '#ffffff', text: '#1d1d1f', muted: '#6e6e73', swatches: ['#ffffff', '#BB2649', '#1d1d1f'] },
    'fig1': { bg: '#113056', text: '#f5f5f7', muted: '#6e9bb8', swatches: ['#113056', '#91CFD5', '#91CFD5'] },
    'fig2': { bg: '#6A1B9A', text: '#f5f5f7', muted: '#b388d4', swatches: ['#6A1B9A', '#00BFA5', '#00BFA5'] },
    'fig3': { bg: '#F1DDDF', text: '#1d1d1f', muted: '#8a6e72', swatches: ['#F1DDDF', '#E72D48', '#E72D48'] },
    'fig4': { bg: '#1A1A1D', text: '#f5f5f7', muted: '#86868b', swatches: ['#1A1A1D', '#E6397C', '#E6397C'] },
    'fig5': { bg: '#5E55A2', text: '#f5f5f7', muted: '#a59fd4', swatches: ['#5E55A2', '#91C53A', '#91C53A'] },
  };
  return map[id] || map.default;
}

function getDefaultAccent(theme) {
  const map = { 'default': '#BB2649', 'matrix': '#2ecc71', 'vapor': '#bf5af2', 'white': '#BB2649',
    'fig1': '#91CFD5', 'fig2': '#00BFA5', 'fig3': '#E72D48', 'fig4': '#E6397C', 'fig5': '#91C53A' };
  return map[theme] || '#BB2649';
}

function getDefaultBg(theme) {
  const map = { 'default': '#0a0a0a', 'matrix': '#0a0a0a', 'vapor': '#1a0a2e', 'white': '#fbfbfd',
    'fig1': '#113056', 'fig2': '#6A1B9A', 'fig3': '#F1DDDF', 'fig4': '#1A1A1D', 'fig5': '#5E55A2' };
  return map[theme] || '#0a0a0a';
}
