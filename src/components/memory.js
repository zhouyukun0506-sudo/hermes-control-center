// ── Memory Viewer Component ──
import * as api from '../api.js';

export async function renderMemory(container) {
  container.innerHTML = `
    <div class="page page-padded">
      <div style="max-width: 740px;">
        <div class="page-header">
          <h1 class="page-title">Memory</h1>
          <p class="page-subtitle">Agent's persistent knowledge base. Contents are injected into every session.</p>
        </div>

        <textarea id="memory-editor" style="width: 100%; min-height: 300px; background: var(--fill-quinary); border: 0.5px solid var(--fill-quaternary);
                 border-radius: 10px; padding: 20px; color: var(--text-main); font-size: 14px; line-height: 1.7;
                 font-family: inherit; outline: none; resize: vertical;"></textarea>

        <div style="display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end; align-items: center;">
          <span id="memory-status" style="font-size: 12px; color: var(--text-muted);"></span>
          <button id="memory-save-btn" style="background: var(--accent-gradient); color: #fff; border: none; border-radius: 8px;
                  padding: 10px 24px; font-weight: 600; font-size: 14px; cursor: pointer;">
            Save
          </button>
        </div>
      </div>
    </div>
  `;

  const editor = container.querySelector('#memory-editor');
  const saveBtn = container.querySelector('#memory-save-btn');
  const statusEl = container.querySelector('#memory-status');

  try {
    const data = await api.memory.read();
    const content = data.memory || data.content || data.data || '';
    editor.value = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    statusEl.textContent = 'Loaded';
  } catch {
    statusEl.textContent = 'Offline';
    editor.placeholder = 'WebUI backend is not running. Memory cannot be loaded.';
  }

  saveBtn.addEventListener('click', async () => {
    const content = editor.value.trim();
    if (!content) return;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    statusEl.textContent = '';
    try {
      await api.memory.write('memory', content);
      statusEl.textContent = 'Saved ✓';
    } catch {
      statusEl.textContent = 'Save failed';
    }
    saveBtn.textContent = 'Save';
    saveBtn.disabled = false;
  });
}
