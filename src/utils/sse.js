// ── SSE Helper ──

export function createSSE(url, { onMessage, onError, onOpen } = {}) {
  let es = null;
  let closed = false;

  function connect() {
    if (closed) return;
    es = new EventSource(url);

    es.onopen = () => {
      if (onOpen) onOpen();
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch {
        if (onMessage) onMessage({ raw: event.data });
      }
    };

    es.onerror = (err) => {
      if (closed) return;
      es.close();
      if (onError) onError(err);
      // Auto-reconnect after 3s
      setTimeout(connect, 3000);
    };
  }

  connect();

  return {
    close() {
      closed = true;
      if (es) es.close();
    },
  };
}
