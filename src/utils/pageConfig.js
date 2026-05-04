// ── Custom Browser Page Configuration ──
// Manages user-customizable browser/agent pages (stored in localStorage).
// The Core WebUI (original_webui) is NOT managed here — it's hardcoded.

const STORAGE_KEY = 'hermes_browser_pages';

const DEFAULT_PAGES = [
  { id: 'custom_mimo', label: 'Mimo', url: 'https://platform.xiaomimimo.com/console/plan-manage', icon: 'lightbulb' },
  { id: 'custom_kimi', label: 'Kimi Intelligence', url: 'https://platform.kimi.com/console/account', icon: 'spark' },
  { id: 'custom_deepseek', label: 'DeepSeek', url: 'https://platform.deepseek.com/sign_in', icon: 'search' },
  { id: 'custom_gemini', label: 'Gemini Pro', url: 'https://gemini.google.com/', icon: 'chat' },
];

export function getDefaultPages() {
  return JSON.parse(JSON.stringify(DEFAULT_PAGES));
}

export function getCustomPages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Migrate old IDs (mimo_plan -> custom_mimo etc.)
        return parsed.map(p => {
          const oldMap = { mimo_plan: 'custom_mimo', kimi_plan: 'custom_kimi', deepseek: 'custom_deepseek', gemini: 'custom_gemini' };
          if (oldMap[p.id]) p.id = oldMap[p.id];
          return p;
        });
      }
    }
  } catch {}
  const defaults = getDefaultPages();
  saveCustomPages(defaults);
  return defaults;
}

export function saveCustomPages(pages) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
}

export function resetToDefaults() {
  saveCustomPages(getDefaultPages());
}

export function generateId() {
  return 'custom_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}
