export function renderIframeDeepSeek(container) {
  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; flex-direction:column; background:#fff;">
      <webview 
        src="https://platform.deepseek.com/sign_in" 
        partition="persist:hermes"
        style="flex:1; width:100%; height:100%; border:none;"
      ></webview>
    </div>
  `;
}
