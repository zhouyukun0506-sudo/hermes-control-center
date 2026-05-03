// ── Chat Component ──
import { icons } from '../utils/icons.js';
import { renderMarkdown } from '../utils/markdown.js';
import { createSSE } from '../utils/sse.js';
import * as api from '../api.js';

let currentSession = null;
let sessionsList = [];
let streamSSE = null;
let approvalSSE = null;
let isStreaming = false;
let pendingApprovals = [];

export function renderChat(container, { status }) {
  if (!status?.webui_running) {
    container.innerHTML = `
      <div class="page">
        <div class="empty-state">
          ${icons.chat}
          <h3>Hermes 未运行</h3>
          <p>请先在仪表盘启动 Hermes 服务</p>
        </div>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="chat-layout">
      <div class="chat-sidebar">
        <div class="chat-sidebar-header">
          <button class="btn btn-primary" id="new-session-btn" style="flex:1;">
            ${icons.plus} 新会话
          </button>
        </div>
        <div class="chat-list" id="chat-list"></div>
      </div>
      <div class="chat-main">
        <div class="chat-messages" id="chat-messages">
          <div class="empty-state">
            ${icons.chat}
            <h3>开始对话</h3>
            <p>选择或创建一个会话</p>
          </div>
        </div>
        <div class="chat-input-area" id="chat-input-area" style="display:none;">
          <div id="approval-panel"></div>
          <div class="chat-input-wrap">
            <textarea class="chat-input" id="chat-input" placeholder="输入消息..." rows="1"></textarea>
            <button class="chat-send-btn" id="chat-send-btn">${icons.send}</button>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:11px; color:var(--text-muted);">
            <span id="chat-token-info"></span>
            <span id="chat-stream-status"></span>
          </div>
        </div>
      </div>
    </div>`;

  loadSessions(container);
  bindEvents(container);
}

async function loadSessions(container) {
  try {
    const data = await api.sessions.list();
    sessionsList = data.sessions || [];
    renderSessionList(container);
  } catch (e) {
    console.error('Failed to load sessions:', e);
  }
}

function renderSessionList(container) {
  const list = container.querySelector('#chat-list');
  if (!list) return;

  if (sessionsList.length === 0) {
    list.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted); font-size:12px;">暂无会话</div>`;
    return;
  }

  list.innerHTML = sessionsList.slice(0, 50).map((s) => {
    const active = currentSession?.session_id === s.session_id;
    const time = s.updated_at ? new Date(s.updated_at * 1000).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    return `
      <div class="chat-list-item ${active ? 'active' : ''}" data-sid="${s.session_id}">
        <div class="chat-list-title">${escapeHtml(s.title || 'Untitled')}</div>
        <div class="chat-list-meta">${time} · ${s.message_count || 0} 消息</div>
      </div>`;
  }).join('');

  list.querySelectorAll('.chat-list-item').forEach((el) => {
    el.addEventListener('click', () => selectSession(el.dataset.sid, container));
  });
}

async function selectSession(sid, container) {
  // Cleanup old SSE
  if (streamSSE) { streamSSE.close(); streamSSE = null; }
  if (approvalSSE) { approvalSSE.close(); approvalSSE = null; }

  try {
    const data = await api.sessions.get(sid);
    currentSession = data.session;
    renderSessionList(container);
    renderMessages(container);
    container.querySelector('#chat-input-area').style.display = '';

    // Start approval SSE
    startApprovalSSE(container);

    // Check for active stream
    if (currentSession.active_stream_id) {
      startStreamSSE(currentSession.active_stream_id, container);
    }
  } catch (e) {
    console.error('Failed to load session:', e);
  }
}

function renderMessages(container) {
  const msgArea = container.querySelector('#chat-messages');
  if (!msgArea || !currentSession) return;

  const msgs = currentSession.messages || [];
  if (msgs.length === 0) {
    msgArea.innerHTML = `<div class="empty-state"><h3>空会话</h3><p>发送第一条消息开始对话</p></div>`;
    return;
  }

  let totalTokens = 0;
  msgArea.innerHTML = msgs.map((m) => {
    const role = m.role || 'unknown';
    const isUser = role === 'user';
    const content = typeof m.content === 'string' ? m.content : (m.content || []).map(c => c.text || '').join('');
    const tokens = m.usage?.total_tokens || m.usage?.output_tokens || 0;
    totalTokens += tokens;

    // Handle tool calls
    if (role === 'tool' || m.tool_calls) {
      return `<div class="chat-msg assistant">
        <div class="chat-msg-role">🔧 工具调用</div>
        <div class="chat-msg-body" style="font-size:12px; font-family:var(--font-mono);">
          ${renderMarkdown(content.slice(0, 500))}
        </div>
      </div>`;
    }

    return `
      <div class="chat-msg ${isUser ? 'user' : 'assistant'}">
        <div class="chat-msg-role">${isUser ? '👤 你' : '🤖 Hermes'}${tokens ? ` · ${tokens} tokens` : ''}</div>
        <div class="chat-msg-body">${renderMarkdown(content)}</div>
      </div>`;
  }).join('');

  // Update token info
  const tokenInfo = container.querySelector('#chat-token-info');
  if (tokenInfo) tokenInfo.textContent = `总计: ${totalTokens.toLocaleString()} tokens`;

  msgArea.scrollTop = msgArea.scrollHeight;
}

function bindEvents(container) {
  // New session
  container.querySelector('#new-session-btn')?.addEventListener('click', async () => {
    try {
      const data = await api.sessions.create({});
      await loadSessions(container);
      selectSession(data.session.session_id, container);
    } catch (e) {
      console.error('Failed to create session:', e);
    }
  });

  // Send message
  const input = container.querySelector('#chat-input');
  const sendBtn = container.querySelector('#chat-send-btn');

  const doSend = async () => {
    if (!currentSession || isStreaming) return;
    const msg = input.value.trim();
    if (!msg) return;

    input.value = '';
    input.style.height = 'auto';

    // Optimistic add
    currentSession.messages = currentSession.messages || [];
    currentSession.messages.push({ role: 'user', content: msg });
    renderMessages(container);

    try {
      isStreaming = true;
      updateStreamStatus(container, '发送中...');
      const result = await api.chat.start(currentSession.session_id, msg);
      startStreamSSE(result.stream_id, container);
    } catch (e) {
      isStreaming = false;
      updateStreamStatus(container, `错误: ${e.message}`);
    }
  };

  sendBtn?.addEventListener('click', doSend);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  });

  // Auto-resize textarea
  input?.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 160) + 'px';
  });
}

function startStreamSSE(streamId, container) {
  if (streamSSE) streamSSE.close();
  isStreaming = true;
  updateStreamStatus(container, '接收中...');

  // Add typing indicator
  const msgArea = container.querySelector('#chat-messages');
  let typingEl = document.createElement('div');
  typingEl.id = 'typing-indicator';
  typingEl.className = 'chat-msg assistant';
  typingEl.innerHTML = `
    <div class="chat-msg-role">🤖 Hermes</div>
    <div class="chat-msg-body">
      <div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>
    </div>`;
  msgArea?.appendChild(typingEl);
  msgArea.scrollTop = msgArea.scrollHeight;

  let assistantContent = '';

  streamSSE = createSSE(`/api/chat/stream?stream_id=${streamId}`, {
    onMessage: (data) => {
      if (data.type === 'token' || data.type === 'content') {
        assistantContent += data.content || data.token || '';
        // Update typing indicator with content
        const body = typingEl.querySelector('.chat-msg-body');
        if (body) body.innerHTML = renderMarkdown(assistantContent);
        msgArea.scrollTop = msgArea.scrollHeight;
      } else if (data.type === 'done' || data.type === 'complete' || data.type === 'end') {
        finishStream(container, assistantContent, data);
      } else if (data.type === 'error') {
        finishStream(container, assistantContent || `错误: ${data.error || 'unknown'}`, data);
      } else if (data.type === 'tool_call' || data.type === 'tool_start') {
        updateStreamStatus(container, `🔧 ${data.name || data.tool || 'tool'}...`);
      } else if (data.type === 'approval_required') {
        updateStreamStatus(container, '⏳ 等待审批...');
      }
    },
    onError: () => {
      // SSE reconnect will handle it
    },
  });
}

function finishStream(container, content, data) {
  isStreaming = false;
  if (streamSSE) { streamSSE.close(); streamSSE = null; }

  // Remove typing indicator
  const typing = container.querySelector('#typing-indicator');
  if (typing) typing.remove();

  // Add assistant message
  if (currentSession && content) {
    currentSession.messages.push({
      role: 'assistant',
      content,
      usage: data?.usage || {},
    });
    renderMessages(container);
  }

  updateStreamStatus(container, '');

  // Reload session to get accurate data
  if (currentSession) {
    api.sessions.get(currentSession.session_id).then((d) => {
      currentSession = d.session;
      renderMessages(container);
    }).catch(() => {});
  }
}

function startApprovalSSE(container) {
  if (!currentSession) return;
  if (approvalSSE) approvalSSE.close();

  approvalSSE = createSSE(`/api/approval/stream?session_id=${currentSession.session_id}`, {
    onMessage: (data) => {
      if (data.approval || data.pending) {
        renderApproval(container, data.approval || data.pending || data);
      }
    },
  });
}

function renderApproval(container, approval) {
  const panel = container.querySelector('#approval-panel');
  if (!panel) return;

  if (!approval || (!approval.message && !approval.command)) {
    panel.innerHTML = '';
    return;
  }

  const cmd = approval.command || approval.message || JSON.stringify(approval);
  const approvalId = approval.approval_id || '';

  panel.innerHTML = `
    <div class="approval-card">
      <div class="approval-card-header">${icons.shield} 需要审批</div>
      <div class="approval-cmd">${escapeHtml(typeof cmd === 'string' ? cmd : JSON.stringify(cmd, null, 2))}</div>
      <div class="approval-actions">
        <button class="btn btn-success" data-action="approve">
          ${icons.check} 批准
        </button>
        <button class="btn btn-danger" data-action="reject">
          ${icons.x} 拒绝
        </button>
      </div>
    </div>`;

  panel.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await api.approval.respond(currentSession.session_id, btn.dataset.action, approvalId);
        panel.innerHTML = '';
      } catch (e) {
        console.error('Approval error:', e);
      }
    });
  });
}

function updateStreamStatus(container, text) {
  const el = container.querySelector('#chat-stream-status');
  if (el) el.textContent = text;
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function cleanupChat() {
  if (streamSSE) { streamSSE.close(); streamSSE = null; }
  if (approvalSSE) { approvalSSE.close(); approvalSSE = null; }
  isStreaming = false;
}
