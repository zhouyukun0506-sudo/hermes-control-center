// ── Customizable Keyboard Shortcuts ──
const KEY = 'hermes_shortcuts';

export const DEFAULT_SHORTCUTS = {
  dashboard:     { key: '1', meta: true, label: 'Control Center' },
  terminal:      { key: '2', meta: true, label: 'Command Line' },
  original_webui:{ key: '3', meta: true, label: 'Core UI' },
  browser_pages: { key: '4', meta: true, label: 'Browser Manager' },
  monitor:       { key: '5', meta: true, label: 'Activity Monitor' },
  settings:      { key: '6', meta: true, label: 'Settings' },
  calendar:      { key: '7', meta: true, label: 'Calendar' },
  sessions:      { key: '8', meta: true, label: 'Session Manager' },
  logs:          { key: '9', meta: true, label: 'Log Viewer' },
  theme:         { key: '0', meta: true, label: 'Theme Customizer' },
  global_search: { key: 'f', meta: true, label: 'Global Search' },
  global_chat:   { key: '.', meta: true, label: 'Global Chat' },
};

export function getShortcuts() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const p = JSON.parse(raw); return { ...DEFAULT_SHORTCUTS, ...p }; }
  } catch {}
  return { ...DEFAULT_SHORTCUTS };
}

export function saveShortcut(id, binding) {
  const s = getShortcuts();
  s[id] = { ...s[id], ...binding };
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function resetShortcuts() {
  localStorage.removeItem(KEY);
}

export function getBinding(id) {
  return getShortcuts()[id] || null;
}
