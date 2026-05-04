import { createBrowserFrame } from './browser_frame.js';

export function renderIframeKimi(container) {
  createBrowserFrame(container, {
    startUrl: 'https://platform.kimi.com/console/account',
  });
}
