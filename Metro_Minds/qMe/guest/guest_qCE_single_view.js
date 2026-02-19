// Hoisted: legacy key migration for guest1
function migrateLegacyStorage() {
  try {
    const legacyLocal = localStorage.getItem('guest2:ticket');
    const canonLocal  = localStorage.getItem('guest:ticketId');
    if (!canonLocal && legacyLocal) {
      localStorage.setItem('guest:ticketId', legacyLocal);
      localStorage.removeItem('guest2:ticket');
    }
  } catch {}
}

const LOCAL_TICKET_KEY    = 'guest:ticketId';
const SESSION_TICKET_KEY  = 'guest2:ticket';

function getStoredTicket() {
  return (
    localStorage.getItem(LOCAL_TICKET_KEY) ||
    sessionStorage.getItem(SESSION_TICKET_KEY) ||
    ""
  );
}

function setNotes(n1 = '', n2 = '') {
  const note1 = document.getElementById('actionNote1');
  const note2 = document.getElementById('actionNote2');
  if (note1) note1.textContent = n1;
  if (note2) note2.textContent = n2;
}

function updateUIFromTicket() {
  const actionBtn  = document.getElementById('actionBtn');
  const leaveBtn   = document.getElementById('leaveBtn');
  const t = getStoredTicket();

  if (t) {
    if (actionBtn) actionBtn.textContent = 'Re-Join Queue';
    if (leaveBtn)  leaveBtn.hidden = false;
 
    // Use the two note lines instead of #ticketInfo
    setNotes(`You are already in the queue with ticket: ${t}`, '');

  } else {
    if (actionBtn) actionBtn.textContent = 'Join Queue';
    if (leaveBtn)  leaveBtn.hidden = true;
    setNotes('', ''); // clear notes
  }
}

async function leaveQueueFromGuest1(reason='user') {
  const t = getStoredTicket();
  try {
    if (t) {
      await fetch('/api/queue/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: Number(t), reason })
      });
    }
  } catch {}
  try { localStorage.removeItem(LOCAL_TICKET_KEY); } catch {}
  try { sessionStorage.removeItem(SESSION_TICKET_KEY); } catch {}

  // Cross-tab notify (best effort)
  try {
    const qbc = ('BroadcastChannel' in window) ? new BroadcastChannel('queue') : null;
    qbc?.postMessage({ type: 'TICKET_CLEARED' });
    qbc?.close();
  } catch {}

  updateUIFromTicket();
}

// Keep arrow click-to-increment behavior
const metric1El = document.getElementById('metric1');  // element to display metric1
const dsp1 = document.getElementById('dsp1');

// ----- helpers -----
function applyValue(el, v) {
  if (!el) return;
  const s = String(v);
  if ('value' in el) el.value = s;
  else el.textContent = s;
}

async function getJSON(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

async function refreshMetric1() {
  try {
    const { value } = await getJSON('/api/metric1', { cache: 'no-store' });
    applyValue(metric1El, Number(value) || 1);
  } catch (e) {
    console.error('Guest1 metric1 fetch failed', e);
    // If first paint is still empty, force a visible default
    if (!metric1El?.textContent && !('value' in metric1El && metric1El.value)) {
      applyValue(metric1El, 1);
    }
  }
}
// Optional: instant same-device updates (if admin broadcasts)
const bc = 'BroadcastChannel' in window ? new BroadcastChannel('metric-sync') : null;
bc && (bc.onmessage = (e) => {
  if (e.data?.type === 'metric1') applyValue(metric1El, e.data.value);
});
window.addEventListener('beforeunload', () => bc?.close());


function loadPageWithDetails(dsp1val, dsp4val, imgsrc, text1, text2) {

  dashboardCard.setDisplay(1, dsp1val);
  dashboardCard.setDisplay(4, dsp4val);
  
  setMiniText(text1, text2);
  setMiniImage(imgsrc);
}

// ----- boot -----
document.addEventListener('DOMContentLoaded', async () => {
  // handle ?cleared=1 safety (guest2 redirects here after leave/auto-leave)
  const qs = new URLSearchParams(location.search);
  if (qs.get('cleared') === '1') {
    try { localStorage.removeItem('guest:ticketId'); } catch {}
    try { sessionStorage.removeItem('guest2:ticket'); } catch {}
    try { sessionStorage.removeItem('guest2:checkedIn'); } catch {}
    history.replaceState(null, '', location.pathname);
  }
  
  migrateLegacyStorage();

  // 2) draw metric1, wire Join/Re-Join/Leave, then:
  updateUIFromTicket();

  // paint then fetch + poll NOW SERVING
  applyValue(metric1El, 1);
  try { await refreshMetric1(); } catch {}
  setInterval(refreshMetric1, 2000);

  const text1 = 'Everything at Luna is made from scratch with care including';
  const text2 = 'artisan coffee and pastries, fresh soups, salads, paninis, grain bowls, crêpes, and egg dishes.';
  loadPageWithDetails('qq000001', 'Luna Bakery', 'lunaLogo.jpg', text1, text2);

  // Join/Re-Join -> go to guest2 (deep-link resume when ticket exists)
  const actionBtn = document.getElementById('actionBtn');
  actionBtn?.addEventListener('click', () => {
    const url = new URL('./guest_queue_ticket.html', location.href);
    const t = localStorage.getItem('guest:ticketId') ||
              sessionStorage.getItem('guest2:ticket');
    if (t) url.searchParams.set('resume', '1');
    location.assign(url.toString());
  });

  // Optional: leave from guest1
  const leaveBtn = document.getElementById('leaveBtn');
  leaveBtn?.addEventListener('click', async (e) => {
    e.preventDefault?.();
    const id = Number(localStorage.getItem('guest:ticketId') ||
                      sessionStorage.getItem('guest2:ticket') || 0);
    if (id) {
      try {
        await fetch('/api/queue/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: id, reason: 'user' })
        });
      } catch (e) { console.warn('leave POST failed (non-fatal)', e); }
    }
    try { sessionStorage.removeItem('guest2:ticket'); } catch {}
    try { sessionStorage.removeItem('guest2:checkedIn'); } catch {}
    try { localStorage.removeItem('guest:ticketId'); } catch {}
    try { (new BroadcastChannel('queue')).postMessage({ type: 'TICKET_CLEARED' }); } catch {}
    updateUIFromTicket();
  });



  // Cross-tab sync: when guest2 clears, reflect it
  const qbc = ('BroadcastChannel' in window) ? new BroadcastChannel('queue') : null;
  if (qbc) {
    qbc.onmessage = (ev) => {
      if (ev?.data?.type === 'TICKET_CLEARED') updateUIFromTicket();
    };
    window.addEventListener('beforeunload', () => qbc.close());
  }
});



function setDisplay(slot, value){ const el = document.getElementById(`dsp${slot}`); if(el) el.value = value; }
window.dashboardCard = {
  setDisplay,
  getDisplays:()=> [1,2,3,4].map(i => document.getElementById(`dsp${i}`).value)
};

const middleBtn = document.getElementById('middleBtn');
let hideTimer;

middleBtn.addEventListener('mouseenter', () => {
  middleBtn.classList.add('show');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    middleBtn.classList.remove('show');
  }, 1000);                        // stays visible ~1s
});

middleBtn.addEventListener('mouseleave', () => {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    middleBtn.classList.remove('show');
  }, 150);                         // quick hide when you leave
});

// Simple API to update the two lines from your code
function setMiniText(line1, line2) {
  const l1 = document.getElementById('miniLine1');
  const l2 = document.getElementById('miniLine2');
  if (l1) l1.textContent = line1;
  if (l2) l2.textContent = line2;
}

// (Optional) convenience helpers
function setMiniLine1(text = '') {
  const el = document.getElementById('miniLine1');
  if (el) el.textContent = text;
}
function setMiniLine2(text = '') {
  const el = document.getElementById('miniLine2');
  if (el) el.textContent = text;
}

// Update the mini image dynamically
function setMiniImage(filename) {
  const img = document.getElementById('miniImg');
  console.log(img);
  if (img) img.src = `images/${filename}`;
  console.log(filename);
}

const menuBtn      = document.getElementById('menuBtn');
const menuPanel    = document.getElementById('menuPanel');
const menuBackdrop = document.getElementById('menuBackdrop');

function openMenu(){
  menuPanel.hidden = false;
  menuBackdrop.hidden = false;
  // let the browser paint before adding .open for smooth transition
  requestAnimationFrame(() => menuPanel.classList.add('open'));
  menuBtn.classList.add('is-open');
  menuBtn.setAttribute('aria-expanded','true');
}
function closeMenu(){
  menuPanel.classList.remove('open');
  menuBtn.classList.remove('is-open');
  menuBtn.setAttribute('aria-expanded','false');
}
menuPanel?.addEventListener('transitionend', () => {
  if (!menuPanel.classList.contains('open')) {
    menuPanel.hidden = true;
    menuBackdrop.hidden = true;
  }
});

menuBtn?.addEventListener('click', () => {
  const isOpen = menuPanel.classList.contains('open');
  isOpen ? closeMenu() : openMenu();
});
menuBackdrop?.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuPanel.classList.contains('open')) closeMenu();
});


