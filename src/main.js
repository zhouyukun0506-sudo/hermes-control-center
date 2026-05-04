// ── Main Entry Point ──
import { renderNav } from './components/nav.js';
import { renderDashboard } from './components/dashboard.js';
import { renderTerminal } from './components/terminal.js';
import { renderMonitor } from './components/monitor.js';
import { renderSettings } from './components/settings.js';
import { renderSkills } from './components/skills.js';
import { renderMemory } from './components/memory.js';
import { renderInsights } from './components/insights.js';
import { renderModelExplorer } from './components/model_explorer.js';
import { renderSessionManager } from './components/session_manager.js';
import { renderLogViewer } from './components/log_viewer.js';
import { renderThemeCustomizer } from './components/theme_customizer.js';
import { renderCalendar } from './components/calendar.js';
import { applySavedSettings } from './components/settings.js';
import { renderIframeWebUI } from './components/iframe_webui.js';
import { renderIframe } from './components/iframe.js';
import { renderIframeKimi } from './components/iframe_kimi.js';
import { renderIframeDeepSeek } from './components/iframe_deepseek.js';
import { renderIframeGemini } from './components/iframe_gemini.js';
import { initQuickActions } from './components/quick_actions.js';
import * as api from './api.js';

// ── App State ──
let currentPage = 'dashboard';
let currentSessionId = null;
let status = { gateway_running: false, webui_running: false };
let intervalId = null;

// Navigation history for back/forward
const navHistory = { stack: [], index: -1 };

// Tombstone cache: preserves page state across navigations to avoid re-fetches
const tombstoneCache = new Map();

// ── Visual Initialization ──
const THEME_ACCENTS = {
  'default': '#BB2649', 'matrix': '#2ecc71', 'vapor': '#bf5af2', 'white': '#BB2649',
  'fig1': '#91CFD5', 'fig2': '#00BFA5', 'fig3': '#E72D48', 'fig4': '#E6397C', 'fig5': '#91C53A',
};
const THEME_BGS = {
  'default': '#0a0a0a', 'matrix': '#0a0a0a', 'vapor': '#1a0a2e', 'white': '#fbfbfd',
  'fig1': '#113056', 'fig2': '#6A1B9A', 'fig3': '#F1DDDF', 'fig4': '#1A1A1D', 'fig5': '#5E55A2',
};
const bgClasses = { 'default': 'dark-bg', 'matrix': 'matrix-bg', 'vapor': 'vapor-bg', 'white': 'white-bg', 'fig1': 'fig1-bg', 'fig2': 'fig2-bg', 'fig3': 'fig3-bg', 'fig4': 'fig4-bg', 'fig5': 'fig5-bg' };

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

function applyVisuals() {
  const themeId = localStorage.getItem('hermes_theme') || 'default';
  const fontId = localStorage.getItem('hermes_font') || 'default';
  const fonts = { 'default': 'font-default', 'terminal': 'font-terminal', 'square': 'font-square', 'mono': 'font-mono', 'roboto': 'font-roboto', 'apple': 'font-apple', 'dot': 'font-dot' };

  if (localStorage.getItem('hermes_accent_custom')) {
    // Custom colors — keep existing CSS var overrides
  } else {
    // Preset theme — apply its accent and bg as CSS vars
    const accent = THEME_ACCENTS[themeId] || '#BB2649';
    const bg = THEME_BGS[themeId] || '#0a0a0a';
    const rgb = hexToRgb(accent);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-gradient',
      `linear-gradient(135deg, ${accent} 0%, hsl(${hsl.h}, ${Math.min(100, hsl.s + 20)}%, ${Math.min(85, hsl.l + 15)}%) 100%)`);
    document.documentElement.style.setProperty('--bg-primary', bg);
    document.body.style.removeProperty('background');
  }
  document.body.className = `${bgClasses[themeId] || 'dark-bg'} ${fonts[fontId] || 'font-default'}`;
}
applyVisuals();
applySavedSettings();

function initApp() {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = `
    <div class="sidebar" id="sidebar"></div>
    <div class="main-area">
      <div class="content-area">
        <div class="titlebar">
          <div id="qa-toolbar" class="titlebar-actions"></div>
        </div>
        <div id="page-content"></div>
      </div>
    </div>`;
  const navEl = document.getElementById('sidebar');
  renderNav(navEl, { activePage: currentPage, status, onNavigate: navigate });
  const ctx = { activePage: currentPage, status, onNavigate: navigate, onStatusChange: updateStatus };
  initQuickActions(ctx);
  renderMain();
}

function updateNavActive(page) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
}

// ── Routing ──
function navigate(page, sessionId = null) {
  const prevPage = currentPage;
  currentSessionId = sessionId;

  if (page === prevPage && !sessionId) {
    const iframePages = ['mimo_plan', 'kimi_plan', 'deepseek', 'gemini', 'original_webui', 'terminal'];
    if (iframePages.includes(page)) {
      renderMain();
    }
    return;
  }

  const pageEl = document.getElementById('page-content');
  if (pageEl) {
    // Save tombstone state before cleanup
    if (pageEl.tombstone && prevPage !== page) {
      tombstoneCache.set(prevPage, pageEl.tombstone());
    }
    if (pageEl.cleanup) {
      pageEl.cleanup();
      delete pageEl.cleanup;
    }
    // Remove tombstone getter so we don't accidentally call it again
    delete pageEl.tombstone;
  }

  // Push to history (truncate forward entries if we navigated back)
  if (prevPage !== page) {
    navHistory.stack = navHistory.stack.slice(0, navHistory.index + 1);
    navHistory.stack.push(prevPage);
    navHistory.index = navHistory.stack.length - 1;
  }

  currentPage = page;

  updateNavActive(page);
  renderMain();
}

function navigateBack() {
  if (navHistory.index <= 0) return;
  navHistory.index--;
  const page = navHistory.stack[navHistory.index];
  if (page && page !== currentPage) {
    const prevPage = currentPage;
    currentPage = page;
    const pageEl = document.getElementById('page-content');
    if (pageEl) {
      if (pageEl.tombstone) {
        tombstoneCache.set(prevPage, pageEl.tombstone());
      }
      if (pageEl.cleanup) { pageEl.cleanup(); delete pageEl.cleanup; }
      delete pageEl.tombstone;
    }
    updateNavActive(page);
    renderMain();
  }
}

function navigateForward() {
  if (navHistory.index >= navHistory.stack.length - 1) return;
  navHistory.index++;
  const page = navHistory.stack[navHistory.index];
  if (page && page !== currentPage) {
    const prevPage = currentPage;
    currentPage = page;
    const pageEl = document.getElementById('page-content');
    if (pageEl) {
      if (pageEl.tombstone) {
        tombstoneCache.set(prevPage, pageEl.tombstone());
      }
      if (pageEl.cleanup) { pageEl.cleanup(); delete pageEl.cleanup; }
      delete pageEl.tombstone;
    }
    updateNavActive(page);
    renderMain();
  }
}

async function updateStatus(force = false) {
  try {
    const newStatus = await api.ctrl.status();
    const becameOnline = !status.webui_running && newStatus.webui_running;
    const statusChanged = status.webui_running !== newStatus.webui_running || status.gateway_running !== newStatus.gateway_running;

    status = newStatus;

    if (becameOnline && window.refreshSessions) {
      const navEl = document.getElementById('sidebar');
      window.refreshSessions(navEl, navigate);
    }

    if (statusChanged || force) {
      updateSidebarStatus();
      renderMain();
    }
  } catch (err) {
    console.error('Status check failed:', err);
  }
}

function updateSidebarStatus() {
  const navEl = document.getElementById('sidebar');
  if (!navEl) return;
  renderNav(navEl, { activePage: currentPage, status, onNavigate: navigate });
}

function renderMain() {
  const pageEl = document.getElementById('page-content');
  if (!pageEl) return;

  const ctx = { activePage: currentPage, status, onNavigate: navigate, onStatusChange: updateStatus };

  // Check tombstone cache — consume on use (will be re-saved on navigate away)
  const tombstone = tombstoneCache.get(currentPage);
  if (tombstone) tombstoneCache.delete(currentPage);
  if (tombstone) ctx.tombstone = tombstone;

  switch (currentPage) {
    case 'dashboard': renderDashboard(pageEl, ctx); break;
    case 'terminal': renderTerminal(pageEl); break;
    case 'monitor': renderMonitor(pageEl); break;
    case 'settings': renderSettings(pageEl); break;
    case 'skills': renderSkills(pageEl); break;
    case 'memory': renderMemory(pageEl); break;
    case 'insights': renderInsights(pageEl); break;
    case 'models': renderModelExplorer(pageEl); break;
    case 'sessions': renderSessionManager(pageEl); break;
    case 'logs': renderLogViewer(pageEl); break;
    case 'calendar': renderCalendar(pageEl, ctx); break;
    case 'theme': renderThemeCustomizer(pageEl); break;
    case 'original_webui': renderIframeWebUI(pageEl, currentSessionId); break;
    case 'mimo_plan': renderIframe(pageEl); break;
    case 'kimi_plan': renderIframeKimi(pageEl); break;
    case 'deepseek': renderIframeDeepSeek(pageEl); break;
    case 'gemini': renderIframeGemini(pageEl); break;
    default: renderDashboard(pageEl, ctx);
  }
}

initApp();
window.__navigateTo = navigate;
updateStatus();
intervalId = setInterval(updateStatus, 5000);
window.applyVisuals = applyVisuals;

// ── Visibility: pause CPU-heavy work when window is hidden ──
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearInterval(intervalId);
    intervalId = null;
    document.documentElement.classList.add('window-hidden');
  } else {
    updateStatus();
    intervalId = setInterval(updateStatus, 5000);
    document.documentElement.classList.remove('window-hidden');
  }
});

// ── Keyboard shortcuts for quick page switching ──
const SHORTCUT_MAP = {
  '1': 'dashboard',
  '2': 'terminal',
  '3': 'original_webui',
  '4': 'mimo_plan',
  '5': 'kimi_plan',
  '6': 'deepseek',
  '7': 'gemini',
  '8': 'settings',
  '9': 'theme',
  '0': 'calendar',
};
document.addEventListener('keydown', (e) => {
  // Don't hijack shortcuts when typing in inputs
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  // Don't hijack when command palette is open
  if (document.getElementById('qa-palette')?.style.display !== 'none') return;

  const isMeta = e.metaKey || e.ctrlKey;

  // ⌘1-9 → direct page switch
  if (isMeta && SHORTCUT_MAP[e.key]) {
    e.preventDefault();
    navigate(SHORTCUT_MAP[e.key]);
    return;
  }

  // ⌘[ or ⌘← → back
  if (isMeta && (e.key === '[' || e.key === 'ArrowLeft')) {
    e.preventDefault();
    navigateBack();
    return;
  }

  // ⌘] or ⌘→ → forward
  if (isMeta && (e.key === ']' || e.key === 'ArrowRight')) {
    e.preventDefault();
    navigateForward();
    return;
  }
});
