export function renderIframe(container) {
  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; flex-direction:column; background:#fff;">
      <webview 
        src="https://platform.xiaomimimo.com/console/plan-manage?userId=2603178785" 
        partition="persist:hermes"
        style="flex:1; width:100%; height:100%; border:none;"
      ></webview>
    </div>
  `;
}
