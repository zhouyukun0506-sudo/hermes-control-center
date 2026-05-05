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
import { renderCustomIframe } from './components/custom_iframe.js';
import { renderBrowserManager } from './components/browser_manager.js';
import { renderComparisonSearch } from './components/comparison_search.js';
import { renderFlipClock } from './components/flip_clock.js';
import { initGlobalSearch } from './components/global_search.js';
import { getCustomPages } from './utils/pageConfig.js';
import { getShortcuts } from './utils/shortcuts.js';
import { initQuickActions } from './components/quick_actions.js';
import * as api from './api.js';
import { initSplitView, renderSplitView } from './components/split_view.js';
import { initGlobalChat } from './components/global_chat.js';

// ── App State ──
let currentPage = 'dashboard';
let currentSessionId = null;
let status = { gateway_running: false, webui_running: false, openclaw_running: false, openclaw_url: null };
let intervalId = null;

// Navigation history for back/forward
const navHistory = { stack: [], index: -1 };

// Tombstone cache: preserves page state across navigations to avoid re-fetches
const tombstoneCache = new Map();

// ── Visual Initialization ──
const THEME_ACCENTS = {
  'default': '#BB2649', 'matrix': '#2ecc71', 'vapor': '#bf5af2', 'white': '#BB2649',
  'ocean': '#00d4ff', 'sunset': '#ff8c42', 'forest': '#2ecc71', 'rosegold': '#e8879a', 'arctic': '#7ec8e3',
  'fig1': '#91CFD5', 'fig2': '#00BFA5', 'fig3': '#E72D48', 'fig4': '#E6397C', 'fig5': '#91C53A',
};
const THEME_BGS = {
  'default': '#0a0a0a', 'matrix': '#0a0a0a', 'vapor': '#1a0a2e', 'white': '#fbfbfd',
  'ocean': '#0a1e2e', 'sunset': '#1e0f0a', 'forest': '#0a1a0e', 'rosegold': '#1a0f14', 'arctic': '#0e1a24',
  'fig1': '#113056', 'fig2': '#6A1B9A', 'fig3': '#F1DDDF', 'fig4': '#1A1A1D', 'fig5': '#5E55A2',
};
const bgClasses = { 'default': 'dark-bg', 'matrix': 'matrix-bg', 'vapor': 'vapor-bg', 'white': 'white-bg', 'ocean': 'ocean-bg', 'sunset': 'sunset-bg', 'forest': 'forest-bg', 'rosegold': 'rosegold-bg', 'arctic': 'arctic-bg', 'fig1': 'fig1-bg', 'fig2': 'fig2-bg', 'fig3': 'fig3-bg', 'fig4': 'fig4-bg', 'fig5': 'fig5-bg' };

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
  const fonts = { 'default': 'font-default', 'terminal': 'font-terminal', 'square': 'font-square', 'mono': 'font-mono', 'roboto': 'font-roboto', 'apple': 'font-apple', 'dot': 'font-dot', 'misans': 'font-misans', 'serif': 'font-serif' };

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
  const designStyle = localStorage.getItem('hermes_design_style') || 'glass';
  document.body.className = `${bgClasses[themeId] || 'dark-bg'} ${fonts[fontId] || 'font-default'} style-${designStyle}`;
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
  initSidebarResize();
  const ctx = { activePage: currentPage, status, onNavigate: navigate, onStatusChange: updateStatus };
  initQuickActions(ctx);
  initSplitView();
  initGlobalChat();
  initMouseGlow();
  renderMain();
}

// ── Mouse Glow (subtle cursor-following radial gradient) ──
function initMouseGlow() {
  const glow = document.createElement('div');
  glow.id = 'mouse-glow';
  document.body.appendChild(glow);

  let active = false;
  document.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
    if (!active) {
      active = true;
      glow.classList.add('active');
    }
  });
}

// ── Sidebar Resize ──
function initSidebarResize() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  // Restore saved width — but only if sidebar is NOT collapsed
  const isCollapsed = localStorage.getItem('hermes_sidebar_collapsed') === 'true';
  if (!isCollapsed) {
    const saved = localStorage.getItem('hermes_sidebar_width');
    if (saved) {
      sidebar.style.width = saved;
      document.documentElement.style.setProperty('--sidebar-w', saved);
    }
  } else {
    sidebar.style.width = '';
    document.documentElement.style.setProperty('--sidebar-w', 'var(--sidebar-collapsed-w)');
  }

  // Create resize handle
  const handle = document.createElement('div');
  handle.className = 'sidebar-resize-handle';
  sidebar.appendChild(handle);

  let startX, startW;

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    startX = e.clientX;
    startW = sidebar.offsetWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    sidebar.classList.add('sidebar-resizing');

    const onMove = (e) => {
      const dx = e.clientX - startX;
      const newW = Math.min(Math.max(startW + dx, 180), 400);
      sidebar.style.width = newW + 'px';
      document.documentElement.style.setProperty('--sidebar-w', newW + 'px');
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      sidebar.classList.remove('sidebar-resizing');
      localStorage.setItem('hermes_sidebar_width', sidebar.style.width);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
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
    const iframePages = ['original_webui', 'terminal'];
    if (iframePages.includes(page) || page.startsWith('custom_')) {
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

// Exposed for split_view and other sub-container rendering
window.__renderPageToContainer = (pageId, container) => {
  const ctx = { activePage: pageId, status, onNavigate: navigate, onStatusChange: updateStatus };
  const customPages = getCustomPages();
  const pageConfig = customPages.find(p => p.id === pageId);

  switch (pageId) {
    case 'dashboard': renderDashboard(container, ctx); break;
    case 'terminal': renderTerminal(container); break;
    case 'monitor': renderMonitor(container); break;
    case 'settings': renderSettings(container); break;
    case 'skills': renderSkills(container); break;
    case 'memory': renderMemory(container); break;
    case 'insights': renderInsights(container); break;
    case 'models': renderModelExplorer(container); break;
    case 'sessions': renderSessionManager(container); break;
    case 'logs': renderLogViewer(container); break;
    case 'calendar': renderCalendar(container, ctx); break;
    case 'theme': renderThemeCustomizer(container); break;
    case 'original_webui': renderIframeWebUI(container, currentSessionId); break;
    case 'openclaw_webui': renderIframeWebUI(container, null, status.openclaw_url); break;
    case 'browser_pages': renderBrowserManager(container); break;
    case 'comparison_search': renderComparisonSearch(container); break;
    case 'flip_clock': renderFlipClock(container); break;
    default:
      if (pageConfig) renderCustomIframe(container, pageConfig);
      break;
  }
};

function renderMain() {
  const pageEl = document.getElementById('page-content');
  if (!pageEl) return;

  const ctx = { activePage: currentPage, status, onNavigate: navigate, onStatusChange: updateStatus };

  // Track current page globally for browser_manager
  window.__currentPage = currentPage;

  // Check tombstone cache — consume on use (will be re-saved on navigate away)
  const tombstone = tombstoneCache.get(currentPage);
  if (tombstone) tombstoneCache.delete(currentPage);
  if (tombstone) ctx.tombstone = tombstone;

  // Page transition: remove old class, force reflow, add new
  pageEl.classList.remove('page-enter');
  void pageEl.offsetHeight;

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
    case 'openclaw_webui': renderIframeWebUI(pageEl, null, status.openclaw_url); break;
    case 'browser_pages': renderBrowserManager(pageEl); break;
    case 'comparison_search': renderComparisonSearch(pageEl); break;
    case 'flip_clock': renderFlipClock(pageEl); break;
    case 'split_view': renderSplitView(pageEl); break;
    default: {
      // Check if it's a custom browser page
      const customPages = getCustomPages();
      const pageConfig = customPages.find(p => p.id === currentPage);
      if (pageConfig) {
        renderCustomIframe(pageEl, pageConfig);
      } else {
        renderDashboard(pageEl, ctx);
      }
      break;
    }
  }

  // Trigger page entrance animation
  pageEl.classList.add('page-enter');
}

initApp();
initGlobalSearch();
window.__navigateTo = navigate;
window.refreshNav = () => updateSidebarStatus();
window.__openGlobalSearch = null;  // Will be set by global_search component
window.__openGlobalChat = null;    // Will be set by global_chat component
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
function buildShortcutMap() {
  const shortcuts = getShortcuts();
  const map = {};
  Object.entries(shortcuts).forEach(([pageId, s]) => {
    if (s.meta && s.key) map[s.key] = pageId;
  });
  // Map special names to internal actions
  map._chat = shortcuts.global_chat?.meta ? shortcuts.global_chat?.key : null;
  map._search = shortcuts.global_search?.meta ? shortcuts.global_search?.key : null;
  return map;
}
let SHORTCUT_MAP = buildShortcutMap();
document.addEventListener('keydown', (e) => {
  // If shortcut capture is active in settings, don't interfere
  if (window.__shortcutCaptureActive) return;
  // Don't hijack shortcuts when typing in inputs
  const tag = e.target.tagName;
  const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    || e.target.isContentEditable
    || e.target.closest('.xterm-helper-textarea')
    || e.target.closest('[contenteditable="true"]');
  if (isEditable) return;
  // Don't hijack when command palette is open
  if (document.getElementById('qa-palette')?.style.display !== 'none') return;

  const isMeta = e.metaKey || e.ctrlKey;

  // Rebuild shortcut map so changes take effect
  SHORTCUT_MAP = buildShortcutMap();

  // ⌘1-9 → direct page switch
  if (isMeta && SHORTCUT_MAP[e.key]) {
    const target = SHORTCUT_MAP[e.key];
    // Global search/chat work even when focused on inputs
    if (target === '_search') {
      e.preventDefault();
      if (window.__openGlobalSearch) window.__openGlobalSearch();
      return;
    }
    if (target === '_chat') {
      e.preventDefault();
      if (window.__openGlobalChat) window.__openGlobalChat();
      return;
    }
    // Page navigation
    e.preventDefault();
    navigate(target);
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

  // ↑/↓ → cycle through nav items (global, works from content area)
  if (!isMeta && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    const navItems = [...document.querySelectorAll('.nav-item')];
    if (navItems.length === 0) return;
    const currentIdx = navItems.findIndex(el => el.dataset.page === currentPage);
    let nextIdx;
    if (e.key === 'ArrowDown') {
      nextIdx = currentIdx < navItems.length - 1 ? currentIdx + 1 : 0;
    } else {
      nextIdx = currentIdx > 0 ? currentIdx - 1 : navItems.length - 1;
    }
    e.preventDefault();
    navigate(navItems[nextIdx].dataset.page);
    return;
  }
});
