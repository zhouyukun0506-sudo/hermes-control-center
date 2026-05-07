// ── Settings Component ──
import { icons } from '../utils/icons.js';
import { getShortcuts, saveShortcut, resetShortcuts } from '../utils/shortcuts.js';

const SETTINGS = {
  glassIntensity: { key: 'hermes_glass_intensity', label: 'Glass Blur', desc: 'Frosted glass blur strength', type: 'range', min: 5, max: 30, step: 5, default: 15, suffix: 'px' },
  glassOpacity: { key: 'hermes_glass_opacity', label: 'Glass Transparency', desc: 'Panel background visibility', type: 'range', min: 10, max: 100, step: 5, default: 100, suffix: '%' },
  animationSpeed: { key: 'hermes_animation_speed', label: 'Animation Speed', desc: 'UI motion intensity', type: 'select', options: ['none', 'reduced', 'normal'], default: 'normal' },
  sidebarDefault: { key: 'hermes_sidebar_default', label: 'Sidebar Default', desc: 'Startup sidebar state', type: 'select', options: ['expanded', 'collapsed'], default: 'expanded' },
  showStatusFooter: { key: 'hermes_show_status_footer', label: 'Status Footer', desc: 'Show GW/UI status in sidebar', type: 'toggle', default: true },
  pollInterval: { key: 'hermes_poll_interval', label: 'Status Refresh', desc: 'How often to check service status', type: 'select', options: ['2s', '5s', '10s', '30s'], default: '5s' },
  compactMode: { key: 'hermes_compact_mode', label: 'Compact Mode', desc: 'Tighter spacing in cards and panels', type: 'toggle', default: false },
};

function getVal(setting) {
  const v = localStorage.getItem(setting.key);
  if (v === null) return setting.default;
  if (setting.type === 'toggle') return v === 'true';
  if (setting.type === 'range') return parseInt(v, 10);
  return v;
}

function setVal(key, val) {
  localStorage.setItem(key, String(val));
}

export function renderSettings(container) {
  container.innerHTML = `
    <div class="page">
      <div class="page-padded">
        <div class="page-header">
          <h1 class="page-title">Settings</h1>
          <div class="page-accent-bar"></div>
        </div>

        <!-- Appearance -->
        <div class="card" style="padding: 0; margin-bottom: 20px; overflow: hidden;">
          <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; gap: 12px;">
            <div style="width: 28px; height: 28px; border-radius: 7px; background: var(--accent-gradient); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="15.5" r="2.5"/><circle cx="8.5" cy="15.5" r="2.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.04-.23-.29-.38-.63-.38-1.02 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.5-4.5-9-10-9z"/></svg>
            </div>
            <div class="section-header" style="margin-bottom: 0;">
              <div style="font-weight: 700; font-size: 15px; text-transform: none; letter-spacing: 0; color: var(--text-main);">Appearance</div>
              <div style="font-size: 11px; color: var(--text-muted); font-weight: 400; text-transform: none; letter-spacing: 0;">Theme, glass, animations</div>
            </div>
          </div>

          <!-- Theme shortcut -->
          <div class="settings-row" style="padding: 12px 20px; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 14px; border-bottom: 1px solid rgba(255,255,255,0.04);">
            <div>
              <div style="font-size: 13px; font-weight: 500; margin-bottom: 2px;">Theme & Colors</div>
              <div style="font-size: 11px; color: var(--text-muted);">Presets, accent, fonts & backgrounds</div>
            </div>
            <button id="settings-open-theme" class="btn" style="background:var(--accent-gradient);">
              Open Customizer
            </button>
          </div>

          <!-- Glass Blur -->
          <div class="settings-row" style="padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.04);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <div>
                <div style="font-size: 13px; font-weight: 500; margin-bottom: 2px;">${SETTINGS.glassIntensity.label}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${SETTINGS.glassIntensity.desc}</div>
              </div>
              <span class="settings-glass-value" style="font-size:13px;font-weight:600;font-family:var(--font-mono);color:var(--accent);min-width:40px;text-align:right;">${getVal(SETTINGS.glassIntensity)}px</span>
            </div>
            <input type="range" min="${SETTINGS.glassIntensity.min}" max="${SETTINGS.glassIntensity.max}" step="${SETTINGS.glassIntensity.step}" value="${getVal(SETTINGS.glassIntensity)}"
              class="settings-glass-slider"
            />
          </div>

          <!-- Glass Transparency -->
          <div class="settings-row" style="padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.04);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <div>
                <div style="font-size: 13px; font-weight: 500; margin-bottom: 2px;">${SETTINGS.glassOpacity.label}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${SETTINGS.glassOpacity.desc}</div>
              </div>
              <span class="settings-glass-opacity-value" style="font-size:13px;font-weight:600;font-family:var(--font-mono);color:var(--accent);min-width:40px;text-align:right;">${getVal(SETTINGS.glassOpacity)}%</span>
            </div>
            <input type="range" min="${SETTINGS.glassOpacity.min}" max="${SETTINGS.glassOpacity.max}" step="${SETTINGS.glassOpacity.step}" value="${getVal(SETTINGS.glassOpacity)}"
              class="settings-glass-opacity-slider"
            />
          </div>

          <!-- Animation Speed -->
          <div class="settings-row" style="padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.04);">
            ${renderSelectRow(SETTINGS.animationSpeed)}
          </div>

          <!-- Sidebar Default -->
          <div class="settings-row" style="padding: 12px 20px;">
            ${renderSelectRow(SETTINGS.sidebarDefault)}
          </div>
        </div>

        <!-- Interface -->
        <div class="card" style="padding: 0; margin-bottom: 20px; overflow: hidden;">
          <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; gap: 12px;">
            <div style="width: 28px; height: 28px; border-radius: 7px; background: linear-gradient(135deg, #0a84ff, #64d2ff); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
            </div>
            <div class="section-header" style="margin-bottom: 0;">
              <div style="font-weight: 700; font-size: 15px; text-transform: none; letter-spacing: 0; color: var(--text-main);">Interface</div>
              <div style="font-size: 11px; color: var(--text-muted); font-weight: 400; text-transform: none; letter-spacing: 0;">Layout, polling, compact mode</div>
            </div>
          </div>

          <!-- Compact Mode -->
          <div class="settings-row" style="padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.04);">
            ${renderToggleRow(SETTINGS.compactMode)}
          </div>

          <!-- Status Footer -->
          <div class="settings-row" style="padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.04);">
            ${renderToggleRow(SETTINGS.showStatusFooter)}
          </div>

          <!-- Poll Interval -->
          <div class="settings-row" style="padding: 12px 20px;">
            ${renderSelectRow(SETTINGS.pollInterval)}
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card" style="padding: 0; margin-bottom: 20px; overflow: hidden;">
          <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; gap: 12px;">
            <div style="width: 28px; height: 28px; border-radius: 7px; background: linear-gradient(135deg, #bf5af2, #ff9f0a); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>
            </div>
            <div>
              <div style="font-weight: 700; font-size: 15px;">Quick Actions</div>
              <div style="font-size: 11px; color: var(--text-muted);">Toolbar and command palette</div>
            </div>
          </div>

          <div style="padding: 16px 20px; text-align: center; color: var(--text-muted); font-size: 12px;">
            <kbd style="padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.08);font-family:var(--font-mono);font-size:11px;">⌘K</kbd>
            <span style="margin:0 8px;">to open command palette ·</span>
            <span style="opacity:0.6;">All actions available in the toolbar</span>
          </div>
        </div>

        <!-- Keyboard Shortcuts -->
        <div class="card" style="padding: 0; margin-bottom: 20px; overflow: hidden;">
          <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; gap: 12px;">
            <div style="width: 28px; height: 28px; border-radius: 7px; background: linear-gradient(135deg, #bf5af2, #0a84ff); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M7 16h10"/></svg>
            </div>
            <div>
              <div style="font-weight: 700; font-size: 15px;">Keyboard Shortcuts</div>
              <div style="font-size: 11px; color: var(--text-muted);">Customize ⌘ key bindings</div>
            </div>
          </div>
          <div id="shortcuts-list" style="padding: 8px 20px;">
            ${renderShortcuts()}
          </div>
          <div style="padding: 0 20px 12px;">
            <button id="shortcuts-reset" class="btn" style="font-size:11px;padding:4px 12px;background:rgba(255,255,255,0.06);">Reset to Defaults</button>
          </div>
        </div>

        <!-- Deploy -->
        <div class="card" style="padding: 0; margin-bottom: 20px; overflow: hidden;">
          <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; gap: 12px;">
            <div style="width: 28px; height: 28px; border-radius: 7px; background: linear-gradient(135deg, #32d74b, #0a84ff); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
            </div>
            <div>
              <div style="font-weight: 700; font-size: 15px;">Deploy Agents</div>
              <div style="font-size: 11px; color: var(--text-muted);">One-click install for OpenClaw & Hermes Agent</div>
            </div>
          </div>

          <!-- OpenClaw -->
          <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.04);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--text-main);">OpenClaw</div>
                <div style="font-size:11px;color:var(--text-muted);">Personal AI assistant — multi-platform messaging</div>
              </div>
              <div style="display:flex;gap:4px;background:rgba(255,255,255,0.06);border-radius:6px;padding:2px;" id="deploy-os-selector">
                <button class="deploy-os-btn active" data-os="mac" style="padding:4px 10px;border-radius:4px;border:none;background:var(--accent-gradient);color:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .12s;">macOS</button>
                <button class="deploy-os-btn" data-os="win" style="padding:4px 10px;border-radius:4px;border:none;background:transparent;color:var(--text-muted);font-size:11px;font-weight:500;cursor:pointer;font-family:inherit;transition:all .12s;">Windows</button>
                <button class="deploy-os-btn" data-os="linux" style="padding:4px 10px;border-radius:4px;border:none;background:transparent;color:var(--text-muted);font-size:11px;font-weight:500;cursor:pointer;font-family:inherit;transition:all .12s;">Linux</button>
              </div>
            </div>
            <div id="deploy-openclaw-cmd" style="display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.3);border:0.5px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 12px;margin-bottom:10px;">
              <code id="deploy-openclaw-code" style="flex:1;font-size:12px;font-family:var(--font-mono);color:#32d74b;white-space:pre-wrap;word-break:break-all;">npm install -g openclaw@latest</code>
              <button id="deploy-openclaw-copy" style="flex-shrink:0;padding:4px 8px;border-radius:4px;border:0.5px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.06);color:var(--text-muted);font-size:11px;cursor:pointer;font-family:inherit;transition:all .12s;">Copy</button>
            </div>
            <button id="deploy-openclaw-run" class="btn" style="width:100%;background:var(--accent-gradient);font-size:12px;">
              Run in Terminal
            </button>
            <div style="font-size:10px;color:var(--text-muted);margin-top:6px;opacity:.6;">Requires Node.js ≥ 22. Windows users need WSL2.</div>
          </div>

          <!-- Hermes Agent -->
          <div style="padding: 16px 20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--text-main);">Hermes Agent</div>
                <div style="font-size:11px;color:var(--text-muted);">Self-improving AI agent by Nous Research — macOS only</div>
              </div>
              <span style="font-size:10px;padding:3px 8px;border-radius:4px;background:rgba(255,159,10,0.15);color:#ff9f0a;font-weight:600;">macOS</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.3);border:0.5px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 12px;margin-bottom:10px;">
              <code id="deploy-hermes-code" style="flex:1;font-size:12px;font-family:var(--font-mono);color:#32d74b;white-space:pre-wrap;word-break:break-all;">curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash</code>
              <button id="deploy-hermes-copy" style="flex-shrink:0;padding:4px 8px;border-radius:4px;border:0.5px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.06);color:var(--text-muted);font-size:11px;cursor:pointer;font-family:inherit;transition:all .12s;">Copy</button>
            </div>
            <button id="deploy-hermes-run" class="btn" style="width:100%;background:linear-gradient(135deg,#ff9f0a,#ff453a);font-size:12px;">
              Run in Terminal
            </button>
            <div style="font-size:10px;color:var(--text-muted);margin-top:6px;opacity:.6;">macOS / Linux. Windows users: install via WSL2 first.</div>
          </div>
        </div>

        <!-- Storage -->
        <div id="storage-card" class="card" style="padding: 0; margin-bottom: 20px; overflow: hidden;">
          <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; gap: 12px;">
            <div style="width: 28px; height: 28px; border-radius: 7px; background: linear-gradient(135deg, #30D158, #0087FF); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9.5" cy="9.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            </div>
            <div class="section-header" style="margin-bottom: 0;">
              <div style="font-weight: 700; font-size: 15px; text-transform: none; letter-spacing: 0; color: var(--text-main);">Storage</div>
              <div style="font-size: 11px; color: var(--text-muted); font-weight: 400;">App data & cache usage breakdown</div>
            </div>
          </div>
          <div id="storage-chart-area" style="padding: 16px 20px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
            <div style="font-size: 12px; color: var(--text-muted); text-align: center; width: 100%;">Loading...</div>
          </div>
          <div style="border-top: 1px solid rgba(255,255,255,0.04); padding: 12px 20px; display: flex; gap: 10px;">
            <button id="storage-btn-clear" class="btn" style="flex:1; background:rgba(255,69,58,0.1); color:#FF453A; border:1px solid rgba(255,69,58,0.18); border-radius:10px; padding:9px 16px; font-size:13px; font-weight:500; cursor:pointer; font-family:inherit; transition:all .15s;">Clear System Cache</button>
            <button id="storage-btn-refresh" class="btn" style="width:40px; background:rgba(120,120,128,0.1); color:var(--text-secondary); border:1px solid rgba(120,120,128,0.12); border-radius:10px; padding:9px 0; font-size:13px; cursor:pointer; font-family:inherit; display:flex; align-items:center; justify-content:center; transition:all .15s;" title="Refresh">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>
          </div>
        </div>

        <!-- Data -->
        <div class="card" style="padding: 0; margin-bottom: 20px; overflow: hidden;">
          <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; gap: 12px;">
            <div style="width: 28px; height: 28px; border-radius: 7px; background: linear-gradient(135deg, #ff453a, #ff9f0a); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
            </div>
            <div>
              <div style="font-weight: 700; font-size: 15px;">Data</div>
              <div style="font-size: 11px; color: var(--text-muted);">Manage settings and storage</div>
            </div>
          </div>

          <div style="padding: 16px 20px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button id="settings-export" class="btn" style="flex:1; background:rgba(255,255,255,0.08);">
              ↓ Export All Settings
            </button>
            <button id="settings-import" class="btn" style="flex:1; background:rgba(255,255,255,0.08);">
              ↑ Import Settings File
            </button>
            <input type="file" id="settings-import-file" accept=".json" style="display:none;">
          </div>
          <div style="padding: 0 20px 16px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button id="settings-reset" class="btn" style="flex:1; background:rgba(255,69,58,0.2); color:#ff453a;">
              Reset All Settings
            </button>
          </div>
        </div>

        <!-- About -->
        <div style="text-align: center; padding: 20px 0;">
          <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.06);border-radius:8px;padding:8px 16px;">
            <span style="width:6px;height:6px;border-radius:50%;background:var(--accent);display:inline-block;"></span>
            <span style="color:var(--text-muted);font-size:12px;font-weight:500;">Workbench</span>
            <span style="color:var(--text-muted);font-size:11px;font-family:var(--font-mono);opacity:0.5;">v1.4.3</span>
          </div>
          <div style="margin-top: 12px; font-size: 10px; color: var(--text-muted); opacity: 0.50; letter-spacing: 0.5px;">
            Ethan_chou0956
          </div>
        </div>
      </div>
    </div>
  `;

  // ── Event handlers ──

  // Storage card — donut chart + cache clearing
  initStorageCard(container);

  // Theme customizer
  container.querySelector('#settings-open-theme').addEventListener('click', () => {
    window.__navigateTo && window.__navigateTo('theme');
  });

  // ── Deploy section ──
  const DEPLOY_CMDS = {
    openclaw: {
      mac: 'npm install -g openclaw@latest',
      win: 'powershell -c "irm https://openclaw.ai/install.ps1 | iex"',
      linux: 'npm install -g openclaw@latest',
    },
    hermes: 'curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash',
  };

  // OS selector
  container.querySelectorAll('.deploy-os-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.deploy-os-btn').forEach(b => {
        b.style.background = 'transparent';
        b.style.color = 'var(--text-muted)';
        b.style.fontWeight = '500';
        b.classList.remove('active');
      });
      btn.style.background = 'var(--accent-gradient)';
      btn.style.color = '#fff';
      btn.style.fontWeight = '600';
      btn.classList.add('active');
      const os = btn.dataset.os;
      container.querySelector('#deploy-openclaw-code').textContent = DEPLOY_CMDS.openclaw[os];
    });
  });

  // Copy buttons
  container.querySelector('#deploy-openclaw-copy').addEventListener('click', () => {
    const code = container.querySelector('#deploy-openclaw-code').textContent;
    navigator.clipboard.writeText(code).then(() => {
      const btn = container.querySelector('#deploy-openclaw-copy');
      btn.textContent = 'Copied';
      btn.style.color = '#32d74b';
      setTimeout(() => { btn.textContent = 'Copy'; btn.style.color = ''; }, 1500);
    });
  });
  container.querySelector('#deploy-hermes-copy').addEventListener('click', () => {
    const code = container.querySelector('#deploy-hermes-code').textContent;
    navigator.clipboard.writeText(code).then(() => {
      const btn = container.querySelector('#deploy-hermes-copy');
      btn.textContent = 'Copied';
      btn.style.color = '#32d74b';
      setTimeout(() => { btn.textContent = 'Copy'; btn.style.color = ''; }, 1500);
    });
  });

  // Run in Terminal buttons
  container.querySelector('#deploy-openclaw-run').addEventListener('click', () => {
    const activeOs = container.querySelector('.deploy-os-btn.active')?.dataset.os || 'mac';
    const cmd = DEPLOY_CMDS.openclaw[activeOs];
    if (window.__navigateTo) {
      window.__navigateTo('terminal');
      setTimeout(() => {
        fetch('/ctrl/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmd, isRaw: true }),
        });
      }, 800);
    }
  });
  container.querySelector('#deploy-hermes-run').addEventListener('click', () => {
    if (window.__navigateTo) {
      window.__navigateTo('terminal');
      setTimeout(() => {
        fetch('/ctrl/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: DEPLOY_CMDS.hermes, isRaw: true }),
        });
      }, 800);
    }
  });

  // Glass blur slider
  const blurSlider = container.querySelector('.settings-glass-slider');
  const blurVal = container.querySelector('.settings-glass-value');
  if (blurSlider) {
    blurSlider.addEventListener('input', () => {
      const v = blurSlider.value;
      blurVal.textContent = v + 'px';
      setVal(SETTINGS.glassIntensity.key, v);
      document.documentElement.style.setProperty('--glass-blur', `blur(${v}px)`);
    });
  }

  // Glass opacity slider
  const opacitySlider = container.querySelector('.settings-glass-opacity-slider');
  const opacityVal = container.querySelector('.settings-glass-opacity-value');
  if (opacitySlider) {
    opacitySlider.addEventListener('input', () => {
      const v = opacitySlider.value;
      opacityVal.textContent = v + '%';
      setVal(SETTINGS.glassOpacity.key, v);
      applyGlassOpacity(parseInt(v) / 100);
    });
  }

  // Select dropdowns
  container.querySelectorAll('.settings-select').forEach(sel => {
    sel.addEventListener('change', () => {
      setVal(sel.dataset.key, sel.value);
      applySetting(sel.dataset.key, sel.value);
      // Brief pulse for lively feedback
      sel.style.transform = 'scale(1.04)';
      setTimeout(() => { sel.style.transform = 'scale(1)'; }, 120);
    });
  });

  // Toggle switches
  container.querySelectorAll('.settings-toggle-input').forEach(tog => {
    tog.addEventListener('change', () => {
      const checked = tog.checked;
      setVal(tog.dataset.key, checked);
      applySetting(tog.dataset.key, checked);
      // Update toggle visual (track background + knob position)
      const label = tog.closest('label');
      if (label) {
        const track = label.querySelector('.settings-toggle-track');
        const knob = label.querySelector('.settings-toggle-knob');
        if (track) {
          track.style.background = checked ? '#007AFF' : 'rgba(120,120,128,0.32)';
          track.style.boxShadow = `inset 0 1px 2px rgba(0,0,0,${checked ? '0.15' : '0.25'})`;
        }
        if (knob) {
          // Scale pulse for tactile feedback
          knob.style.transform = 'scale(1.15)';
          setTimeout(() => { knob.style.transform = 'scale(1)'; }, 150);

          knob.style.left = checked ? '29px' : '3px';
          knob.style.boxShadow = checked
            ? '0 1px 4px rgba(0,135,255,0.35),0 1px 2px rgba(0,0,0,0.15)'
            : '0 1px 4px rgba(0,0,0,0.35),0 1px 2px rgba(0,0,0,0.2)';
        }
      }
    });
  });

  // ── Toast helper ──
  function showToast(msg, type = 'success') {
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:500;color:#fff;backdrop-filter:blur(12px);animation:fadeIn .2s ease;pointer-events:none;`
      + (type === 'error' ? 'background:rgba(255,69,58,0.85);' : 'background:rgba(50,215,75,0.85);');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 2500);
  }

  // ── Export: capture ALL hermes_ keys + version metadata ──
  container.querySelector('#settings-export').addEventListener('click', () => {
    const data = { __meta: { version: '1.4', exportedAt: new Date().toISOString(), app: 'hermes-workbench' } };
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('hermes_')) {
        data[k] = localStorage.getItem(k);
      }
    }
    const count = Object.keys(data).length - 1; // exclude __meta
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hermes-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${count} settings`);
  });

  // ── Import: validate, preview, merge/replace ──
  const fileInput = container.querySelector('#settings-import-file');
  container.querySelector('#settings-import').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        // Validate
        const keys = Object.keys(data).filter(k => !k.startsWith('__'));
        if (keys.length === 0) { showToast('No settings found in file', 'error'); return; }
        // Show confirmation overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;animation:fadeIn .15s ease;';
        const meta = data.__meta || {};
        const preview = keys.slice(0, 12).map(k => `<div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);padding:2px 0;">${k.replace('hermes_', '')}</div>`).join('');
        const more = keys.length > 12 ? `<div style="font-size:11px;color:var(--text-tertiary);padding:2px 0;">...and ${keys.length - 12} more</div>` : '';
        overlay.innerHTML = `
          <div class="card" style="padding:24px 28px;max-width:420px;width:90%;text-align:left;">
            <div style="font-size:16px;font-weight:700;margin-bottom:6px;">Import Settings</div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:14px;">
              ${meta.exportedAt ? `Exported ${new Date(meta.exportedAt).toLocaleDateString()}` : 'Unknown date'} · ${keys.length} settings
            </div>
            <div style="background:var(--fill-quaternary);border-radius:8px;padding:10px 14px;margin-bottom:16px;max-height:180px;overflow-y:auto;">
              ${preview}${more}
            </div>
            <div style="display:flex;gap:8px;">
              <button id="import-merge" class="btn" style="flex:1;background:rgba(50,215,75,0.2);color:#32d74b;font-weight:600;">Merge</button>
              <button id="import-replace" class="btn" style="flex:1;background:rgba(255,69,58,0.2);color:#ff453a;font-weight:600;">Replace All</button>
              <button id="import-cancel" class="btn" style="flex:1;background:rgba(255,255,255,0.08);">Cancel</button>
            </div>
          </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (ev) => {
          if (ev.target === overlay) overlay.remove();
        });
        overlay.querySelector('#import-cancel').addEventListener('click', () => overlay.remove());
        overlay.querySelector('#import-merge').addEventListener('click', () => {
          keys.forEach(k => localStorage.setItem(k, data[k]));
          overlay.remove();
          showToast(`Merged ${keys.length} settings`);
          setTimeout(() => location.reload(), 600);
        });
        overlay.querySelector('#import-replace').addEventListener('click', () => {
          // Clear all hermes_ keys first
          const toRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('hermes_')) toRemove.push(k);
          }
          toRemove.forEach(k => localStorage.removeItem(k));
          // Apply imported
          keys.forEach(k => localStorage.setItem(k, data[k]));
          overlay.remove();
          showToast(`Replaced with ${keys.length} settings`);
          setTimeout(() => location.reload(), 600);
        });
      } catch (err) {
        showToast('Invalid settings file: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  });

  // Reset button with confirmation
  const resetBtn = container.querySelector('#settings-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (resetBtn.dataset.confirm) {
        // Second click — actually reset ALL hermes_ keys
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('hermes_')) toRemove.push(k);
        }
        toRemove.forEach(k => localStorage.removeItem(k));
        // Reset CSS vars
        document.documentElement.style.removeProperty('--glass-blur');
        ['--glass-bg-light','--glass-bg-dark','--glass-bg-dark-hero','--glass-card-light','--glass-card-dark','--glass-btn','--glass-subtle','--glass-bar','--glass-content'].forEach(k => document.documentElement.style.removeProperty(k));
        location.reload();
        return;
      }
      resetBtn.dataset.confirm = 'true';
      resetBtn.textContent = 'Confirm Reset?';
      resetBtn.style.background = 'rgba(255,69,58,0.35)';
      setTimeout(() => {
        delete resetBtn.dataset.confirm;
        resetBtn.textContent = 'Reset All Settings';
        resetBtn.style.background = 'rgba(255,69,58,0.15)';
      }, 3000);
    });
  }

  // ── Shortcut capture ──
  let listeningId = null;
  container.querySelectorAll('.shortcut-key-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      listeningId = id;
      window.__shortcutCaptureActive = true;
      btn.textContent = '...';
      btn.style.borderColor = 'var(--accent)';
    });
  });

  // Only attach the capture listener once (module-level guard)
  if (!document._shortcutCaptureAttached) {
    document._shortcutCaptureAttached = true;
    document.addEventListener('keydown', (e) => {
      if (!container.isConnected) {
        listeningId = null;
        window.__shortcutCaptureActive = false;
        return;
      }
      if (!listeningId) return;
      e.preventDefault();
      e.stopPropagation();
      const btn = container.querySelector(`.shortcut-key-btn[data-id="${listeningId}"]`);
      if (e.key === 'Escape') {
        const s = getShortcuts()[listeningId];
        if (btn) btn.textContent = (s.meta ? '⌘' : '') + (s.key ? s.key.toUpperCase() : '...');
        listeningId = null;
        window.__shortcutCaptureActive = false;
        if (btn) btn.style.borderColor = '';
        return;
      }
      const binding = { key: e.key.toLowerCase(), meta: e.metaKey || e.ctrlKey };
      saveShortcut(listeningId, binding);
      if (btn) btn.textContent = (binding.meta ? '⌘' : '') + binding.key.toUpperCase();
      if (btn) btn.style.borderColor = 'var(--online-color)';
      setTimeout(() => { if (btn) btn.style.borderColor = ''; }, 500);
      listeningId = null;
      window.__shortcutCaptureActive = false;
    });
  }

  container.querySelector('#shortcuts-reset').addEventListener('click', () => {
    resetShortcuts();
    const shortcutsList = container.querySelector('#shortcuts-list');
    if (shortcutsList) shortcutsList.innerHTML = renderShortcuts();
    // Re-attach capture listeners
    container.querySelectorAll('.shortcut-key-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        listeningId = id;
        window.__shortcutCaptureActive = true;
        btn.textContent = '...';
        btn.style.borderColor = 'var(--accent)';
      });
    });
  });
}

function renderShortcuts() {
  const shortcuts = getShortcuts();
  return Object.entries(shortcuts).map(([id, s]) => `
    <div class="shortcut-row" data-id="${id}" style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
      <span style="font-size:12px;color:var(--text-muted);">${escHtml(s.label)}</span>
      <button class="shortcut-key-btn" data-id="${id}" style="min-width:60px;padding:3px 10px;border-radius:5px;border:0.5px solid rgba(255,255,255,0.1);background:var(--fill-quinary);color:var(--text-main);font-size:11px;font-family:var(--font-mono);cursor:pointer;transition:all .12s;text-align:center;">
        ${s.meta ? '⌘' : ''}${s.key ? s.key.toUpperCase() : '...'}
      </button>
    </div>
  `).join('');
}

function escHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function renderSelectRow(setting) {
  const val = getVal(setting);
  return `
    <div class="settings-row" style="display:grid;grid-template-columns:1fr 120px;align-items:center;gap:14px;padding:12px 20px;">
      <div>
        <div style="font-size: 13px; font-weight: 500; margin-bottom: 2px;">${setting.label}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${setting.desc}</div>
      </div>
      <select class="settings-select" data-key="${setting.key}"
        style="padding:0 24px 0 10px; border-radius:8px; border:0.5px solid rgba(255,255,255,0.10);
          height:32px; width:100%; background:rgba(0,0,0,0.25); color:var(--text-main); font-size:12px; font-weight:500;
          font-family:inherit; outline:none; cursor:pointer; appearance:none;
          background-image:url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%276%27%3E%3Cpath d=%27M0 0l5 6 5-6%27 fill=%27none%27 stroke=%27rgba(255,255,255,0.5)%27 stroke-width=%271.5%27/%3E%3C/svg%3E');
          background-repeat:no-repeat; background-position:right 8px center;
          transition:border-color .15s;
        "
        onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='rgba(255,255,255,0.10)'">
        ${setting.options.map(o =>
          `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`
        ).join('')}
      </select>
    </div>
  `;
}

function renderToggleRow(setting) {
  const val = getVal(setting);
  return `
    <div class="settings-row" style="display:grid;grid-template-columns:1fr auto;align-items:center;gap:14px;padding:12px 20px;">
      <div>
        <div style="font-size: 13px; font-weight: 500; margin-bottom: 2px;">${setting.label}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${setting.desc}</div>
      </div>
      <label style="position:relative;display:inline-block;width:60px;height:28px;flex-shrink:0;cursor:pointer;">
        <input type="checkbox" class="settings-toggle-input" data-key="${setting.key}" ${val ? 'checked' : ''}
          style="opacity:0;width:0;height:0;position:absolute;"/>
        <span class="settings-toggle-track" style="
          position:absolute;inset:0;border-radius:14px;
          background:${val ? '#007AFF' : 'rgba(120,120,128,0.32)'};
          box-shadow:inset 0 1px 2px rgba(0,0,0,${val ? '0.15' : '0.25'});
          transition:all .25s cubic-bezier(0.4,0,0.2,1);
        ">
          <span class="settings-toggle-knob" style="
            position:absolute;top:3px;left:${val ? '29px' : '3px'};
            width:28px;height:22px;border-radius:11px;
            background:#ffffff;
            transition:all .25s cubic-bezier(0.4,0,0.2,1);
            box-shadow:0 1px 3px rgba(0,0,0,0.2), 0 0 1px rgba(0,0,0,0.1);
          "></span>
        </span>
      </label>
    </div>
  `;
}

function applySetting(key, val) {
  switch (key) {
    case 'hermes_animation_speed':
      document.body.classList.remove('anim-none', 'anim-reduced');
      if (val === 'none') document.body.classList.add('anim-none');
      if (val === 'reduced') {
        document.body.classList.add('anim-reduced');
        document.body.style.setProperty('--anim-speed', '0.08s');
      } else {
        document.body.style.removeProperty('--anim-speed');
      }
      break;
    case 'hermes_sidebar_default': {
      const isCollapsed = val === 'collapsed';
      localStorage.setItem('hermes_sidebar_collapsed', String(isCollapsed));
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        sidebar.classList.toggle('sidebar-collapsed', isCollapsed);
        if (isCollapsed) {
          sidebar.style.width = '';
          document.documentElement.style.setProperty('--sidebar-w', 'var(--sidebar-collapsed-w)');
        } else {
          const saved = localStorage.getItem('hermes_sidebar_width');
          if (saved) {
            sidebar.style.width = saved;
            document.documentElement.style.setProperty('--sidebar-w', saved);
          }
        }
      }
      break;
    }
    case 'hermes_show_status_footer': {
      const show = val === true || val === 'true';
      localStorage.setItem('hermes_show_status_footer', String(show));
      const footer = document.querySelector('.status-footer-text');
      if (footer) {
        footer.style.display = show ? '' : 'none';
      } else if (show && window.__navigateTo) {
        // Footer not in DOM — re-render via nav to rebuild sidebar
        const activeNav = document.querySelector('.nav-item.active');
        const page = activeNav ? activeNav.dataset.page : 'dashboard';
        window.__navigateTo(page);
      }
      break;
    }
    case 'hermes_compact_mode':
      document.body.classList.toggle('compact-mode', val === true || val === 'true');
      break;
  }
}

// ── Storage Card ──

const CAT_COLORS = {
  'GPU Cache':      '#0087FF',
  'Code Cache':     '#30D158',
  'System Cache':   '#FF9F0A',
  'Service Worker': '#BF5AF2',
  'Web Storage':    '#FF375F',
  'Cookies':        '#64D2FF',
  'Network & Misc': '#8E8E93',
};

function fsize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0, s = bytes;
  while (s >= 1024 && i < u.length - 1) { s /= 1024; i++; }
  return s.toFixed(i > 0 ? 1 : 0) + ' ' + u[i];
}

function buildDonut(categories) {
  const entries = Object.entries(categories).filter(([,v]) => v.bytes > 0);
  if (!entries.length) return '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:20px;">No data yet</div>';

  const total = entries.reduce((s, [,v]) => s + v.bytes, 0) || 1;
  const r = 44, cx = 52, cy = 52, full = 2 * Math.PI;
  let offset = -Math.PI / 2;
  const slices = [];
  for (const [label, info] of entries) {
    const pct = info.bytes / total;
    const len = full * pct;
    const x1 = cx + r * Math.cos(offset);
    const y1 = cy + r * Math.sin(offset);
    const x2 = cx + r * Math.cos(offset + len);
    const y2 = cy + r * Math.sin(offset + len);
    const large = len > Math.PI ? 1 : 0;
    slices.push({ label, pct, x1, y1, x2, y2, large, color: CAT_COLORS[label] || '#8E8E93' });
    offset += len;
  }
  let paths = '';
  for (const s of slices) {
    paths += `<path d="M${cx},${cy} L${s.x1},${s.y1} A${r},${r} 0 ${s.large},1 ${s.x2},${s.y2} Z" fill="${s.color}" opacity="0.85" stroke="var(--glass-card)" stroke-width="1"/>\n`;
  }
  const donut = `<svg width="104" height="104" viewBox="0 0 104 104" style="flex-shrink:0;">
    <circle cx="${cx}" cy="${cy}" r="30" fill="var(--glass-bg-dark, rgba(20,20,20,0.8))"/>
    ${paths}
    <circle cx="${cx}" cy="${cy}" r="30" fill="var(--glass-bg-dark, rgba(20,20,20,0.8))"/>
    <text x="${cx}" y="${cy + 2}" text-anchor="middle" fill="var(--text-main)" font-size="12" font-weight="700">${fsize(total)}</text>
    <text x="${cx}" y="${cy + 15}" text-anchor="middle" fill="var(--text-muted)" font-size="9">total</text>
  </svg>`;
  let legend = '';
  for (const [label, info] of entries) {
    const pct = ((info.bytes / total) * 100).toFixed(1);
    legend += `<div style="display:flex;align-items:center;gap:6px;font-size:11px;">
      <span style="width:8px;height:8px;border-radius:2px;background:${CAT_COLORS[label]||'#8E8E93'};flex-shrink:0;"></span>
      <span style="color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${label}</span>
      <span style="color:var(--text-muted);margin-left:auto;white-space:nowrap;">${info.formatted}</span>
      <span style="color:var(--text-tertiary);width:36px;text-align:right;white-space:nowrap;">${pct}%</span>
    </div>`;
  }
  return donut + '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;">' + legend + '</div>';
}

function initStorageCard(container) {
  const area = container.querySelector('#storage-chart-area');
  const clearBtn = container.querySelector('#storage-btn-clear');
  const refreshBtn = container.querySelector('#storage-btn-refresh');
  if (!area) return;

  async function loadData() {
    try {
      const r = await fetch('/ctrl/storage');
      const d = await r.json();
      area.innerHTML = buildDonut(d.categories);
      if (clearBtn) {
        if (d.clearableBytes > 0) {
          clearBtn.textContent = 'Clear System Cache  (' + d.clearableFormatted + ')';
          clearBtn.style.opacity = '1';
        } else {
          clearBtn.textContent = 'Clear System Cache';
          clearBtn.style.opacity = '0.5';
        }
      }
    } catch {
      area.innerHTML = '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:12px;width:100%;">API unavailable</div>';
    }
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      clearBtn.textContent = 'Clearing...';
      clearBtn.style.opacity = '0.6';
      clearBtn.disabled = true;
      try {
        const r = await fetch('/ctrl/clear-cache', { method: 'POST' });
        const d = await r.json();
        const msg = d.success && d.clearedBytes > 0 ? 'Freed ' + d.clearedFormatted : 'Cache already empty';
        const t = document.createElement('div');
        t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:500;color:#fff;backdrop-filter:blur(12px);animation:fadeIn .2s ease;pointer-events:none;background:rgba(50,215,75,0.85);';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 1800);
        await loadData();
      } catch {
        const t = document.createElement('div');
        t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:500;color:#fff;backdrop-filter:blur(12px);animation:fadeIn .2s ease;pointer-events:none;background:rgba(255,69,58,0.85);';
        t.textContent = 'Failed to clear cache';
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 1800);
      }
      clearBtn.disabled = false;
    });
  }

  if (refreshBtn) refreshBtn.addEventListener('click', loadData);
  loadData();
}

// Apply saved settings on load
export function applySavedSettings() {
  const blur = localStorage.getItem('hermes_glass_intensity');
  if (blur) document.documentElement.style.setProperty('--glass-blur', `blur(${blur}px)`);

  const opacity = localStorage.getItem('hermes_glass_opacity');
  if (opacity) applyGlassOpacity(parseInt(opacity) / 100);

  const anim = localStorage.getItem('hermes_animation_speed');
  if (anim && anim !== 'normal') {
    document.body.classList.add(`anim-${anim}`);
  }

  // Seed sidebar state from sidebarDefault if not already set
  const sidebarDefault = localStorage.getItem('hermes_sidebar_default');
  if (sidebarDefault && !localStorage.getItem('hermes_sidebar_collapsed')) {
    if (sidebarDefault === 'collapsed') {
      localStorage.setItem('hermes_sidebar_collapsed', 'true');
    }
  }

  if (localStorage.getItem('hermes_compact_mode') === 'true') {
    document.body.classList.add('compact-mode');
  }
}

// Glass opacity: dim (0.0–1.0) scales panel background alpha values
function applyGlassOpacity(dim) {
  const set = (key, r, g, b, a) => {
    document.documentElement.style.setProperty(key, `rgba(${r},${g},${b},${(a * dim).toFixed(3)})`);
  };
  set('--glass-bg-light',     255, 255, 255, 0.10);
  set('--glass-bg-dark',      0,   0,   0,   0.20);
  set('--glass-bg-dark-hero', 0,   0,   0,   0.18);
  set('--glass-card-light',   255, 255, 255, 0.12);
  set('--glass-card-dark',    0,   0,   0,   0.15);
  set('--glass-btn',          255, 255, 255, 0.20);
  set('--glass-subtle',       255, 255, 255, 0.06);
  set('--glass-bar',          255, 255, 255, 0.08);
  set('--glass-content',      0,   0,   0,   0.12);
}
