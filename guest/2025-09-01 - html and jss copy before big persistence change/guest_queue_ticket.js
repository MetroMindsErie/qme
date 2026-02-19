// ==============================
// Guest 2 — Queue Ticket Screen
// ==============================

// ----- Elements (IDs must match your HTML) -----
const metric1El     = document.getElementById('metric1');     // Now Serving
const metric2El     = document.getElementById('metric2');     // Your Ticket
const actionGroup   = document.getElementById('actionGroup');
const actionBtn     = document.getElementById('actionBtn');
const note1El       = document.getElementById('actionNote1');
const note2El       = document.getElementById('actionNote2');

// Optional menu bits (guarded; harmless if not present)
const menuBtn       = document.getElementById('menuBtn');
const menuPanel     = document.getElementById('menuPanel');
const menuBackdrop  = document.getElementById('menuBackdrop');

// Wrapper card whose border we tint green when it's your turn.
// If you have multiple cards, narrow this selector to your main wrapper.
const card          = document.querySelector('.card');

// ----- Settings -----
const time2ChkIn = 3;                        // Trigger "approaching" when (metric2 - metric1) <= this
const SESSION_TICKET_KEY = 'guest2:ticket';
const CHECKED_IN_KEY     = 'guest2:checkedIn';

// ----- Small helpers -----
const BASE = location.origin;                // Ensures calls go to http://<your-ip>:3000
function clampNum(v) { const n = parseInt(v,10); return Number.isFinite(n) ? Math.max(1,n) : 1; }
async function getJSON(path, opts) {
  const url = `${BASE}${path}`;
  const r = await fetch(url, { cache: 'no-store', ...opts });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

// Action group helpers (your UI)
function showActionGroup(note1 = '', note2 = '') {
  actionGroup?.classList.remove('is-hidden');
  if (note1El) note1El.textContent = note1;
  if (note2El) note2El.textContent = note2;
}
function hideActionGroup() {
  actionGroup?.classList.add('is-hidden');
}
function changeActionGroupNotesHideButton(note1 = '', note2 = '') {
  if (actionBtn) actionBtn.classList.add('is-hidden');
  if (note1El) note1El.textContent = note1;
  if (note2El) note2El.textContent = note2;
}

// ----- State + setters (drive proximity checks) -----
let m1 = null;               // Now Serving
let m2 = null;               // Your Ticket
let didApproach   = false;   // fired when within threshold
let didNowServing = false;   // fired when m1 >= m2 (AND checked in)
let hasCheckedIn  = sessionStorage.getItem(CHECKED_IN_KEY) === '1';

function setM1(val) {
  m1 = clampNum(val);
  if (metric1El) {
    if ('value' in metric1El) metric1El.value = m1;
    else metric1El.textContent = String(m1);
  }
  evaluateProximity();
}

function setM2(val) {
  m2 = clampNum(val);
  if (metric2El) {
    if ('value' in metric2El) metric2El.value = m2;
    else metric2El.textContent = String(m2);
  }
  evaluateProximity();
}

// ----- Proximity logic (gated by "Check In") -----
// - Approaching: (m2 - m1) in 1..time2ChkIn => showActionGroup with Check In button
// - Now serving:  m1 - m2 >= 0 AND hasCheckedIn => hide button, place-order notes, border green
function evaluateProximity() {
  if (m1 == null || m2 == null) return;

  const ahead = m2 - m1; // how many numbers until it's your turn

  // If we moved far enough away again, allow "approaching" to retrigger and hide the group.
  if (ahead > time2ChkIn) {
    didApproach = false;
    if (!hasCheckedIn) hideActionGroup();
  }

  // If we slipped back behind after being considered now-serving, clear that state and border.
  if (m1 < m2 && didNowServing) {
    didNowServing = false;
    if (card) card.style.borderColor = ''; // back to CSS default
  }

  // 1) Approaching: within threshold, still ahead (> 0)
  if (!didApproach && ahead > 0 && ahead <= time2ChkIn) {
    didApproach = true;

    if (!hasCheckedIn) {
      // Prompt to check in
      showActionGroup('It is time to head to the queue', 'Click on <Check In> when you arrive');
    } else {
      // Already checked in: show waiting guidance with button hidden
      changeActionGroupNotesHideButton('You’re checked in', 'Wait until <Your Number> matches <NOW SERVING>');
    }
  }

  // 2) Now serving (or past)
  if ((m1 - m2) >= 0) {
    if (hasCheckedIn) {
      // Only after Check In do we flip notes and turn border green
      if (!didNowServing) {
        didNowServing = true;
        changeActionGroupNotesHideButton('Place your order when', '<Your Number> matches <NOW SERVING>');
        if (card) card.style.borderColor = '#00ff55'; // instant green border
      }
    } else {
      // Not checked in yet: prompt to check in (no green border, no place-order notes)
      showActionGroup('Please check in now', 'Tap <Check In> to continue');
      if (card) card.style.borderColor = ''; // ensure not green
    }
  }
}

// ----- metric1 sync (poll + optional BroadcastChannel) -----
async function refreshMetric1() {
  try {
    const { value } = await getJSON('/api/metric1');
    setM1(value);
  } catch (e) {
    console.error('Guest2 metric1 fetch failed', e);
    // Optional fallback to last admin-saved local copy (same device only)
    const raw = localStorage.getItem('metric1');
    if (raw) { try { setM1(JSON.parse(raw).value); } catch {} }
  }
}

// Instant same-device updates if admin broadcasts via BroadcastChannel
const bc = 'BroadcastChannel' in window ? new BroadcastChannel('metric-sync') : null;
bc && (bc.onmessage = (e) => {
  if (e.data?.type === 'metric1') setM1(e.data.value);
});
window.addEventListener('beforeunload', () => bc?.close());

// ----- Ticket claim (once per tab) -----
async function claimTicketOnce() {
  const existing = sessionStorage.getItem(SESSION_TICKET_KEY);
  if (existing) { setM2(existing); return; }

  try {
    const { value } = await getJSON('/api/next-ticket', { method: 'POST' });
    setM2(value);
    sessionStorage.setItem(SESSION_TICKET_KEY, String(value)); // prevent re-claim on refresh
  } catch (e) {
    console.error('Guest2 ticket claim failed', e);
    // Fallback: show current counter if increment failed
    try {
      const { value } = await getJSON('/api/peek-ticket');
      setM2(value);
    } catch {}
  }
}

// ----- "Check In" behavior (sets the gate) -----
actionBtn?.addEventListener('click', () => {
  hasCheckedIn = true;
  sessionStorage.setItem(CHECKED_IN_KEY, '1');

  // If we're already at/after your number, flip immediately; else show "checked in" wait notes.
  if (m1 != null && m2 != null && (m1 - m2) >= 0) {
    didNowServing = false; // allow transition below to run fresh
  }
  changeActionGroupNotesHideButton('You’re checked in', 'Wait until <Your Number> matches <NOW SERVING>');
  evaluateProximity();
});

// ----- Optional menu plumbing (safe if elements not present) -----
function openMenu() {
  if (!menuPanel || !menuBackdrop || !menuBtn) return;
  menuPanel.hidden = false;
  menuBackdrop.hidden = false;
  requestAnimationFrame(() => menuPanel.classList.add('open'));
  menuBtn.classList.add('is-open');
  menuBtn.setAttribute('aria-expanded', 'true');
}
function closeMenu() {
  if (!menuPanel || !menuBackdrop || !menuBtn) return;
  menuPanel.classList.remove('open');
  menuBtn.classList.remove('is-open');
  menuBtn.setAttribute('aria-expanded', 'false');
}
menuPanel?.addEventListener('transitionend', () => {
  if (!menuPanel.classList.contains('open')) {
    menuPanel.hidden = true;
    menuBackdrop.hidden = true;
  }
});
menuBtn?.addEventListener('click', () => {
  const isOpen = menuPanel?.classList.contains('open');
  isOpen ? closeMenu() : openMenu();
});
menuBackdrop?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuPanel?.classList.contains('open')) closeMenu();
});

// ----- Boot -----
document.addEventListener('DOMContentLoaded', () => {
  refreshMetric1();                  // load server Now Serving once
  setInterval(refreshMetric1, 2000); // keep it synced cross-device
  claimTicketOnce();                 // get a unique ticket for this tab

  // If this tab refreshed after checking in, reflect that in the UI:
  if (hasCheckedIn) {
    changeActionGroupNotesHideButton('You’re checked in', 'Wait until <Your Number> matches <NOW SERVING>');
  }
});
