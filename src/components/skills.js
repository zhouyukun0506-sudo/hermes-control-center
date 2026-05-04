// ── Skills Manager Component ──
import * as api from '../api.js';

export async function renderSkills(container) {
  container.innerHTML = `
    <div class="page page-padded">
      <div style="max-width: 900px;">
        <div class="page-header">
          <h1 class="page-title">Skills</h1>
          <p class="page-subtitle">Bash tools and capabilities available to the agent.</p>
        </div>
        <div id="skills-list" style="display: flex; flex-direction: column; gap: 6px;">
          <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 14px;">Loading...</div>
        </div>
      </div>
    </div>
  `;

  // Detail overlay
  const detailOverlay = document.createElement('div');
  detailOverlay.style.cssText = 'display:none; position:fixed; inset:0; z-index:100; background:rgba(0,0,0,.6); align-items:center; justify-content:center;';
  detailOverlay.innerHTML = `
    <div style="background: rgba(0,0,0,0.85); border: 0.5px solid var(--fill-quaternary); border-radius: 16px;
                width: min(720px, 90vw); max-height: 80vh; display: flex; flex-direction: column; overflow: hidden;">
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 18px 24px;
                  border-bottom: 1px solid var(--card-border);">
        <h2 id="skill-detail-title" style="font-size: 18px; font-weight: 700;"></h2>
        <button id="skill-detail-close" style="background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer;">✕</button>
      </div>
      <div id="skill-detail-body" style="flex: 1; overflow-y: auto; padding: 24px; font-family: var(--font-mono); font-size: 12px; line-height: 1.6; white-space: pre-wrap;"></div>
    </div>
  `;
  document.body.appendChild(detailOverlay);
  detailOverlay.querySelector('#skill-detail-close').addEventListener('click', () => detailOverlay.style.display = 'none');
  detailOverlay.addEventListener('click', (e) => { if (e.target === detailOverlay) detailOverlay.style.display = 'none'; });

  const listEl = container.querySelector('#skills-list');

  try {
    const data = await api.skills.list();
    const skills = data.skills || data || [];
    const list = Array.isArray(skills) ? skills : [];

    if (list.length === 0) {
      listEl.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px;">No skills available.</div>';
      return;
    }

    listEl.innerHTML = list.map(skill => {
      const name = typeof skill === 'string' ? skill : skill.name || '';
      const desc = skill.description || '';
      return '\
        <div class="card skill-card" data-name="' + esc(name) + '" \
             style="display: flex; align-items: center; gap: 14px; padding: 14px 20px; cursor: pointer; transition: all .15s;">\
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" \
            stroke-linecap="round" stroke-linejoin="round" style="opacity: .4; flex-shrink: 0;">\
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>\
          <span style="flex: 1; font-size: 14px; font-weight: 600;">' + esc(name) + '</span>\
          ' + (desc ? '<span style="font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 300px;">' + esc(desc) + '</span>' : '') + '\
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" \
            stroke-linecap="round" stroke-linejoin="round" style="opacity: .3; flex-shrink: 0;"><path d="m9 18 6-6-6-6"/></svg>\
        </div>';
    }).join('');

    listEl.querySelectorAll('.skill-card').forEach(card => {
      card.addEventListener('click', async () => {
        const name = card.dataset.name;
        detailOverlay.querySelector('#skill-detail-title').textContent = name;
        detailOverlay.querySelector('#skill-detail-body').textContent = 'Loading...';
        detailOverlay.style.display = 'flex';
        try {
          const data = await api.skills.view(name);
          const content = data.content || data.data || '';
          detailOverlay.querySelector('#skill-detail-body').textContent = content;
        } catch {
          detailOverlay.querySelector('#skill-detail-body').textContent = 'Failed to load skill content.';
        }
      });
    });

    const style = document.createElement('style');
    style.textContent = '.skill-card:hover { border-color: rgba(255,255,255,.15); background: rgba(255,255,255,.04); }';
    document.head.appendChild(style);
  } catch (err) {
    listEl.innerHTML = '<div style="padding: 40px; text-align: center; color: #ff453a; font-size: 14px;">Failed to load skills.<br>WebUI may be offline.</div>';
  }
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
