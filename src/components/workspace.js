// ── Workspace & File Browser ──
import { icons } from '../utils/icons.js';
import * as api from '../api.js';

let currentWorkspace = '';
let currentPath = '';
let fileContent = null;

export function renderWorkspace(container, { status }) {
  if (!status?.webui_running) {
    container.innerHTML = `<div class="page"><div class="empty-state">${icons.folder}<h3>Hermes 未运行</h3><p>请先启动服务</p></div></div>`;
    return;
  }

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">工作区</h1>
        <p class="page-subtitle">管理工作区与浏览文件</p>
      </div>
      <div class="card" style="margin-bottom:16px;">
        <div class="card-header">
          <div class="card-title">工作区列表</div>
          <button class="btn btn-primary" id="add-ws-btn">${icons.plus} 添加</button>
        </div>
        <div id="ws-list"></div>
      </div>
      <div class="card" id="file-browser-card" style="display:none;">
        <div class="card-header">
          <div class="card-title" id="file-path-display"></div>
          <button class="btn" id="file-back-btn">${icons.arrowLeft} 返回</button>
        </div>
        <div id="file-content-area"></div>
      </div>
    </div>`;

  loadWorkspaces(container);

  container.querySelector('#add-ws-btn')?.addEventListener('click', async () => {
    const path = prompt('输入工作区路径:');
    if (path) {
      try { await api.workspaces.add(path); loadWorkspaces(container); } catch (e) { alert(e.message); }
    }
  });

  container.querySelector('#file-back-btn')?.addEventListener('click', () => {
    if (fileContent !== null) {
      fileContent = null;
      browseDir(currentPath, container);
    } else if (currentPath && currentPath !== currentWorkspace) {
      const parent = currentPath.split('/').slice(0, -1).join('/');
      browseDir(parent || currentWorkspace, container);
    }
  });
}

async function loadWorkspaces(container) {
  try {
    const data = await api.workspaces.list();
    const list = container.querySelector('#ws-list');
    const wsList = data.workspaces || [];

    if (wsList.length === 0) {
      list.innerHTML = '<div style="padding:12px; color:var(--text-muted); font-size:13px;">暂无工作区</div>';
      return;
    }

    list.innerHTML = wsList.map((w) => `
      <div class="file-item dir" data-path="${w.path || w}" style="justify-content:space-between;">
        <div style="display:flex; align-items:center; gap:8px;">
          ${icons.folder}
          <span>${w.name || w.path || w}</span>
        </div>
        <button class="btn btn-danger" data-remove="${w.path || w}" style="padding:4px 8px; font-size:11px;">删除</button>
      </div>
    `).join('');

    list.querySelectorAll('.file-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-remove]')) return;
        const path = el.dataset.path;
        currentWorkspace = path;
        currentPath = path;
        browseDir(path, container);
      });
    });

    list.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('确认删除此工作区？')) {
          try { await api.workspaces.remove(btn.dataset.remove); loadWorkspaces(container); } catch (e) { alert(e.message); }
        }
      });
    });
  } catch (e) {
    console.error('Failed to load workspaces:', e);
  }
}

async function browseDir(dirPath, container) {
  const card = container.querySelector('#file-browser-card');
  const area = container.querySelector('#file-content-area');
  const pathDisplay = container.querySelector('#file-path-display');
  card.style.display = '';
  currentPath = dirPath;
  fileContent = null;
  pathDisplay.textContent = dirPath;

  try {
    const data = await api.files.list(dirPath, currentWorkspace);
    const items = data.items || data.files || [];

    area.innerHTML = `<div class="file-tree">${items.map((f) => {
      const isDir = f.is_dir || f.type === 'directory';
      const name = f.name || f.path?.split('/').pop() || '';
      const size = f.size ? formatSize(f.size) : '';
      return `
        <div class="file-item ${isDir ? 'dir' : ''}" data-fpath="${f.path || ''}" data-isdir="${isDir}">
          ${isDir ? icons.folder : icons.file}
          <span style="flex:1;">${name}</span>
          <span style="font-size:11px; color:var(--text-muted);">${size}</span>
        </div>`;
    }).join('')}</div>`;

    area.querySelectorAll('.file-item').forEach((el) => {
      el.addEventListener('click', () => {
        if (el.dataset.isdir === 'true') {
          browseDir(el.dataset.fpath, container);
        } else {
          viewFile(el.dataset.fpath, container);
        }
      });
    });
  } catch (e) {
    area.innerHTML = `<div style="padding:12px; color:var(--error-color);">加载失败: ${e.message}</div>`;
  }
}

async function viewFile(filePath, container) {
  const area = container.querySelector('#file-content-area');
  const pathDisplay = container.querySelector('#file-path-display');
  pathDisplay.textContent = filePath;
  fileContent = filePath;

  try {
    const data = await api.files.read(filePath, currentWorkspace);
    const content = data.content || '';
    area.innerHTML = `<pre style="background:var(--fill-quinary); border:0.5px solid var(--fill-quaternary); border-radius:8px; padding:16px; font-family:var(--font-mono); font-size:12.5px; line-height:1.5; overflow:auto; max-height:600px; white-space:pre-wrap;">${escapeHtml(content)}</pre>`;
  } catch (e) {
    area.innerHTML = `<div style="padding:12px; color:var(--error-color);">无法读取: ${e.message}</div>`;
  }
}

function escapeHtml(str) { return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
