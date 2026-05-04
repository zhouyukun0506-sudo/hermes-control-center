// ── Calendar Component (Batch 1 + Batch 3) ──
import * as api from '../api.js';

let events = [];
let currentYear = 0;
let currentMonth = 0;
let selectedDate = '';

// Timer state
let timerState = {
  running: false,
  mode: 'focus',
  timeLeft: 25 * 60,
  focusDuration: 25 * 60,
  breakDuration: 5 * 60,
  interval: null,
};
let timerContainer = null;

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const SUBJECT_COLORS = {
  physics: '#64d2ff',
  economics: '#2ecc71',
  maths: '#ff453a',
  general: 'var(--accent)',
};
const SUBJECT_LABELS = {
  physics: 'Physics',
  economics: 'Economics',
  maths: 'Maths',
  general: 'General',
};

const HEATMAP_KEY = 'hermes_heatmap';

function getSubjectColor(s) { return SUBJECT_COLORS[s] || 'var(--accent)'; }

function loadHeatmap() {
  try { const d = localStorage.getItem(HEATMAP_KEY); return d ? JSON.parse(d) : {}; } catch { return {}; }
}
function saveHeatmap(h) { localStorage.setItem(HEATMAP_KEY, JSON.stringify(h)); }

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export async function renderCalendar(container, ctx = {}) {
  // Clear old timer interval
  if (timerState.interval) { clearInterval(timerState.interval); timerState.interval = null; }
  timerState.running = false;
  timerContainer = container;

  const tombstone = ctx.tombstone;
  if (tombstone) {
    // Restore from tombstone — skip API call
    events = tombstone.events || [];
    currentYear = tombstone.currentYear;
    currentMonth = tombstone.currentMonth;
    selectedDate = tombstone.selectedDate || '';
    timerState = {
      running: false,
      mode: tombstone.timerState?.mode || 'focus',
      timeLeft: tombstone.timerState?.timeLeft ?? 25 * 60,
      focusDuration: tombstone.timerState?.focusDuration ?? 25 * 60,
      breakDuration: tombstone.timerState?.breakDuration ?? 5 * 60,
      interval: null,
    };
    // Render from cached state
    container.innerHTML = layout();
    renderMonth(container);
    renderCountdown(container);
    renderDayEvents(container);
    renderTimer(container);
    renderHeatmap(container);
    bindEvents(container);
  } else {
    // Fresh full load
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();

    container.innerHTML = layout();
    await loadEvents();
    renderMonth(container);
    renderCountdown(container);
    renderDayEvents(container);
    renderTimer(container);
    renderHeatmap(container);
    bindEvents(container);
  }

  // Attach tombstone serializer — called by main.js on navigate away
  container.tombstone = function() {
    return {
      events,
      currentYear,
      currentMonth,
      selectedDate,
      timerState: {
        mode: timerState.mode,
        timeLeft: timerState.timeLeft,
        focusDuration: timerState.focusDuration,
        breakDuration: timerState.breakDuration,
      },
    };
  };
}

function layout() {
  return `
    <div class="page" style="padding:0;">

      <!-- ── Calendar Card ── -->
      <div class="card" style="padding:0;margin:16px;overflow:hidden;">

        <!-- Countdown -->
        <div id="cal-countdown" style="display:none;padding:10px 14px;background:rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.05);font-size:14px;gap:8px;flex-direction:column;"></div>

        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;">
          <div style="display:flex;align-items:center;gap:4px;">
            <button id="cal-prev" style="width:24px;height:24px;border:none;border-radius:5px;background:rgba(255,255,255,0.06);color:var(--text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span id="cal-month-label" style="font-size:15px;font-weight:700;min-width:120px;text-align:center;"></span>
            <button id="cal-next" style="width:24px;height:24px;border:none;border-radius:5px;background:rgba(255,255,255,0.06);color:var(--text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <button id="cal-add-btn" style="display:none;padding:4px 14px;border-radius:6px;border:.5px solid rgba(255,255,255,0.10);background:var(--accent-gradient);color:#fff;cursor:pointer;font-size:14px;font-weight:600;font-family:inherit;">+</button>
        </div>

        <div style="height:1px;background:rgba(255,255,255,0.06);margin:0 12px;"></div>

        <!-- Day headers -->
        <div style="display:grid;grid-template-columns:repeat(7,1fr);padding:6px 10px 2px;">
          ${DAYS.map(d => `<div style="text-align:center;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.3px;">${d}</div>`).join('')}
        </div>

        <!-- Day grid -->
        <div id="cal-grid" style="display:grid;grid-template-columns:repeat(7,1fr);padding:0 10px 6px;gap:2px;"></div>

        <!-- Events divider -->
        <div id="cal-events-divider" style="display:none;height:1px;background:rgba(255,255,255,0.06);margin:0 12px;"></div>

        <!-- Events list -->
        <div id="cal-day-events" style="display:none;padding:4px 12px 8px;">
          <div id="cal-events-list"></div>
        </div>

      <!-- ── Focus Card (Timer + Heatmap) ── -->
      <div class="card" style="padding:20px 20px;margin:0 16px 16px;">

        <!-- Timer -->
        <div style="display:flex;align-items:center;gap:24px;">
          <div style="flex:0 0 auto;text-align:center;min-width:170px;">
            <div id="timer-mode" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:4px;">Focus</div>
            <div id="timer-display" style="font-size:52px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:2px;color:var(--text-main);transition:color .2s;line-height:1.1;">25:00</div>
            <div style="display:flex;gap:10px;justify-content:center;margin-top:8px;">
              <button id="timer-start-btn" title="Start / Pause" style="width:40px;height:40px;border:none;border-radius:50%;background:rgba(46,204,113,0.15);color:#2ecc71;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .15s;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </button>
              <button id="timer-reset-btn" title="Reset" style="width:40px;height:40px;border:none;border-radius:50%;background:rgba(255,255,255,0.06);color:var(--text-muted);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .15s;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              </button>
            </div>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin-bottom:6px;">Today</div>
            <div style="font-size:16px;font-weight:500;color:var(--text-main);"><span id="timer-sessions">0</span> sessions · <span id="timer-total">0</span> min</div>
            <div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap;">
              ${[15,25,45,60].map(m => `<button class="timer-dur-btn" data-minutes="${m}" style="padding:5px 14px;border-radius:6px;border:.5px solid rgba(255,255,255,0.08);background:${m===25?'rgba(187,38,73,0.15)':'rgba(255,255,255,0.04)'};color:${m===25?'var(--accent)':'var(--text-muted)'};cursor:pointer;font-size:13px;font-weight:${m===25?'600':'500'};font-family:inherit;transition:all .1s;">${m} min</button>`).join('')}
            </div>
          </div>
        </div>

        <div style="height:1px;background:rgba(255,255,255,0.06);margin:16px 0;"></div>

        <!-- Heatmap -->
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text-muted);margin-bottom:10px;">Focus Activity</div>
          <div id="cal-heatmap"></div>
        </div>

      </div>

      <!-- ── Add Event Modal ── -->
      <div id="cal-modal-overlay" style="display:none;position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);align-items:center;justify-content:center;opacity:0;transition:opacity .15s;">
        <div id="cal-modal" style="width:340px;max-width:90vw;border-radius:14px;background:linear-gradient(145deg,var(--glass-bg-light,rgba(255,255,255,0.14)),var(--glass-bg-dark,rgba(0,0,0,0.20)));backdrop-filter:blur(25px);border:.5px solid rgba(255,255,255,0.10);box-shadow:0 25px 60px rgba(0,0,0,0.5);padding:20px;transform:scale(0.96);transition:transform .15s;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
            <span style="font-size:15px;font-weight:700;">New Event</span>
            <button id="cal-modal-close" style="width:24px;height:24px;border:none;border-radius:6px;background:rgba(255,255,255,0.08);color:var(--text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;">✕</button>
          </div>
          <input id="cal-event-title" type="text" placeholder="Event title" autofocus
            style="width:100%;padding:8px 12px;border-radius:8px;border:.5px solid rgba(255,255,255,0.10);background:rgba(0,0,0,0.25);color:var(--text-main);font-size:13px;font-family:inherit;outline:none;margin-bottom:10px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
            <input id="cal-event-date" type="date"
              style="padding:8px 12px;border-radius:8px;border:.5px solid rgba(255,255,255,0.10);background:rgba(0,0,0,0.25);color:var(--text-main);font-size:12px;font-family:inherit;outline:none;color-scheme:dark;">
            <input id="cal-event-time" type="time"
              style="padding:8px 12px;border-radius:8px;border:.5px solid rgba(255,255,255,0.10);background:rgba(0,0,0,0.25);color:var(--text-main);font-size:12px;font-family:inherit;outline:none;color-scheme:dark;">
          </div>
          <select id="cal-event-subject"
            style="width:100%;padding:8px 12px;border-radius:8px;border:.5px solid rgba(255,255,255,0.10);background:rgba(0,0,0,0.25);color:var(--text-main);font-size:12px;font-family:inherit;outline:none;margin-bottom:10px;appearance:none;cursor:pointer;">
            <option value="">General</option>
            <option value="physics">Physics</option>
            <option value="economics">Economics</option>
            <option value="maths">Maths</option>
          </select>
          <textarea id="cal-event-desc" placeholder="Description" rows="2"
            style="width:100%;padding:8px 12px;border-radius:8px;border:.5px solid rgba(255,255,255,0.10);background:rgba(0,0,0,0.25);color:var(--text-main);font-size:12px;font-family:inherit;outline:none;resize:none;margin-bottom:14px;"></textarea>
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button id="cal-modal-cancel" style="padding:6px 14px;border-radius:8px;border:.5px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.08);color:var(--text-muted);cursor:pointer;font-size:12px;font-family:inherit;">Cancel</button>
            <button id="cal-modal-save" style="padding:6px 14px;border-radius:8px;border:none;background:var(--accent-gradient);color:#fff;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;">Save</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function loadEvents() {
  try {
    const data = await fetch('/api/calendar');
    events = (await data.json()).events || [];
  } catch { events = []; }
}

function renderMonth(container) {
  const label = container.querySelector('#cal-month-label');
  const grid = container.querySelector('#cal-grid');
  const addBtn = container.querySelector('#cal-add-btn');
  label.textContent = `${MONTHS[currentMonth]} ${currentYear}`;

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();
  const todayStr = formatDate(today);

  const prefix = firstDay;
  const totalCells = Math.ceil((prefix + daysInMonth) / 7) * 7;

  let html = '';
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - prefix + 1;
    const valid = dayNum >= 1 && dayNum <= daysInMonth;
    const dateStr = valid ? formatDate(new Date(currentYear, currentMonth, dayNum)) : '';
    const dayEvents = valid ? events.filter(e => e.date === dateStr) : [];
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedDate;

    // Determine dot color if there are events with subjects
    let dotColor = 'var(--accent)';
    if (dayEvents.length > 0) {
      const subjects = [...new Set(dayEvents.map(e => e.subject).filter(Boolean))];
      if (subjects.length === 1) dotColor = getSubjectColor(subjects[0]);
    }

    html += `<div data-date="${dateStr}" style="
      height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;position:relative;
      cursor:${valid ? 'pointer' : 'default'};transition:all .1s;
      background:${isSelected ? 'rgba(187,38,73,0.25)' : (isToday ? 'rgba(255,255,255,0.08)' : 'transparent')};
      border:${isSelected ? '1px solid rgba(187,38,73,0.4)' : (isToday ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent')};
    ">
      <span style="font-size:13px;font-weight:${isToday||isSelected ? '700' : '500'};color:${valid ? 'var(--text-main)' : 'transparent'};${isToday ? 'color:var(--accent);' : ''}">${valid ? dayNum : ''}</span>
      ${dayEvents.length > 0 ? `<span style="position:absolute;bottom:2px;width:5px;height:5px;border-radius:50%;background:${dotColor};"></span>` : ''}
    </div>`;
  }
  grid.innerHTML = html;

  grid.querySelectorAll('[data-date]').forEach(el => {
    el.addEventListener('click', () => {
      const date = el.dataset.date;
      if (!date) return;
      selectedDate = date;
      renderMonth(container);
      renderDayEvents(container);
    });
    el.addEventListener('mouseenter', () => {
      if (el.dataset.date && el.style.background !== 'rgba(187, 38, 73, 0.25)') {
        el.style.background = 'rgba(255,255,255,0.05)';
      }
    });
    el.addEventListener('mouseleave', () => {
      const d = el.dataset.date;
      if (d === selectedDate) el.style.background = 'rgba(187,38,73,0.25)';
      else if (d === todayStr) el.style.background = 'rgba(255,255,255,0.08)';
      else el.style.background = 'transparent';
    });
  });

  addBtn.style.display = selectedDate ? '' : 'none';
}

function renderCountdown(container) {
  const el = container.querySelector('#cal-countdown');
  const now = new Date();
  const todayStr = formatDate(now);

  const upcoming = events
    .filter(e => e.date && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  if (upcoming.length === 0) { el.style.display = 'none'; return; }

  el.innerHTML = upcoming.map(e => {
    const d = new Date(e.date + 'T12:00:00');
    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    const daysLabel = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff} days left`;
    const color = getSubjectColor(e.subject);
    const label = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
    return `<div style="display:flex;align-items:center;gap:8px;">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></span>
      <span style="font-weight:600;color:var(--text-main);">${label}</span>
      <span style="color:var(--text-muted);">${esc(e.title)}</span>
      <span style="margin-left:auto;font-weight:700;color:${diff <= 1 ? 'var(--accent)' : 'var(--text-main)'};">${daysLabel}</span>
    </div>`;
  }).join('');

  el.style.display = 'flex';
}

function renderDayEvents(container) {
  const divider = container.querySelector('#cal-events-divider');
  const panel = container.querySelector('#cal-day-events');
  const list = container.querySelector('#cal-events-list');
  const addBtn = container.querySelector('#cal-add-btn');

  if (!selectedDate) { divider.style.display = 'none'; panel.style.display = 'none'; return; }

  const d = new Date(selectedDate + 'T12:00:00');
  const dayEvents = events.filter(e => e.date === selectedDate);
  const weekday = DAYS[d.getDay()];
  const dateLabel = `${weekday}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;

  divider.style.display = '';
  panel.style.display = '';
  addBtn.style.display = '';

  if (dayEvents.length === 0) {
    list.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 2px;">
        <span style="font-size:13px;font-weight:600;color:var(--text-main);">${dateLabel}</span>
        <span style="font-size:11px;color:var(--text-muted);">No events</span>
      </div>`;
    return;
  }

  list.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
      <span style="font-size:13px;font-weight:600;color:var(--text-main);">${dateLabel}</span>
      <span style="font-size:10px;color:var(--text-muted);opacity:.5;">${dayEvents.length}</span>
    </div>
    ${dayEvents.sort((a, b) => (a.time || '').localeCompare(b.time || '')).map(e => {
      const sc = getSubjectColor(e.subject);
      return `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
        <div style="width:3px;height:24px;border-radius:1px;background:${sc};flex-shrink:0;"></div>
        <div style="flex:1;min-width:0;display:flex;align-items:center;gap:8px;">
          <span style="font-size:12px;font-weight:600;color:${e.time ? sc : 'var(--text-muted)'};">${e.time || '·'}</span>
          <span style="font-size:13px;font-weight:500;">${esc(e.title)}</span>
          ${e.description ? `<span style="font-size:11px;color:var(--text-muted);opacity:.6;">${esc(e.description)}</span>` : ''}
          ${e.subject ? `<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:${sc}20;color:${sc};font-weight:600;text-transform:uppercase;letter-spacing:.3px;">${esc(SUBJECT_LABELS[e.subject] || e.subject)}</span>` : ''}
        </div>
        <button class="cal-del-btn" data-id="${e.id}" style="display:none;width:20px;height:20px;border:none;border-radius:4px;background:rgba(255,69,58,0.2);color:#ff453a;cursor:pointer;font-size:9px;flex-shrink:0;align-items:center;justify-content:center;">✕</button>
      </div>`;
    }).join('')}`;

  list.querySelectorAll('[data-id]').forEach(del => {
    const row = del.closest('div');
    row.addEventListener('mouseenter', () => { del.style.display = 'flex'; });
    row.addEventListener('mouseleave', () => { del.style.display = 'none'; });
    del.addEventListener('click', async () => {
      await fetch('/api/calendar/delete', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id: del.dataset.id }) });
      await loadEvents();
      renderMonth(container);
      renderDayEvents(container);
      renderCountdown(container);
    });
  });
}

// ── Timer ──
function renderTimer(container) {
  timerContainer = container;
  updateTimerUI(container);
  updateTimerStats(container);
}

function updateTimerUI(container) {
  const display = container.querySelector('#timer-display');
  const mode = container.querySelector('#timer-mode');
  if (display) display.textContent = formatTime(timerState.timeLeft);
  if (mode) {
    mode.textContent = timerState.mode === 'focus' ? 'Focus' : 'Break';
    mode.style.color = timerState.mode === 'focus' ? 'var(--text-muted)' : '#2ecc71';
  }
  // Update running state visual
  const startBtn = container.querySelector('#timer-start-btn');
  if (startBtn) {
    startBtn.innerHTML = timerState.running
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    startBtn.style.background = timerState.running ? 'rgba(255,255,255,0.08)' : 'rgba(46,204,113,0.15)';
    startBtn.style.color = timerState.running ? 'var(--text-muted)' : '#2ecc71';
  }
  if (timerState.running) {
    display?.style.setProperty('color', timerState.mode === 'focus' ? 'var(--text-main)' : '#2ecc71');
  } else {
    display?.style.setProperty('color', 'var(--text-muted)');
  }
}

function updateTimerStats(container) {
  const heatmap = loadHeatmap();
  const todayStr = formatDate(new Date());
  const todayData = heatmap[todayStr] || 0;
  const totalMins = Math.floor(todayData);
  const sessions = (todayData > 0 && todayData % 1 !== 0) ? Math.ceil(todayData / 100) : Math.floor(todayData / (timerState.focusDuration / 60)) || 0;

  const sessionsEl = container.querySelector('#timer-sessions');
  const totalEl = container.querySelector('#timer-total');
  if (sessionsEl) sessionsEl.textContent = totalMins > 0 ? Math.max(1, Math.round(totalMins / (timerState.focusDuration / 60))) : 0;
  if (totalEl) totalEl.textContent = totalMins;
}

function tickTimer() {
  if (!timerContainer || !document.body.contains(timerContainer)) {
    clearInterval(timerState.interval);
    timerState.interval = null;
    timerState.running = false;
    return;
  }

  if (timerState.timeLeft <= 0) {
    // Session complete
    const focusMins = timerState.focusDuration / 60;

    if (timerState.mode === 'focus') {
      // Record to heatmap
      const heatmap = loadHeatmap();
      const todayStr = formatDate(new Date());
      heatmap[todayStr] = (heatmap[todayStr] || 0) + focusMins;
      saveHeatmap(heatmap);

      // Switch to break
      timerState.mode = 'break';
      timerState.timeLeft = timerState.breakDuration;
    } else {
      // Switch to focus
      timerState.mode = 'focus';
      timerState.timeLeft = timerState.focusDuration;
    }

    updateTimerUI(timerContainer);
    updateTimerStats(timerContainer);
    renderHeatmap(timerContainer);
    return;
  }

  timerState.timeLeft--;
  updateTimerUI(timerContainer);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// ── Heatmap ──
function renderHeatmap(container) {
  const el = container.querySelector('#cal-heatmap');
  if (!el) return;
  const heatmap = loadHeatmap();
  const today = new Date();

  // Compute start date: 12 weeks back from last Monday
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daysFromMonday);
  const startDate = new Date(lastMonday);
  startDate.setDate(lastMonday.getDate() - 7 * 11);

  // Day labels
  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', ''];

  // Month labels
  const months = [];
  for (let w = 0; w < 12; w++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + w * 7 + 3); // middle of week
    const m = d.getMonth();
    if (w === 0 || d.getMonth() !== new Date(startDate).setDate(startDate.getDate() + (w-1)*7 + 3)) {
      months.push({ col: w, label: MONTHS[m].slice(0, 3) });
    }
  }

  let html = '<div style="display:flex;gap:3px;">';

  // Day labels column
  html += '<div style="display:grid;grid-template-rows:repeat(7,14px);gap:3px;padding-right:6px;">';
  for (let d = 0; d < 7; d++) {
    html += `<div style="font-size:9px;color:var(--text-muted);opacity:.5;line-height:14px;height:14px;">${dayLabels[d]}</div>`;
  }
  html += '</div>';

  // Week columns
  for (let w = 0; w < 12; w++) {
    html += '<div style="display:grid;grid-template-rows:repeat(7,14px);gap:3px;">';
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      const dateStr = formatDate(date);
      const mins = heatmap[dateStr] || 0;
      const isFuture = date > today;

      let intensity;
      if (isFuture) intensity = 'rgba(255,255,255,0.02)';
      else if (mins === 0) intensity = 'rgba(255,255,255,0.04)';
      else if (mins < 15) intensity = 'rgba(46,204,113,0.15)';
      else if (mins < 30) intensity = 'rgba(46,204,113,0.30)';
      else if (mins < 60) intensity = 'rgba(46,204,113,0.50)';
      else if (mins < 90) intensity = 'rgba(46,204,113,0.70)';
      else intensity = 'rgba(46,204,113,0.90)';

      html += `<div title="${dateStr}: ${Math.round(mins)} min" style="width:14px;height:14px;border-radius:3px;background:${intensity};${isFuture?'opacity:.3;':''}"></div>`;
    }
    html += '</div>';
  }
  html += '</div>';

  // Month labels
  let monthHtml = '<div style="display:flex;gap:2px;padding-left:22px;margin-top:6px;">';
  let lastCol = -1;
  months.forEach(m => {
    const gap = (m.col - lastCol - 1) * 17;
    monthHtml += `<span style="font-size:9px;color:var(--text-muted);opacity:.5;${gap > 0 ? `margin-left:${gap}px;` : ''}">${m.label}</span>`;
    lastCol = m.col;
  });
  monthHtml += '</div>';

  // Legend
  monthHtml += `<div style="display:flex;align-items:center;gap:4px;margin-top:8px;padding-left:22px;">
    <span style="font-size:9px;color:var(--text-muted);opacity:.5;">Less</span>
    <div style="width:12px;height:12px;border-radius:3px;background:rgba(255,255,255,0.04);"></div>
    <div style="width:12px;height:12px;border-radius:3px;background:rgba(46,204,113,0.15);"></div>
    <div style="width:12px;height:12px;border-radius:3px;background:rgba(46,204,113,0.30);"></div>
    <div style="width:12px;height:12px;border-radius:3px;background:rgba(46,204,113,0.50);"></div>
    <div style="width:12px;height:12px;border-radius:3px;background:rgba(46,204,113,0.70);"></div>
    <div style="width:12px;height:12px;border-radius:3px;background:rgba(46,204,113,0.90);"></div>
    <span style="font-size:9px;color:var(--text-muted);opacity:.5;">More</span>
  </div>`;

  html += monthHtml;
  el.innerHTML = html;
}

// ── Events ──
function bindEvents(container) {
  // Month nav
  container.querySelector('#cal-prev').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    selectedDate = '';
    renderMonth(container);
    container.querySelector('#cal-events-divider').style.display = 'none';
    container.querySelector('#cal-day-events').style.display = 'none';
    container.querySelector('#cal-add-btn').style.display = 'none';
  });

  container.querySelector('#cal-next').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    selectedDate = '';
    renderMonth(container);
    container.querySelector('#cal-events-divider').style.display = 'none';
    container.querySelector('#cal-day-events').style.display = 'none';
    container.querySelector('#cal-add-btn').style.display = 'none';
  });

  // Add button
  container.querySelector('#cal-add-btn').addEventListener('click', () => {
    const modal = container.querySelector('#cal-modal-overlay');
    const card = container.querySelector('#cal-modal');
    const dateInput = container.querySelector('#cal-event-date');
    const timeInput = container.querySelector('#cal-event-time');
    const titleInput = container.querySelector('#cal-event-title');
    const descInput = container.querySelector('#cal-event-desc');
    const subjectInput = container.querySelector('#cal-event-subject');

    dateInput.value = selectedDate;
    timeInput.value = '';
    titleInput.value = '';
    descInput.value = '';
    subjectInput.value = '';
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
      modal.style.opacity = '1';
      card.style.transform = 'scale(1)';
    });
    setTimeout(() => titleInput.focus(), 100);
  });

  // Modal close
  const modal = container.querySelector('#cal-modal-overlay');
  const card = container.querySelector('#cal-modal');
  function closeModal() {
    modal.style.opacity = '0';
    card.style.transform = 'scale(0.96)';
    setTimeout(() => { modal.style.display = 'none'; }, 150);
  }

  container.querySelector('#cal-modal-close').addEventListener('click', closeModal);
  container.querySelector('#cal-modal-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  // Save
  container.querySelector('#cal-modal-save').addEventListener('click', async () => {
    const titleInput = container.querySelector('#cal-event-title');
    const title = titleInput.value.trim();
    if (!title) return;
    await fetch('/api/calendar/add', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        date: container.querySelector('#cal-event-date').value,
        time: container.querySelector('#cal-event-time').value,
        description: container.querySelector('#cal-event-desc').value.trim(),
        subject: container.querySelector('#cal-event-subject').value,
      }),
    });
    closeModal();
    await loadEvents();
    renderMonth(container);
    renderDayEvents(container);
    renderCountdown(container);
    updateTimerStats(container);
  });

  container.querySelector('#cal-event-title').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') container.querySelector('#cal-modal-save').click();
    if (e.key === 'Escape') closeModal();
  });

  // Timer start/pause
  container.querySelector('#timer-start-btn').addEventListener('click', () => {
    if (timerState.interval) {
      // Pause
      clearInterval(timerState.interval);
      timerState.interval = null;
      timerState.running = false;
    } else {
      // Start
      timerState.running = true;
      timerState.interval = setInterval(() => tickTimer(), 1000);
    }
    updateTimerUI(container);
  });

  // Timer reset
  container.querySelector('#timer-reset-btn').addEventListener('click', () => {
    if (timerState.interval) {
      clearInterval(timerState.interval);
      timerState.interval = null;
    }
    timerState.running = false;
    timerState.mode = 'focus';
    timerState.timeLeft = timerState.focusDuration;
    updateTimerUI(container);
    const mode = container.querySelector('#timer-mode');
    if (mode) mode.style.color = 'var(--text-muted)';
  });

  // Timer duration buttons
  container.querySelectorAll('.timer-dur-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (timerState.running) return; // Don't change during session
      const mins = parseInt(btn.dataset.minutes);
      timerState.focusDuration = mins * 60;
      timerState.timeLeft = timerState.focusDuration;

      // Update active state
      container.querySelectorAll('.timer-dur-btn').forEach(b => {
        const active = parseInt(b.dataset.minutes) === mins;
        b.style.background = active ? 'rgba(187,38,73,0.15)' : 'rgba(255,255,255,0.04)';
        b.style.color = active ? 'var(--accent)' : 'var(--text-muted)';
        b.style.fontWeight = active ? '600' : '500';
      });

      updateTimerUI(container);
    });
    btn.addEventListener('mouseenter', () => {
      if (!btn.style.background.includes('187,38,73')) btn.style.background = 'rgba(255,255,255,0.08)';
    });
    btn.addEventListener('mouseleave', () => {
      if (!btn.style.background.includes('187,38,73')) btn.style.background = 'rgba(255,255,255,0.04)';
    });
  });
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
