// ── Main Entry Point ──
import { renderNav } from './components/nav.js';
import { renderDashboard } from './components/dashboard.js';
import { renderTerminal } from './components/terminal.js';
import { renderMonitor } from './components/monitor.js';
import { renderBrowser } from './components/browser.js';
import { renderSettings } from './components/settings.js';
import { renderIframeWebUI } from './components/iframe_webui.js';
import { renderIframe } from './components/iframe.js';
import { renderIframeKimi } from './components/iframe_kimi.js';
import { renderIframeDeepSeek } from './components/iframe_deepseek.js';
import { renderIframeGemini } from './components/iframe_gemini.js';
import * as api from './api.js';

// ── App State ──
let currentPage = 'dashboard';
let currentSessionId = null;
let status = { gateway_running: false, webui_running: false };
let intervalId = null;

// ── Visual Initialization ──
function applyVisuals() {
  const themeId = localStorage.getItem('hermes_theme') || 'default';
  const fontId = localStorage.getItem('hermes_font') || 'default';
  const themes = { 'matrix': 'theme-matrix', 'vapor': 'theme-vapor', 'white': 'theme-white', 'default': '' };
  const fonts = { 'default': 'font-default', 'terminal': 'font-terminal', 'square': 'font-square', 'mono': 'font-mono', 'roboto': 'font-roboto', 'apple': 'font-apple', 'dot': 'font-dot' };
  document.body.className = `${themes[themeId] || ''} ${fonts[fontId] || 'font-default'}`;
}
applyVisuals();

function initApp() {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = `<div class="sidebar" id="sidebar"></div><div class="main-content" id="main-content"></div>`;
  const navEl = document.getElementById('sidebar');
  renderNav(navEl, { activePage: currentPage, status, onNavigate: navigate });
  renderMain();
}

// ── Routing ──
function navigate(page, sessionId = null) {
  currentSessionId = sessionId;
  
  if (page === currentPage && !sessionId) {
    const iframePages = ['mimo_plan', 'kimi_plan', 'deepseek', 'gemini', 'original_webui', 'terminal'];
    if (iframePages.includes(page)) {
      renderMain();
    }
    return;
  }
  
  const mainEl = document.getElementById('main-content');
  if (mainEl && mainEl.cleanup) {
    mainEl.cleanup();
    delete mainEl.cleanup;
  }

  currentPage = page;
  
  const navEl = document.getElementById('sidebar');
  renderNav(navEl, { activePage: currentPage, status, onNavigate: navigate });
  renderMain();
}

async function updateStatus(force = false) {
  try {
    const newStatus = await api.ctrl.status();
    const becameOnline = !status.webui_running && newStatus.webui_running;
    const statusChanged = status.webui_running !== newStatus.webui_running || status.gateway_running !== newStatus.gateway_running;
    
    status = newStatus;
    updateSidebarStatus();

    // If it just became online, refresh the session list
    if (becameOnline && window.refreshSessions) {
      const navEl = document.getElementById('sidebar');
      window.refreshSessions(navEl, navigate);
    }

    // ONLY re-render the main content if the connection status changed OR if forced (manual action)
    if (statusChanged || force) {
      renderMain();
    }
  } catch (err) {
    console.error('Status check failed:', err);
  }
}

function updateSidebarStatus() {
  const navEl = document.getElementById('sidebar');
  if (!navEl) return;
  const online = status.webui_running;
  const gwOnline = status.gateway_running;
  const dot = navEl.querySelector('.status-dot');
  const text = navEl.querySelector('.nav-status span');
  if (dot) dot.className = `status-dot ${online ? 'online' : ''}`;
  if (text) text.textContent = online ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE';
  const footer = navEl.querySelector('div[style*="border-top"] div');
  if (footer) footer.textContent = `GW:${gwOnline ? 'OK' : 'ERR'} | UI:${online ? 'OK' : 'ERR'}`;
}

function renderMain() {
  const mainEl = document.getElementById('main-content');
  if (!mainEl) return;

  const ctx = { activePage: currentPage, status, onNavigate: navigate, onStatusChange: updateStatus };

  switch (currentPage) {
    case 'dashboard': renderDashboard(mainEl, ctx); break;
    case 'terminal': renderTerminal(mainEl); break;
    case 'monitor': renderMonitor(mainEl); break;
    case 'browser': renderBrowser(mainEl); break;
    case 'settings': renderSettings(mainEl); break;
    case 'original_webui': renderIframeWebUI(mainEl, currentSessionId); break;
    case 'mimo_plan': renderIframe(mainEl); break;
    case 'kimi_plan': renderIframeKimi(mainEl); break;
    case 'deepseek': renderIframeDeepSeek(mainEl); break;
    case 'gemini': renderIframeGemini(mainEl); break;
    default: renderDashboard(mainEl, ctx);
  }
}

initApp();
updateStatus();
intervalId = setInterval(updateStatus, 5000);
window.applyVisuals = applyVisuals;
