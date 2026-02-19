// Promote any legacy 'guest2:ticket' (local or session) to canonical 'guest:ticketId'
function migrateLegacyStorage() {
  try {
    const canon = localStorage.getItem(LOCAL_TICKET_KEY);
    if (!canon) {
      const legacyLocal   = localStorage.getItem('guest2:ticket');
      const legacySession = sessionStorage.getItem('guest2:ticket');
      const legacy = legacyLocal || legacySession;
      if (legacy) {
        localStorage.setItem(LOCAL_TICKET_KEY, legacy);
      }
    }
    // Always clear legacy copies to avoid ambiguity going forward
    try { localStorage.removeItem('guest2:ticket'); } catch {}
    try { sessionStorage.removeItem('guest2:ticket'); } catch {}
  } catch {}
}
function setNotes(n1 = '', n2 = '') {
  const note1 = document.getElementById('actionNote1');
  const note2 = document.getElementById('actionNote2');
  if (note1) note1.textContent = n1;
  if (note2) note2.textContent = n2;
}

function getStoredTicket() {
  return localStorage.getItem(LOCAL_TICKET_KEY);
}


// ==============================
// Guest 2 — Queue Ticket Screen
// ==============================

// ----- Elements (IDs must match your HTML) -----
const metric1El     = document.getElementById('metric1');     // Now Serving
const metric2El     = document.getElementById('metric2');     // Your Ticket
const actionGroup   = document.getElementById('actionGroup');
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
const noChkInByBye = 5;                       // trigger forced leave if not checked in and (m1 - m2) >= noChkInByBye
const chkInByBye = 9;                         // trigger forced leave if  checked in  and (m1 - m2) >= ChkInByBye
const time2ChkIn = 3;                        // Trigger "approaching" when (metric2 - metric1) <= this
const SESSION_TICKET_KEY = 'guest2:ticket';
const CHECKED_IN_KEY     = 'guest2:checkedIn';
const LOCAL_TICKET_KEY   = 'guest:ticketId';

function checkedInKey(id){ return `guest:checkedIn:${id}`;} //cross-tab


// ----- State + setters (drive proximity checks) -----
let m1 = null;               // Now Serving
let m2 = null;               // Your Ticket
let didApproach   = false;   // fired when within threshold
let didNowServing = false;   // fired when m1 >= m2 (AND checked in)

let hasCheckedIn = false;
try {
  const tid = Number(
    localStorage.getItem(LOCAL_TICKET_KEY) ||
    sessionStorage.getItem(SESSION_TICKET_KEY) || 0
  );
  if (tid > 0) {
    hasCheckedIn = localStorage.getItem(checkedInKey(tid)) === '1';
    // keep sessionStorage in step (optional, for this tab’s reloads)
    if (hasCheckedIn) {
      try { sessionStorage.setItem(CHECKED_IN_KEY, '1'); } catch {}
    } else {
      try { sessionStorage.removeItem(CHECKED_IN_KEY); } catch {}
    }
  }
} catch {}


// Guard so we don't trigger auto-leave multiple times during polling
let didAutoLeave = false;

function clearTicketEverywhere() {
  try { sessionStorage.removeItem(SESSION_TICKET_KEY); } catch {}
  try { sessionStorage.removeItem(CHECKED_IN_KEY); } catch {}
  try { localStorage.removeItem(LOCAL_TICKET_KEY); } catch {}
  // legacy safety (old builds wrote this):
  try { localStorage.removeItem('guest2:ticket'); } catch {}

  // Optional: clear on-page ticket display if you have one
  try {
    if (typeof metric2El !== 'undefined' && metric2El) {
      if ('value' in metric2El) metric2El.value = '';
      else metric2El.textContent = '—';
    }
  } catch {}
}

function finalizeLeave() {
  clearTicketEverywhere();
  try { (new BroadcastChannel('queue')).postMessage({ type: 'TICKET_CLEARED' }); } catch {}
  window.location.href = 'guest_qCE_single_view.html?cleared=1';
}

// ----- Small helpers -----
const BASE = location.origin;                // Ensures calls go to http://<your-ip>:3000

// cache the element once (e.g., in DOMContentLoaded you already do metric2El = ...)
// let metric2El = document.getElementById('metric2');
function clampNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}

async function getJSON(path, opts) {
  const url = `${BASE}${path}`;
  const r = await fetch(url, { cache: 'no-store', ...opts });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

// Show the action area with BOTH buttons visible (used when we prompt to check in)
function showActionGroup(note1 = '', note2 = '') {
  const group   = document.getElementById('actionGroup');
  const action  = document.getElementById('actionBtn');  // Check In
  const leave   = document.getElementById('leaveBtn');   // Leave Queue
  const note1El = document.getElementById('actionNote1');
  const note2El = document.getElementById('actionNote2');

  group?.classList.remove('is-hidden');   // never hide the whole group
  if (leave)  leave.hidden  = false;      // Leave always available
  if (action) action.hidden = false;      // Check In visible
  if (note1El) note1El.textContent = note1;
  if (note2El) note2El.textContent = note2;
}

// Hide ONLY the Check-In button (used when "far away" or once checked in)
function hideActionGroup() {
  const group  = document.getElementById('actionGroup');
  const action = document.getElementById('actionBtn');
  const leave  = document.getElementById('leaveBtn');
  const note1El = document.getElementById('actionNote1');
  const note2El = document.getElementById('actionNote2');

  group?.classList.remove('is-hidden');   // group stays visible
  if (leave)  leave.hidden  = false;      // Leave always visible
  if (action) action.hidden = true;       // Only hide Check In

  if (action) action.hidden = true;     // only hide the Check-In button

  // if we backed away and aren't checked in, clear the “head to queue” notes
  if (!hasCheckedIn) {
    if (note1El) note1El.textContent = '';
    if (note2El) note2El.textContent = '';
  }
}


// When checked in, keep Leave visible and hide Check-In while updating notes
function changeActionGroupNotesHideButton(note1 = '', note2 = '') {
  const action = document.getElementById('actionBtn');
  const note1El = document.getElementById('actionNote1');
  const note2El = document.getElementById('actionNote2');

  if (action) action.hidden = true;       // only the Check In button hides
  if (note1El) note1El.textContent = note1;
  if (note2El) note2El.textContent = note2;
}

function setM1(val, { silent = false } = {}) {
  const n = clampNum(val);
  m1 = n;

  const el = metric1El || document.getElementById('metric1');
  if (el) {
    const s = String(n);
    if ('value' in el) el.value = s;
    else el.textContent = s;
  }

  if (!silent) evaluateProximity();
}


function setM2(val, { silent = false } = {}) {
  const n = clampNum(val);
  m2 = n;

  const el = metric2El || document.getElementById('metric2');
  if (el) {
    const s = String(n);
    if ('value' in el) el.value = s;
    else el.textContent = s;
  }

  // Mirror = ground truth across tabs
  const mirrorOn = n > 0 && localStorage.getItem(checkedInKey(n)) === '1';

  if (mirrorOn && !hasCheckedIn) {
    // adopt checked-in immediately
    hasCheckedIn = true;
    try { sessionStorage.setItem(CHECKED_IN_KEY, '1'); } catch {}
    changeActionGroupNotesHideButton(
      'You’re checked in',
      'Wait until <Your Number> matches <NOW SERVING>'
    );
  } else if (!mirrorOn && hasCheckedIn) {
    // drop stale per-tab state if mirror is off for this ticket
    hasCheckedIn = false;
    try { sessionStorage.removeItem(CHECKED_IN_KEY); } catch {}
    // notes/button visibility will be settled by evaluateProximity()
  }

  if (!silent) evaluateProximity();
}

// ----- Proximity logic (gated by "Check In") -----
// - Approaching: (m2 - m1) in 1..time2ChkIn => showActionGroup with Check In button
// - Now serving:  m1 - m2 >= 0 AND hasCheckedIn => hide button, place-order notes, border green
function evaluateProximity() {
  if (m1 == null || m2 == null) return;

  // Auto-leave when NOW SERVING has passed my ticket by a threshold.
  // Uses different thresholds depending on whether the guest checked in or not
  if (!didAutoLeave) {
    const gap = m1 - m2; // how many numbers have passed me by (>= 0 means I'm overdue)

    const shouldKick =
      (!hasCheckedIn && gap >= noChkInByBye) ||
      ( hasCheckedIn && gap >= chkInByBye );

    if (shouldKick) {
      didAutoLeave = true;

      const id = Number(
        localStorage.getItem('guest:ticketId') ||
        sessionStorage.getItem('guest2:ticket') || 0
      );

      fetch('/api/queue/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: id,
          reason: hasCheckedIn ? 'checkedInTimeout' : 'noCheckInTimeout'
        })
      })
      .catch(err => console.warn('auto-leave POST failed', err))
      .finally(() => {
        // finalize leave
        try { sessionStorage.removeItem('guest2:ticket'); } catch {}
        try { sessionStorage.removeItem('guest2:checkedIn'); } catch {}
        try { localStorage.removeItem('guest:ticketId'); } catch {}
        try { localStorage.removeItem(checkedInKey(m2)); } catch {}
        try { (new BroadcastChannel('queue')).postMessage({ type: 'TICKET_CLEARED', ticketId: id }); } catch {}

        window.location.href = 'guest_qCE_single_view.html?cleared=1';
      });

      return; // stop further UI updates on this page
    }
  }

  const ahead = m2 - m1; // how many numbers until it's your turn

  // If we moved far enough away again, allow "approaching" to retrigger and hide the Check-In button.
  if (ahead > time2ChkIn) {
    didApproach = false;
    if (!hasCheckedIn) hideActionGroup();
  }

  // If we slipped back behind after being considered now-serving, clear that state, border, and notes.
  if (m1 < m2 && didNowServing) {
    didNowServing = false;
    if (card) card.style.borderColor = ''; // back to CSS default

    // If you were checked in, revert the message to the waiting state.
    if (hasCheckedIn) {
      changeActionGroupNotesHideButton(
        'You’re checked in',
        'Wait until <Your Number> matches <NOW SERVING>'
      );
      // keep the Check-In button hidden; leave stays visible
    } else {
      // not checked in: let the rest of the logic below decide whether to prompt or hide
    }
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
        changeActionGroupNotesHideButton('It is your turn to place an order', '<NOW SERVING> has reached <Your Number>');
        if (card) card.style.borderColor = '#00ff55'; // instant green border
      }
    } else {
      // Not checked in yet: prompt to check in (no green border, no place-order notes)
      showActionGroup('Please check in now', 'Tap <Check In> to continue');
      if (card) card.style.borderColor = ''; // ensure not green
    }
  }
}

async function refreshMetric1() {
  try {
    const r = await fetch('/api/metric1', { cache: 'no-store' });
    const { value } = await r.json();
    setM1(value);                 // <-- critical line
  } catch (e) {
    console.error('Guest2 metric1 fetch failed', e);
  }
}


// Instant same-device updates if admin broadcasts via BroadcastChannel
const bc = 'BroadcastChannel' in window ? new BroadcastChannel('metric-sync') : null;
bc && (bc.onmessage = (e) => {
  if (e.data?.type === 'metric1') setM1(e.data.value);
});
window.addEventListener('beforeunload', () => bc?.close());

let isClaiming = false;

// Claim or adopt a ticket exactly once for this profile/tab.
// - Prefers adopting existing canonical localStorage (prevents dupes across tabs).
// - Falls back to sessionStorage if present (and promotes to localStorage).
// - Otherwise, race-safe fresh claim from the server.
// - On adopt, POST /api/queue/restore to keep the server counter in sync after restarts.
async function claimTicketOnce() {
  // Simple re-entrancy guard without needing a global
  if (claimTicketOnce.__busy) return;
  claimTicketOnce.__busy = true;
  try {
    // 1) Adopt from canonical localStorage (prevents duplicate claim in same profile)
    let canon = localStorage.getItem(LOCAL_TICKET_KEY);
    if (canon) {
      const id = Number(canon);
      setM2(id);
      try { sessionStorage.setItem(SESSION_TICKET_KEY, String(id)); } catch {}
      // Tell the server so its counter stays in sync after restarts
      try {
        await fetch('/api/queue/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: id })
        });
      } catch {}
      return;
    }

    // 2) Adopt from sessionStorage (and promote to canonical localStorage)
    const sess = sessionStorage.getItem(SESSION_TICKET_KEY);
    if (sess) {
      const id = Number(sess);
      setM2(id);
      try { localStorage.setItem(LOCAL_TICKET_KEY, String(id)); } catch {}
      // Keep server counter in sync as well
      try {
        await fetch('/api/queue/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: id })
        });
      } catch {}
      return;
    }

    // 3) Fresh claim: race-safe
    // Give other tabs ~1 frame to finish writing LOCAL_TICKET_KEY, then re-check.
    await new Promise(r => setTimeout(r, 40));
    canon = localStorage.getItem(LOCAL_TICKET_KEY);
    if (canon) {
      const id = Number(canon);
      setM2(id);
      try { sessionStorage.setItem(SESSION_TICKET_KEY, String(id)); } catch {}
      return;
    }

    // No existing ticket — claim a new one from the server
    try {
      const { value } = await getJSON('/api/next-ticket', { method: 'POST' });
      if (typeof value === 'number') {
        setM2(value);
        try { sessionStorage.setItem(SESSION_TICKET_KEY, String(value)); } catch {}
        try { localStorage.setItem(LOCAL_TICKET_KEY, String(value)); } catch {}
        return;
      }
    } catch (e) {
      console.error('Guest2 ticket claim failed', e);
      // Optional: last-resort display so the UI isn't blank; do NOT persist
      try {
        const { value } = await getJSON('/api/peek-ticket', { cache: 'no-store' });
        if (typeof value === 'number') setM2(value);
      } catch {}
    }
  } finally {
    claimTicketOnce.__busy = false;
  }
}


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

function setDisplay(slot, value){ const el = document.getElementById(`dsp${slot}`); if(el) el.value = value; }
window.dashboardCard = {
  setDisplay,
  getDisplays:()=> [1,2,3,4].map(i => document.getElementById(`dsp${i}`).value)
};


function loadPageWithDetails(dsp1val, dsp4val, imgsrc) {

  dashboardCard.setDisplay(1, dsp1val);
  dashboardCard.setDisplay(4, dsp4val);
 
    // logo + headline
  const logoIMG = document.getElementById('hdrLogo');
  if (logoIMG) logoIMG.src = imgsrc;
}

// ----- Boot -----
document.addEventListener('DOMContentLoaded', async () => {
  // 0) startup + optional nuke
  migrateLegacyStorage();
  const qs = new URLSearchParams(location.search);
  if (qs.get('nuke') === '1') {
    try { localStorage.removeItem('guest:ticketId'); } catch {}
    try { localStorage.removeItem('guest2:ticket'); } catch {}
    try { sessionStorage.removeItem('guest2:ticket'); } catch {}
    try { sessionStorage.removeItem('guest2:checkedIn'); } catch {}
    history.replaceState(null, '', location.pathname);
  }

  // 1) immediate paint of m1 without triggering proximity
  {
    const el = document.getElementById('metric1');
    if (el) {
      // If it's a number input, don't set a non-numeric value.
      const isInput = el.tagName === 'INPUT';
      const t = isInput ? (el.getAttribute('type') || '').toLowerCase() : '';
      if (isInput && t === 'number') {
        el.value = '';            // leave empty
        el.placeholder = '—';     // show dash as a placeholder
      } else {
        // For spans/divs etc. we can paint the dash
        if ('value' in el) el.value = '—'; else el.textContent = '—';
      }
    }
  }

  const stored = localStorage.getItem('guest:ticketId') ||
                 sessionStorage.getItem('guest2:ticket');
  if (stored) setM2(stored, { silent: true });

  // 2) fetch + poll NOW SERVING
  await refreshMetric1();               // calls setM1 -> evaluateProximity()
  setInterval(refreshMetric1, 2000);

  // 3) adopt/claim ticket
  await claimTicketOnce();              // calls setM2 -> evaluateProximity()

  const ticketId = Number(localStorage.getItem('guest:ticketId') ||
                          sessionStorage.getItem('guest2:ticket') || 0);
  if (ticketId && localStorage.getItem(checkedInKey(ticketId)) === '1') {
    hasCheckedIn = true;
    try { sessionStorage.setItem(CHECKED_IN_KEY, '1'); } catch {}
    changeActionGroupNotesHideButton('You’re checked in','Wait until <Your Number> matches <NOW SERVING>');
    evaluateProximity();
  }

  
  // 4) elements + visibility
  const actionGroup = document.getElementById('actionGroup');
  const actionBtn   = document.getElementById('actionBtn');   // "Check In"
  const leaveBtn    = document.getElementById('leaveBtn');    // "Leave Queue"
  actionGroup?.classList.remove('is-hidden');
  if (leaveBtn) leaveBtn.hidden = false;   // leave always visible on guest2


  // ---- define helper just before listeners ----
  function clearAndReturnHome() {
    try { sessionStorage.removeItem(SESSION_TICKET_KEY); } catch {}
    try { sessionStorage.removeItem(CHECKED_IN_KEY); } catch {}
    try { localStorage.removeItem(checkedInKey(m2)); } catch {}
    // LOCAL_TICKET_KEY was removed by the tab that left; no need to remove here
    window.location.href = 'guest_qCE_single_view.html?cleared=1';
  }

  window.addEventListener('storage', (e) => {
  // (1) Another tab just set the canonical ticket → adopt it here immediately
  if (e.key === LOCAL_TICKET_KEY && e.newValue) {
    const tid = Number(e.newValue);
    if (Number.isFinite(tid) && tid > 0) {
      setM2(tid); // updates #metric2 and runs evaluateProximity()

      // If that other tab already checked in, adopt that state too
      if (!hasCheckedIn && localStorage.getItem(checkedInKey(tid)) === '1') {
        hasCheckedIn = true;
        try { sessionStorage.setItem(CHECKED_IN_KEY, '1'); } catch {}
        changeActionGroupNotesHideButton(
          'You’re checked in',
          'Wait until <Your Number> matches <NOW SERVING>'
        );
        evaluateProximity();
      }
    }
    return; // done handling this event
  }

  // (2) Canonical ticket was removed in another tab → clear & go home
  if (e.key === LOCAL_TICKET_KEY && e.newValue === null) {
    clearAndReturnHome();
    return;
  }

  // (3) Checked-in mirror for *this* ticket was removed → clear & go home
  if (Number.isFinite(m2) && e.key === checkedInKey(m2) && e.newValue === null) {
    clearAndReturnHome();
    return;
  }

  // (4) Checked-in mirror for *this* ticket appeared → adopt checked-in
  if (Number.isFinite(m2) && e.key === checkedInKey(m2) && e.newValue === '1') {
    if (!hasCheckedIn) {
      hasCheckedIn = true;
      try { sessionStorage.setItem(CHECKED_IN_KEY, '1'); } catch {}
      changeActionGroupNotesHideButton(
        'You’re checked in',
        'Wait until <Your Number> matches <NOW SERVING>'
      );
      evaluateProximity();
    }
  }
});


  // 5) handlers (guest2-specific)
  actionBtn?.addEventListener('click', (e) => {
    e.preventDefault?.();
    if (hasCheckedIn) return;

    // Resolve ticket id *before* writing mirror
    const tid = Number(
      localStorage.getItem('guest:ticketId') ||
      (Number.isFinite(m2) ? m2 : 0)
    );
    if (!tid) return; // no ticket yet

    hasCheckedIn = true;
    actionBtn.setAttribute('disabled','disabled');

    // Per-tab flag (for refresh within this tab)
    try { sessionStorage.setItem('guest2:checkedIn', '1'); } catch {}

    // >>> THIS is the critical cross-tab mirror write <<<
    try { localStorage.setItem(checkedInKey(tid), '1'); } catch {}

    // Optional: BC for immediate UX; storage event still covers cross-tab
    try { (new BroadcastChannel('queue')).postMessage({ type: 'CHECKED_IN', ticketId: tid }); } catch {}

    changeActionGroupNotesHideButton(
      'You’re checked in',
      'Wait until <Your Number> matches <NOW SERVING>'
    );
    evaluateProximity();
  });

  leaveBtn?.addEventListener('click', (e) => {
    e.preventDefault?.();
    leaveBtn?.setAttribute('disabled','disabled');
    actionBtn?.setAttribute('disabled','disabled');

    const id = Number(localStorage.getItem('guest:ticketId') ||
                      sessionStorage.getItem('guest2:ticket') || 0);

    fetch('/api/queue/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: id, reason: 'user' })
    })
    .catch(err => console.warn('leave POST failed (non-fatal)', err))
    .finally(() => {
      try { sessionStorage.removeItem('guest2:ticket'); } catch {}
      try { sessionStorage.removeItem('guest2:checkedIn'); } catch {}
      try { localStorage.removeItem('guest:ticketId'); } catch {}
      try { localStorage.removeItem(checkedInKey(m2)); } catch {}
      try { (new BroadcastChannel('queue')).postMessage({ type: 'TICKET_CLEARED', ticketId: id }); } catch {}
      window.location.href = 'guest_qCE_single_view.html?cleared=1';
    });
  });


  // BroadcastChannel (queue)
  const qbc = ('BroadcastChannel' in window) ? new BroadcastChannel('queue') : null;
  if (qbc) {
    qbc.onmessage = (ev) => {
      if (!ev?.data) return;

      if (ev.data.type === 'CHECKED_IN' && Number(ev.data.ticketId) === m2) {
        if (!hasCheckedIn) {
          hasCheckedIn = true;
          try { sessionStorage.setItem(CHECKED_IN_KEY, '1'); } catch {}
          changeActionGroupNotesHideButton('You’re checked in','Wait until <Your Number> matches <NOW SERVING>');
          evaluateProximity();
        }
      }

      // If another tab with *my* ticket left, clear & return
      if (ev.data.type === 'TICKET_CLEARED' && Number(ev.data.ticketId) === m2) {
        clearAndReturnHome();
      }
    };
    window.addEventListener('beforeunload', () => qbc.close());
  }    
    


  // 6) settle once so visibility is correct after refresh
  evaluateProximity();
});

