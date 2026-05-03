// ── Skills Management ──
import { icons } from '../utils/icons.js';
import { renderMarkdown } from '../utils/markdown.js';
import * as api from '../api.js';

let selectedSkill = null;
let editing = false;
let editContent = '';

export function renderSkills(container, { status }) {
  if (!status?.webui_running) {
    container.innerHTML = `<div class="page"><div class="empty-state">${icons.skills}<h3>Hermes 未运行</h3><p>请先启动服务</p></div></div>`;
    return;
  }

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">技能管理</h1>
        <p class="page-subtitle">查看和管理 Hermes Agent 的技能</p>
      </div>
      <div id="skills-content"></div>
      <div id="skill-detail" style="display:none;"></div>
    </div>`;

  loadSkills(container);
}

async function loadSkills(container) {
  const area = container.querySelector('#skills-content');
  try {
    const data = await api.skills.list();
    const skills = data.skills || [];

    if (skills.length === 0) {
      area.innerHTML = '<div class="empty-state"><h3>暂无技能</h3><p>技能会在 Agent 使用过程中自动创建</p></div>';
      return;
    }

    area.innerHTML = `<div class="grid-3">${skills.map((s) => `
      <div class="skill-card" data-skill="${s.name || s}">
        <div class="skill-name">${icons.skills} ${s.name || s}</div>
        <div class="skill-desc">${s.description || s.summary || '无描述'}</div>
        ${s.file_count ? `<div style="font-size:11px; color:var(--text-muted); margin-top:8px;">${s.file_count} 个文件</div>` : ''}
      </div>
    `).join('')}</div>`;

    area.querySelectorAll('.skill-card').forEach((el) => {
      el.addEventListener('click', () => viewSkill(el.dataset.skill, container));
    });
  } catch (e) {
    area.innerHTML = `<div style="color:var(--accent-red);">加载失败: ${e.message}</div>`;
  }
}

async function viewSkill(name, container) {
  const detail = container.querySelector('#skill-detail');
  const list = container.querySelector('#skills-content');
  list.style.display = 'none';
  detail.style.display = '';

  try {
    const data = await api.skills.view(name);
    selectedSkill = { name, ...data };
    editing = false;
    editContent = data.content || '';

    detail.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">${icons.skills} ${name}</div>
          <div style="display:flex; gap:8px;">
            <button class="btn" id="skill-back">${icons.arrowLeft} 返回</button>
            <button class="btn btn-primary" id="skill-edit">${icons.edit} 编辑</button>
            <button class="btn btn-danger" id="skill-delete">${icons.trash} 删除</button>
          </div>
        </div>
        <div id="skill-body">
          <div style="font-family:var(--font-mono); font-size:13px; line-height:1.6; white-space:pre-wrap; background:rgba(0,0,0,0.2); padding:16px; border-radius:var(--radius-sm); max-height:500px; overflow:auto;">${escapeHtml(data.content || '(空)')}</div>
        </div>
      </div>`;

    detail.querySelector('#skill-back')?.addEventListener('click', () => {
      detail.style.display = 'none';
      list.style.display = '';
      selectedSkill = null;
    });

    detail.querySelector('#skill-edit')?.addEventListener('click', () => {
      const body = detail.querySelector('#skill-body');
      body.innerHTML = `
        <textarea class="textarea" id="skill-editor" style="min-height:300px; font-family:var(--font-mono); font-size:13px;">${escapeHtml(editContent)}</textarea>
        <div style="margin-top:12px; display:flex; gap:8px; justify-content:flex-end;">
          <button class="btn btn-success" id="skill-save">${icons.save} 保存</button>
        </div>`;

      body.querySelector('#skill-save')?.addEventListener('click', async () => {
        const content = body.querySelector('#skill-editor').value;
        try {
          await api.skills.save(name, content, {});
          viewSkill(name, container);
        } catch (e) { alert('保存失败: ' + e.message); }
      });
    });

    detail.querySelector('#skill-delete')?.addEventListener('click', async () => {
      if (confirm(`确认删除技能 "${name}"？`)) {
        try {
          await api.skills.delete(name);
          detail.style.display = 'none';
          list.style.display = '';
          loadSkills(container);
        } catch (e) { alert('删除失败: ' + e.message); }
      }
    });
  } catch (e) {
    detail.innerHTML = `<div style="color:var(--accent-red);">加载失败: ${e.message}</div>`;
  }
}

function escapeHtml(str) { return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
