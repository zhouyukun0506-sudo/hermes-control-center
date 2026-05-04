// ── Flip Clock (macOS 26 Liquid Glass) ──

const FC_STYLE_ID = 'fc-styles';

function injectStyles() {
  if (document.getElementById(FC_STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = FC_STYLE_ID;
  s.textContent = `
    @keyframes fcFlip {
      0%   { transform: perspective(600px) rotateX(0deg); }
      50%  { transform: perspective(600px) rotateX(-90deg); }
      100% { transform: perspective(600px) rotateX(0deg); }
    }
    @keyframes fcBlink {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 0.15; }
    }
    @keyframes fcFadeIn {
      from { opacity: 0; transform: translateY(8px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .fc-root {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100%;
      background: radial-gradient(ellipse at 50% 40%, #1a1a1e 0%, #0d0d0f 60%, #050506 100%);
      user-select: none;
      animation: fcFadeIn 0.6s ease-out;
    }
    .fc-container {
      display: flex; align-items: center; justify-content: center;
      gap: 2px;
    }
    .fc-group {
      display: flex; align-items: center;
      gap: 6px;
    }
    .fc-digit {
      display: inline-flex; align-items: center; justify-content: center;
      width: 128px; height: 172px;
      background: linear-gradient(180deg,
        rgba(58, 58, 62, 0.95) 0%,
        rgba(44, 44, 48, 0.95) 49.5%,
        rgba(38, 38, 42, 0.95) 50.5%,
        rgba(32, 32, 36, 0.95) 100%);
      border-radius: 14px;
      position: relative;
      font-size: 112px; font-weight: 600;
      text-align: center;
      color: rgba(255, 255, 255, 0.92);
      font-family: 'SF Pro Display', -apple-system, system-ui, sans-serif;
      letter-spacing: -2px;
      /* macOS 26 Liquid Glass — multi-layer shadow */
      box-shadow:
        0 1px 2px rgba(0, 0, 0, 0.3),
        0 4px 16px rgba(0, 0, 0, 0.25),
        0 12px 40px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.10),
        inset 0 -1px 0 rgba(0, 0, 0, 0.3);
      overflow: hidden;
      border: 0.5px solid rgba(255, 255, 255, 0.08);
    }
    /* Center split line */
    .fc-digit::after {
      content: '';
      position: absolute; left: 0; right: 0; top: 50%; height: 1px;
      background: rgba(0, 0, 0, 0.55);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.05);
      z-index: 5;
    }
    /* Subtle top highlight */
    .fc-digit::before {
      content: '';
      position: absolute; top: 0; left: 8px; right: 8px; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.12) 70%, transparent);
      z-index: 6;
    }
    .fc-digit.fc-flip {
      animation: fcFlip 0.45s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .fc-sep {
      font-size: 72px; font-weight: 300;
      color: #0087FF; opacity: 0.55;
      margin: 0 6px; line-height: 1;
      font-family: 'SF Pro Display', -apple-system, system-ui, sans-serif;
    }
    .fc-sep.fc-blink { animation: fcBlink 1s step-end infinite; }
    .fc-date {
      margin-top: 32px; font-size: 15px; font-weight: 500;
      color: rgba(255, 255, 255, 0.42);
      letter-spacing: 3px;
      font-family: 'SF Pro Display', -apple-system, system-ui, sans-serif;
      text-transform: uppercase;
    }
    @media (max-width: 800px) {
      .fc-digit { width: 88px; height: 120px; font-size: 78px; border-radius: 10px; }
      .fc-sep { font-size: 50px; margin: 0 4px; }
      .fc-date { font-size: 13px; letter-spacing: 2px; }
    }
    @media (max-width: 500px) {
      .fc-digit { width: 54px; height: 76px; font-size: 48px; border-radius: 8px; letter-spacing: 0; }
      .fc-sep { font-size: 30px; margin: 0 2px; }
      .fc-date { font-size: 11px; letter-spacing: 1.5px; }
    }
  `;
  document.head.appendChild(s);
}

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function getDateStr() {
  const d = new Date();
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function getTimeDigits() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return { digits: (hh + mm + ss).split(''), date: getDateStr() };
}

export function renderFlipClock(container) {
  injectStyles();

  container.innerHTML = `
    <div class="page" style="display:flex;flex-direction:column;height:100%;">
      <div class="fc-root">
        <div class="fc-container">
          <div class="fc-group">
            <div class="fc-digit" id="fc-h1">0</div>
            <div class="fc-digit" id="fc-h2">0</div>
          </div>
          <span class="fc-sep fc-blink">:</span>
          <div class="fc-group">
            <div class="fc-digit" id="fc-m1">0</div>
            <div class="fc-digit" id="fc-m2">0</div>
          </div>
          <span class="fc-sep fc-blink">:</span>
          <div class="fc-group">
            <div class="fc-digit" id="fc-s1">0</div>
            <div class="fc-digit" id="fc-s2">0</div>
          </div>
        </div>
        <div class="fc-date" id="fc-date"></div>
      </div>
    </div>
  `;

  const digitIds = ['fc-h1', 'fc-h2', 'fc-m1', 'fc-m2', 'fc-s1', 'fc-s2'];
  const digitEls = digitIds.map(id => container.querySelector(`#${id}`));
  const dateEl = container.querySelector('#fc-date');

  let prev = getTimeDigits();

  digitEls.forEach((el, i) => { el.textContent = prev.digits[i]; });
  dateEl.textContent = prev.date;

  function updateDigit(el, newVal) {
    if (el.textContent === newVal) return;
    el.textContent = newVal;
    el.classList.remove('fc-flip');
    void el.offsetWidth;
    el.classList.add('fc-flip');
  }

  const tick = () => {
    const now = getTimeDigits();
    digitEls.forEach((el, i) => {
      if (now.digits[i] !== prev.digits[i]) updateDigit(el, now.digits[i]);
    });
    if (now.date !== prev.date) dateEl.textContent = now.date;
    prev = now;
  };

  const interval = setInterval(tick, 1000);

  container.cleanup = () => { clearInterval(interval); };
  container.tombstone = () => { clearInterval(interval); return null; };
}
