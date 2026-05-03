// ── Memory Viewer/Editor ──
import { icons } from '../utils/icons.js';
import { renderMarkdown } from '../utils/markdown.js';
import * as api from '../api.js';

let editing = false;

export function renderMemory(container, { status }) {
  if (!status?.webui_running) {
    container.innerHTML = `<div class="page"><div class="empty-state">${icons.memory}<h3>Hermes 未运行</h3><p>请先启动服务</p></div></div>`;
    return;
  }

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">记忆管理</h1>
        <p class="page-subtitle">查看和编辑 Hermes Agent 的长期记忆</p>
      </div>
      <div class="card" id="memory-card">
        <div class="card-header">
          <div class="card-title">${icons.memory} 记忆内容</div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-primary" id="mem-edit">${icons.edit} 编辑</button>
            <button class="btn" id="mem-refresh">${icons.refresh} 刷新</button>
          </div>
        </div>
        <div id="memory-body" style="min-height:200px;">
          <div style="color:var(--text-muted);">加载中...</div>
        </div>
      </div>
    </div>`;

  loadMemory(container);

  container.querySelector('#mem-refresh')?.addEventListener('click', () => loadMemory(container));
  container.querySelector('#mem-edit')?.addEventListener('click', () => toggleEdit(container));
}

async function loadMemory(container) {
  const body = container.querySelector('#memory-body');
  try {
    const data = await api.memory.read();
    const content = data.content || data.memory || '';

    if (!content || content.trim() === '') {
      body.innerHTML = '<div class="empty-state"><p>暂无记忆内容</p></div>';
    } else {
      body.innerHTML = `<div style="line-height:1.7; font-size:13.5px;">${renderMarkdown(content)}</div>`;
    }
    body.dataset.raw = content;
    editing = false;
  } catch (e) {
    body.innerHTML = `<div style="color:var(--accent-red);">加载失败: ${e.message}</div>`;
  }
}

function toggleEdit(container) {
  const body = container.querySelector('#memory-body');
  const editBtn = container.querySelector('#mem-edit');

  if (editing) {
    // Save
    const textarea = body.querySelector('#mem-editor');
    if (textarea) {
      const content = textarea.value;
      api.memory.write(content).then(() => {
        loadMemory(container);
      }).catch((e) => alert('保存失败: ' + e.message));
    }
    editing = false;
    editBtn.innerHTML = `${icons.edit} 编辑`;
  } else {
    // Enter edit mode
    const raw = body.dataset.raw || '';
    body.innerHTML = `
      <textarea class="textarea" id="mem-editor" style="min-height:300px; font-family:var(--font-mono); font-size:13px;">${escapeHtml(raw)}</textarea>
      <div style="margin-top:8px; font-size:11px; color:var(--text-muted);">支持 Markdown 格式</div>`;
    editing = true;
    editBtn.innerHTML = `${icons.save} 保存`;
  }
}

function escapeHtml(str) { return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
