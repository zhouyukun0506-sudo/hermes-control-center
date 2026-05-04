import { createBrowserFrame } from './browser_frame.js';

export function renderIframeDeepSeek(container) {
  createBrowserFrame(container, {
    startUrl: 'https://platform.deepseek.com/sign_in',
  });
}
