console.log('readyState:', document.readyState);
console.log('script loaded from:', document.currentScript?.src);
console.log('metricValue1 in DOM?', !!document.getElementById('metricValue1'));

// elements
const metric1El = document.getElementById('metric1');  // element to display metric1
const metric2El = document.getElementById('metric2');  // element to display metric1
const actionGroup = document.getElementById('actionGroup');
const actionBtn   = document.getElementById('actionBtn');
const note1El     = document.getElementById('actionNote1');
const note2El     = document.getElementById('actionNote2');

// ----- threshold -----
const time2ChkIn = 3; // 👈 change to whatever "tickets ahead" you want


// const dsp1 = document.getElementById('dsp1');
const card = document.querySelector('.card');

// ===== small helpers =====
const BASE = location.origin;
function clampNum(v){ const n = parseInt(v,10); return Number.isFinite(n) ? Math.max(1,n) : 1; }
function getJSON(path, opts){
  const url = `${BASE}${path}`;
  return fetch(url, { cache:'no-store', ...opts }).then(r => {
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`); return r.json();
  });
}

// ----- helpers -----
function applyValue(el, val) {
  const n = parseInt(val, 10);
  const safe = Number.isFinite(n) ? Math.max(1, n) : 1;
  if (!el) return;
  if ('value' in el) el.value = safe; else el.textContent = String(safe);
}
async function getJSON(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

// ----- metric1 sync -----
async function refreshMetric1() {
  try {
    const { value } = await getJSON('/api/metric1', { cache: 'no-store' });
    applyValue(metric1El, value);
// inside guest2.js -> refreshMetric1 catch
} catch (e) {
  console.error('Guest2 metric1 fetch failed', e);
  const raw = localStorage.getItem('metric1');        // written by admin page
  if (raw) {
    try { applyValue(metric1El, JSON.parse(raw).value); } catch {}
  }
}
}

// Optional: instant same-device updates
const bc = 'BroadcastChannel' in window ? new BroadcastChannel('metric-sync') : null;
bc && (bc.onmessage = (e) => {
  if (e.data?.type === 'metric1') applyValue(metric1El, e.data.value);
});
window.addEventListener('beforeunload', () => bc?.close());

// ----- ticket claim (once per tab) -----
const SESSION_TICKET_KEY = 'guest2:ticket';
async function claimTicketOnce() {
  const existing = sessionStorage.getItem(SESSION_TICKET_KEY);
  if (existing) { applyValue(metric2El, existing); return; }
  try {
    const { value } = await getJSON('/api/next-ticket', { method: 'POST' });
    applyValue(metric2El, value);
    sessionStorage.setItem(SESSION_TICKET_KEY, String(value));
  } catch (e) {
    console.error('Guest2 ticket claim failed', e);
    try {
      const { value } = await getJSON('/api/peek-ticket');
      applyValue(metric2El, value);
    } catch {}
  }
}

function setDisplay(slot, value){ const el = document.getElementById(`dsp${slot}`); if(el) el.value = value; }
window.dashboardCard = {
  setDisplay,
  getDisplays:()=> [1,2,3,4].map(i => document.getElementById(`dsp${i}`).value)
};

// ----- boot -----
document.addEventListener('DOMContentLoaded', () => {
  refreshMetric1();
  setInterval(refreshMetric1, 2000);
  claimTicketOnce();
});


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

// control the centered action button + notes
function showActionGroup(note1 = '', note2 = '') {
  const g = document.getElementById('actionGroup');
  const n1 = document.getElementById('actionNote1');
  const n2 = document.getElementById('actionNote2');
  g?.classList.remove('is-hidden');
  if (n1) n1.textContent = note1;
  if (n2) n2.textContent = note2;
}
function hideActionGroup(){
  document.getElementById('actionGroup')?.classList.add('is-hidden');
}
function changeActionGroupNotesHideButton(note1 = '', note2 = '') {
  const b = document.getElementById('actionBtn');
  const n1 = document.getElementById('actionNote1');
  const n2 = document.getElementById('actionNote2');
  b.classList.add('is-hidden');
  if (n1) n1.textContent = note1;
  if (n2) n2.textContent = note2;
}



/* commenting out for now 8-31-2015 ebc
actionBtn.addEventListener('click', () => {
  changeActionGroupNotesHideButton('Place your order when', '<Your Number> matches <NOW SERVING>');
  setMetric(16);

  setTimeout(() => {
    setMetric(17);
  }, 5000);


  setTimeout(() => {
    setMetric(18);
    card.style.border = '2px solid #00ff55';
    changeActionGroupNotesHideButton('You have reached the front of the queue!', 'Go forth and order!');
  }, 10000);

}, 150);

*/


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

// Temporary instructions - maybe put in a function - for adding queue data
middleBtn.addEventListener('click', () => {

  middleBtn.classList.remove('show');
  dashboardCard.setDisplay(1, "qq00001");
  dashboardCard.setDisplay(2, "08/10/2025");
  dashboardCard.setDisplay(3, "EST");
  dashboardCard.setDisplay(4, "Street Burger");
  dashboardCard.setDisplay(5, "11:00");
  dashboardCard.setDisplay(6, "19:00");

  showActionGroup('It is time to head to the queue', 'Click on <Check In> when you arrive' )

// wait 15 seconds - NEED COMMAND

  // update the headlines directly
//  document.getElementById("headline").textContent = "Event Number One";
  
  // commenting out because we don't reset that
  // document.getElementById("subhead2").textContent = "NOW SERVING";
});
