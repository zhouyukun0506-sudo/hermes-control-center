// ── Workbench WebUI Iframe Component (Full-screen App View) ──

export function renderIframeWebUI(container, sessionId = null) {
  const url = sessionId
    ? `http://localhost:8787/?session_id=${sessionId}`
    : `http://localhost:8787/`;

  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; flex-direction:column; background:#000;">
      <div style="display:flex; align-items:center; justify-content:space-between; padding:4px 12px; flex-shrink:0; background:rgba(0,0,0,0.4); border-bottom:0.5px solid rgba(255,255,255,0.06);">
        <span style="font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); opacity:0.5;">Workbench</span>
        <span style="font-size:10px; color:var(--text-muted); font-family:var(--font-mono); opacity:0.4;">${url}</span>
      </div>
      <webview
        src="${escUrl(url)}"
        style="flex:1; width:100%; height:100%; border:none;"
      ></webview>
    </div>
  `;
}

function escUrl(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
