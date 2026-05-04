import { createBrowserFrame } from './browser_frame.js';

export function renderIframe(container) {
  createBrowserFrame(container, {
    startUrl: 'https://platform.xiaomimimo.com/console/plan-manage?userId=2603178785',
  });
}
