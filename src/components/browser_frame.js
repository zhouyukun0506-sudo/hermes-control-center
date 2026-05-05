// ── Shared Browser Frame (Address Bar + Webview Navigation) ──

export function createBrowserFrame(container, { startUrl, partition = 'persist:hermes' }) {
  container.innerHTML = `
    <div style="width:100%; height:100%; display:flex; flex-direction:column;">
      <div class="browser-bar">
        <button class="browser-nav-btn" data-action="back" title="Back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button class="browser-nav-btn" data-action="forward" title="Forward">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button class="browser-nav-btn browser-refresh-btn" data-action="refresh" title="Refresh">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
        <button class="browser-nav-btn" data-action="home" title="Home">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </button>

        <div style="flex:1; margin:0 4px; position:relative;">
          <svg class="browser-globe" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);color:var(--text-muted);pointer-events:none;transition:transform .3s;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          <input class="browser-url" type="text" value="${escUrl(startUrl)}" readonly
            onfocus="this.className='browser-url browser-url-focus'" onblur="this.className='browser-url'"/>
        </div>
      </div>
      <div class="browser-loading-track">
        <div class="browser-loading-bar"></div>
      </div>
      <webview
        class="browser-webview"
        src="${escUrl(startUrl)}"
        partition="${partition}"
        style="flex:1; width:100%; height:100%; border:none;"
      ></webview>
    </div>
  `;

  const webview = container.querySelector('.browser-webview');
  const urlInput = container.querySelector('.browser-url');
  const loadBar = container.querySelector('.browser-loading-bar');
  const globeIcon = container.querySelector('.browser-globe');
  const refreshBtn = container.querySelector('.browser-refresh-btn');
  let loadInterval = null;

  function startLoading() {
    loadBar.style.opacity = '1';
    loadBar.style.width = '15%';
    globeIcon.style.transform = 'translateY(-50%) rotate(360deg)';

    clearInterval(loadInterval);
    let p = 15;
    loadInterval = setInterval(() => {
      const increment = Math.max(0.5, (90 - p) * 0.04);
      p = Math.min(p + increment, 90);
      loadBar.style.width = p + '%';
    }, 200);
  }

  function stopLoading() {
    clearInterval(loadInterval);
    loadBar.style.width = '100%';
    globeIcon.style.transform = 'translateY(-50%) rotate(0deg)';
    setTimeout(() => {
      loadBar.style.opacity = '0';
      setTimeout(() => { loadBar.style.width = '0%'; }, 300);
    }, 200);
  }

  webview.addEventListener('did-start-loading', startLoading);
  webview.addEventListener('did-stop-loading', stopLoading);
  webview.addEventListener('did-navigate', (e) => {
    urlInput.value = e.url;
    stopLoading();
  });
  webview.addEventListener('did-navigate-in-page', (e) => {
    urlInput.value = e.url;
  });

  // Open new-window requests in system browser (e.g. payment popups)
  webview.addEventListener('new-window', (e) => {
    e.preventDefault();
    if (e.url && (e.url.startsWith('http://') || e.url.startsWith('https://'))) {
      try {
        const { shell } = require('electron');
        shell.openExternal(e.url);
      } catch {
        window.open(e.url, '_blank');
      }
    }
  });

  container.querySelectorAll('.browser-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      switch (action) {
        case 'back': webview.goBack(); break;
        case 'forward': webview.goForward(); break;
        case 'refresh':
          refreshBtn.style.transition = 'none';
          refreshBtn.style.transform = 'rotate(0deg)';
          refreshBtn.offsetHeight;
          refreshBtn.style.transition = 'transform .4s cubic-bezier(0.4,0,0.2,1)';
          refreshBtn.style.transform = 'rotate(360deg)';
          webview.reload();
          break;
        case 'home': webview.loadURL(startUrl); break;
      }
    });
  });

  refreshBtn.addEventListener('transitionend', (e) => {
    if (e.propertyName !== 'transform') return;
    refreshBtn.style.transition = 'none';
    refreshBtn.style.transform = 'rotate(0deg)';
    requestAnimationFrame(() => {
      refreshBtn.style.transition = 'transform .4s cubic-bezier(0.4,0,0.2,1)';
    });
  });
  refreshBtn.style.transition = 'transform .4s cubic-bezier(0.4,0,0.2,1)';

  urlInput.addEventListener('dblclick', () => {
    urlInput.removeAttribute('readonly');
    urlInput.focus();
    urlInput.select();
  });
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      let url = urlInput.value.trim();
      if (url) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        webview.loadURL(url);
      }
      urlInput.setAttribute('readonly', '');
      urlInput.blur();
    }
    if (e.key === 'Escape') {
      urlInput.value = webview.getURL ? webview.getURL() : startUrl;
      urlInput.setAttribute('readonly', '');
      urlInput.blur();
    }
  });
  urlInput.addEventListener('blur', () => {
    setTimeout(() => urlInput.setAttribute('readonly', ''), 100);
  });
}

function escUrl(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
