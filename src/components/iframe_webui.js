// ── Hermes WebUI Iframe Component ──

export function renderIframeWebUI(container, sessionId = null) {
  const url = sessionId 
    ? `http://127.0.0.1:9119/?session_id=${sessionId}`
    : `http://127.0.0.1:9119/`;

  container.innerHTML = `
    <div class="page" style="padding: 0; display: flex; flex-direction: column; height: 100%;">
      <div style="background: var(--bg-secondary); padding: 8px 16px; border-bottom: 2px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
        <div style="font-family: var(--font-header); font-size: 8px; color: var(--accent);">NATIVE_WEBUI_BRIDGE</div>
        <div style="font-family: var(--font-mono); font-size: 10px; color: var(--text-muted);">${url}</div>
      </div>
      <webview 
        id="hermes-webui-view"
        src="${url}" 
        partition="persist:hermes"
        style="flex: 1; width: 100%; height: 100%;"
      ></webview>
    </div>
  `;
}
