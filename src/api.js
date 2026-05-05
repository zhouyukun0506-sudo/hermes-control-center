// ── Workbench — API Client ──

const BASE = '';

async function fetchJSON(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function postJSON(path, body) {
  return fetchJSON(path, { method: 'POST', body: JSON.stringify(body) });
}

// Stream SSE from a POST endpoint (hermes-up / hermes-kill)
function streamPost(path, onData) {
  return new Promise((resolve, reject) => {
    fetch(`${BASE}${path}`, { method: 'POST' }).then((res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      function pump() {
        reader.read().then(({ done, value }) => {
          if (done) { resolve(); return; }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                onData(data);
                if (data.type === 'done') { resolve(data.data); return; }
              } catch {}
            }
          }
          pump();
        }).catch(reject);
      }
      pump();
    }).catch(reject);
  });
}

export const ctrl = {
  status: () => fetchJSON('/ctrl/status'),
  start: (onData) => streamPost('/ctrl/start', onData),
  startWebUI: (onData) => streamPost('/ctrl/start-webui', onData),
  stop: (onData) => streamPost('/ctrl/stop', onData),
  exec: (command) => postJSON('/ctrl/exec', { command }),
  openclaw: () => fetchJSON('/ctrl/openclaw/status'),
  startOpenclaw: (onData) => streamPost('/ctrl/openclaw/start', onData),
  stopOpenclaw: (onData) => streamPost('/ctrl/openclaw/stop', onData),
  quit: () => fetch(`${BASE}/ctrl/quit`, { method: 'POST' }).then(r => r.json()),
};

export const sessions = {
  list: () => fetchJSON('/api/sessions'),
  get: (id) => fetchJSON(`/api/session?session_id=${id}&msg_limit=50`),
  create: (opts = {}) => postJSON('/api/session/new', opts),
  delete: (id) => postJSON('/api/session/delete', { session_id: id }),
  rename: (id, title) => postJSON('/api/session/rename', { session_id: id, title }),
  clear: (id) => postJSON('/api/session/clear', { session_id: id }),
};

export const chat = {
  start: (sessionId, message, opts = {}) =>
    postJSON('/api/chat/start', { session_id: sessionId, message, ...opts }),
  cancel: (streamId) => fetchJSON(`/api/chat/cancel?stream_id=${streamId}`),
  streamStatus: (streamId) => fetchJSON(`/api/chat/stream/status?stream_id=${streamId}`),
};

export const approval = {
  pending: (sessionId) => fetchJSON(`/api/approval/pending?session_id=${sessionId}`),
  respond: (sessionId, action, approvalId) =>
    postJSON('/api/approval/respond', { session_id: sessionId, action, approval_id: approvalId }),
};

export const skills = {
  list: () => fetchJSON('/api/skills'),
  view: (name) => fetchJSON(`/api/skills/content?name=${encodeURIComponent(name)}`),
  save: (name, content, linked) =>
    postJSON('/api/skills/save', { name, content, linked_files: linked }),
  delete: (name) => postJSON('/api/skills/delete', { name }),
};

export const memory = {
  read: () => fetchJSON('/api/memory'),
  write: (section, content) => postJSON('/api/memory/write', { section, content }),
};

export const workspaces = {
  list: () => fetchJSON('/api/workspaces'),
  add: (path) => postJSON('/api/workspaces/add', { path }),
  remove: (path) => postJSON('/api/workspaces/remove', { path }),
};

export const files = {
  list: (dir, wsPath) =>
    fetchJSON(`/api/list?path=${encodeURIComponent(dir)}&workspace=${encodeURIComponent(wsPath || dir)}`),
  read: (path, wsPath) =>
    fetchJSON(`/api/file?path=${encodeURIComponent(path)}&workspace=${encodeURIComponent(wsPath || '')}`),
};

export const models = {
  list: () => fetchJSON('/api/models'),
};

export const insights = {
  get: (days = 30) => fetchJSON(`/api/insights?days=${days}`),
};

export const settings = {
  get: () => fetchJSON('/api/settings'),
  save: (data) => postJSON('/api/settings', data),
};

export const health = {
  check: () => fetchJSON('/health'),
};
