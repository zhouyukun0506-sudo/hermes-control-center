import { createBrowserFrame } from './browser_frame.js';

export function renderIframeGemini(container) {
  createBrowserFrame(container, {
    startUrl: 'https://gemini.google.com/',
  });
}
