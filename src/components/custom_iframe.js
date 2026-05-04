// ── Custom Browser Page Renderer ──
import { createBrowserFrame } from './browser_frame.js';

export function renderCustomIframe(container, pageConfig) {
  createBrowserFrame(container, { startUrl: pageConfig.url });
}
