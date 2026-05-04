// ── Global Chat Panel (⌘.) ──
import { icons } from '../utils/icons.js';
import { renderMarkdown } from '../utils/markdown.js';
import { createSSE } from '../utils/sse.js';
import * as api from '../api.js';

let panel = null;
let currentSession = null;
let sessionsList = [];
let streamSSE = null;
let isStreaming = false;

export function initGlobalChat() {
  panel = document.createElement('div');
  panel.id = 'global-chat-panel';
  panel.style.cssText = `
    position: fixed; top: 0; right: 0; width: 420px; max-width: 100vw; height: 100vh;
    z-index: 950; display: flex; flex-direction: column;
    background: var(--glass-bg-dark);
    backdrop-filter: blur(25px) saturate(180%);
    -webkit-backdrop-filter: blur(25px) saturate(180%);
    border-left: 0.5px solid rgba(255,255,255,0.08);
    box-shadow: -8px 0 32px rgba(0,0,0,0.3);
    transform: translateX(100%); transition: transform .25s cubic-bezier(0.4, 0, 0.2, 1);
  `;

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:0.5px solid rgba(255,255,255,0.06);flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="width:6px;height:6px;border-radius:50%;background:var(--accent);display:inline-block;"></span>
        <span style="font-weight:700;font-size:14px;color:var(--text-main);">Global Chat</span>
      </div>
      <div style="display:flex;gap:6px;">
        <span style="font-size:10px;color:var(--text-tertiary);padding:2px 6px;border-radius:4px;background:var(--fill-quinary);">⌘.</span>
        <button id="gc-close" style="width:26px;height:26px;border:none;border-radius:6px;background:var(--fill-quinary);color:var(--text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;border-bottom:0.5px solid rgba(255,255,255,0.04);flex-shrink:0;">
      <select id="gc-session-select" style="flex:1;background:var(--fill-quinary);border:0.5px solid var(--fill-quaternary);border-radius:8px;padding:6px 10px;color:var(--text-main);font-size:12px;font-family:inherit;outline:none;cursor:pointer;">
        <option value="">-- Select session --</option>
      </select>
      <button id="gc-new-session" style="width:30px;height:30px;border:none;border-radius:8px;background:var(--accent-bg);color:var(--accent);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .12s;" title="New Session">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>
    <div id="gc-messages" style="flex:1;overflow-y:auto;padding:12px 16px;">
      <div style="text-align:center;padding:40px 20px;color:var(--text-tertiary);font-size:13px;">
        Select a session or create a new one to start chatting.
      </div>
    </div>
    <div id="gc-input-area" style="padding:10px 16px 14px;border-top:0.5px solid rgba(255,255,255,0.04);flex-shrink:0;display:none;">
      <div id="gc-stream-status" style="font-size:10px;color:var(--text-tertiary);margin-bottom:4px;min-height:14px;"></div>
      <div style="display:flex;gap:8px;align-items:flex-end;">
        <textarea id="gc-input" placeholder="Type a message..." rows="1"
          style="flex:1;background:var(--fill-quinary);border:0.5px solid var(--fill-quaternary);border-radius:10px;padding:8px 12px;
                 color:var(--text-main);font-size:13px;font-family:inherit;outline:none;resize:none;max-height:120px;line-height:1.4;">
        </textarea>
        <button id="gc-send" style="width:34px;height:34px;border:none;border-radius:10px;background:var(--accent);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .12s;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  // Background overlay
  const overlay = document.createElement('div');
  overlay.id = 'gc-overlay';
  overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:949;background:rgba(0,0,0,0.3);opacity:0;transition:opacity .25s;';
  overlay.addEventListener('click', close);
  document.body.prepend(overlay);

  // Close button
  panel.querySelector('#gc-close').addEventListener('click', close);

  // Session selector
  panel.querySelector('#gc-session-select').addEventListener('change', (e) => {
    if (e.target.value) selectSession(e.target.value);
  });

  // New session
  panel.querySelector('#gc-new-session').addEventListener('click', createNewSession);

  // Send message
  const input = panel.querySelector('#gc-input');
  const sendBtn = panel.querySelector('#gc-send');

  const doSend = async () => {
    if (!currentSession || isStreaming) return;
    const msg = input.value.trim();
    if (!msg) return;

    input.value = '';
    input.style.height = 'auto';

    currentSession.messages = currentSession.messages || [];
    currentSession.messages.push({ role: 'user', content: msg });
    renderMessages();

    try {
      isStreaming = true;
      updateStatus('Sending...');
      const result = await api.chat.start(currentSession.session_id, msg);
      if (result.stream_id) {
        startStreamSSE(result.stream_id);
      } else {
        // No streaming — reload session to get response
        const data = await api.sessions.get(currentSession.session_id);
        currentSession = data.session;
        renderMessages();
        isStreaming = false;
        updateStatus('');
      }
    } catch (e) {
      isStreaming = false;
      updateStatus(`Error: ${e.message}`);
    }
  };

  sendBtn.addEventListener('click', doSend);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  // Expose open/close
  window.__openGlobalChat = open;
}

function open() {
  const overlay = document.getElementById('gc-overlay');
  if (overlay) {
    overlay.style.display = 'block';
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });
  }
  panel.style.transform = 'translateX(0)';
  loadSessions();
}

function close() {
  panel.style.transform = 'translateX(100%)';
  const overlay = document.getElementById('gc-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 250);
  }
  // Cleanup SSE
  if (streamSSE) { streamSSE.close(); streamSSE = null; }
  isStreaming = false;
}

async function loadSessions() {
  try {
    const data = await api.sessions.list();
    sessionsList = Array.isArray(data) ? data : (data.sessions || data.data || []);
    renderSessionSelect();
  } catch {
    sessionsList = [];
    renderSessionSelect();
  }
}

function renderSessionSelect() {
  const select = panel.querySelector('#gc-session-select');
  if (!select) return;

  const currentId = currentSession?.session_id || '';
  select.innerHTML = `
    <option value="">-- Select session --</option>
    ${sessionsList.map(s => {
      const id = s.session_id || s.id || '';
      const title = s.title || s.name || 'Untitled';
      return `<option value="${esc(id)}" ${id === currentId ? 'selected' : ''}>${esc(title)}</option>`;
    }).join('')}
  `;

  if (!currentId && sessionsList.length > 0) {
    selectSession(sessionsList[0].session_id || sessionsList[0].id);
  }
}

async function selectSession(sid) {
  if (!sid) return;

  if (streamSSE) { streamSSE.close(); streamSSE = null; }
  isStreaming = false;

  try {
    const data = await api.sessions.get(sid);
    currentSession = data.session || data;
    renderSessionSelect();
    renderMessages();

    const inputArea = panel.querySelector('#gc-input-area');
    if (inputArea) inputArea.style.display = '';

    // Check for active stream
    if (currentSession.active_stream_id) {
      startStreamSSE(currentSession.active_stream_id);
    }
  } catch (e) {
    updateStatus(`Error loading session: ${e.message}`);
  }
}

async function createNewSession() {
  try {
    const data = await api.sessions.create({});
    const sid = data.session?.session_id || data.session_id;
    await loadSessions();
    if (sid) selectSession(sid);
  } catch (e) {
    updateStatus(`Error: ${e.message}`);
  }
}

function renderMessages() {
  const msgArea = panel.querySelector('#gc-messages');
  if (!msgArea || !currentSession) return;

  const msgs = currentSession.messages || [];
  if (msgs.length === 0) {
    msgArea.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--text-tertiary);font-size:13px;">Send a message to start the conversation.</div>`;
    return;
  }

  msgArea.innerHTML = msgs.map((m) => {
    const role = m.role || 'unknown';
    const isUser = role === 'user';
    const content = typeof m.content === 'string' ? m.content : (m.content || []).map(c => c.text || '').join('');
    const tokens = m.usage?.total_tokens || m.usage?.output_tokens || 0;

    if (role === 'tool' || m.tool_calls) {
      return `<div class="chat-msg assistant" style="opacity:0.6;">
        <div class="chat-msg-role" style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-tertiary);margin-bottom:4px;">🔧 Tool Call</div>
        <div class="chat-msg-body" style="font-size:12px;font-family:var(--font-mono);">${renderMarkdown(content.slice(0, 500))}</div>
      </div>`;
    }

    return `
      <div class="chat-msg ${isUser ? 'user' : 'assistant'}" style="margin-bottom:12px;">
        <div class="chat-msg-role" style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-tertiary);margin-bottom:4px;">
          ${isUser ? '👤 You' : '🤖 Workbench'}${tokens ? ` · ${tokens} tok` : ''}
        </div>
        <div class="chat-msg-body" style="font-size:13px;line-height:1.5;color:var(--text-main);">${renderMarkdown(content)}</div>
      </div>`;
  }).join('');

  msgArea.scrollTop = msgArea.scrollHeight;
}

function startStreamSSE(streamId) {
  if (streamSSE) streamSSE.close();
  isStreaming = true;
  updateStatus('Receiving...');

  const msgArea = panel.querySelector('#gc-messages');
  const typingEl = document.createElement('div');
  typingEl.id = 'gc-typing';
  typingEl.className = 'chat-msg assistant';
  typingEl.style.cssText = 'margin-bottom:12px;';
  typingEl.innerHTML = `
    <div class="chat-msg-role" style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-tertiary);margin-bottom:4px;">🤖 Workbench</div>
    <div class="chat-msg-body" style="font-size:13px;line-height:1.5;color:var(--text-main);">
      <div class="typing-indicator"><span style="display:inline-flex;gap:3px;"><span style="width:4px;height:4px;border-radius:50%;background:var(--text-muted);animation:dotPulse 1.4s infinite;"></span><span style="width:4px;height:4px;border-radius:50%;background:var(--text-muted);animation:dotPulse 1.4s infinite;animation-delay:0.2s;"></span><span style="width:4px;height:4px;border-radius:50%;background:var(--text-muted);animation:dotPulse 1.4s infinite;animation-delay:0.4s;"></span></span></div>
    </div>`;
  msgArea?.appendChild(typingEl);
  msgArea.scrollTop = msgArea.scrollHeight;

  let assistantContent = '';

  streamSSE = createSSE(`/api/chat/stream?stream_id=${streamId}`, {
    onMessage: (data) => {
      if (data.type === 'token' || data.type === 'content') {
        assistantContent += data.content || data.token || '';
        const body = typingEl.querySelector('.chat-msg-body');
        if (body) body.innerHTML = renderMarkdown(assistantContent);
        msgArea.scrollTop = msgArea.scrollHeight;
      } else if (data.type === 'done' || data.type === 'complete' || data.type === 'end') {
        finishStream(assistantContent, data);
      } else if (data.type === 'error') {
        finishStream(assistantContent || `Error: ${data.error || 'unknown'}`, data);
      } else if (data.type === 'tool_call' || data.type === 'tool_start') {
        updateStatus(`🔧 ${data.name || data.tool || 'tool'}...`);
      }
    },
    onError: () => {},
  });
}

function finishStream(content, data) {
  isStreaming = false;
  if (streamSSE) { streamSSE.close(); streamSSE = null; }

  const typing = panel.querySelector('#gc-typing');
  if (typing) typing.remove();

  if (currentSession && content) {
    currentSession.messages.push({
      role: 'assistant',
      content,
      usage: data?.usage || {},
    });
    renderMessages();
  }

  updateStatus('');

  // Reload session for accurate data
  if (currentSession) {
    api.sessions.get(currentSession.session_id).then((d) => {
      currentSession = d.session || d;
      renderMessages();
    }).catch(() => {});
  }
}

function updateStatus(text) {
  const el = panel.querySelector('#gc-stream-status');
  if (el) el.textContent = text;
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
