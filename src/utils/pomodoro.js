// ── Shared Pomodoro Timer ──
// Single source of truth for both quick_actions toolbar and calendar page.

const state = {
  mode: 'idle',       // idle | work | break | paused
  remaining: 25 * 60,
  workDuration: 25 * 60,
  breakDuration: 5 * 60,
  interval: null,
};

const listeners = new Set();

function notify() {
  listeners.forEach(fn => {
    try { fn(state); } catch {}
  });
}

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function start() {
  if (state.mode === 'idle' || state.mode === 'paused') {
    state.mode = state.mode === 'paused' ? 'work' : 'work';
    if (state.remaining <= 0) state.remaining = state.workDuration;
    if (!state.interval) {
      state.interval = setInterval(tick, 1000);
    }
    notify();
  }
}

export function pause() {
  if (state.interval) {
    clearInterval(state.interval);
    state.interval = null;
  }
  state.mode = 'paused';
  notify();
}

export function reset() {
  if (state.interval) {
    clearInterval(state.interval);
    state.interval = null;
  }
  state.mode = 'idle';
  state.remaining = state.workDuration;
  notify();
}

export function setWorkDuration(minutes) {
  state.workDuration = minutes * 60;
  if (state.mode === 'idle') {
    state.remaining = state.workDuration;
  }
  notify();
}

export function getWorkMinutes() {
  return state.workDuration / 60;
}

export function isRunning() {
  return state.interval !== null;
}

function tick() {
  if (state.remaining <= 0) {
    if (state.mode === 'work') {
      state.mode = 'break';
      state.remaining = state.breakDuration;
    } else {
      state.mode = 'work';
      state.remaining = state.workDuration;
    }
    notify();
    return;
  }
  state.remaining--;
  if (state.remaining < 0) state.remaining = 0;
  notify();
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
