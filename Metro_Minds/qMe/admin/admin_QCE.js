// Keep arrow click-to-increment behavior
const leftBtn = document.getElementById('leftArrow');
const rightBtn = document.getElementById('rightArrow');
const metricInput = document.getElementById('metricValue');  // your admin input for metric1
const dsp1 = document.getElementById('dsp1');
const logoIMG = document.getElementById("hdrLogo");
const ticketEl = document.querySelector('#ticketCounter'); // e.g., <span id="ticketCounter"></span>

// running values we keep in sync
let nowServing = 1;   // metric1
let lastIssued = 0;   // /api/peek-ticket

function updateQueueCount() {
  // # in Queue = lastIssued - nowServing (never below 0)
  const q = Math.max(0, ((Number(lastIssued) || 0) - (Number(nowServing)) + 1 || 1));
  const dsp2 = document.getElementById('dsp2');
  if (dsp2) dsp2.value = String(q);
}


// Optional instant same-device sync (doesn't replace server polling)
const bc = 'BroadcastChannel' in window ? new BroadcastChannel('metric-sync') : null;
function broadcastMetric1(val) {
  bc?.postMessage({ type: 'metric1', value: val, ts: Date.now() });
}

if (bc) {
  bc.onmessage = (ev) => {
    if (ev?.data?.type === 'metric1') {
      const v = Number(ev.data.value) || 1;
      if (metricInput) metricInput.value = v;
      nowServing = v;
      updateQueueCount();
    }
  };
}

window.addEventListener('beforeunload', () => bc?.close());

async function refreshMetric1UI() {
  try {
    const r = await fetch('/api/metric1');
    const { value } = await r.json();
    if (metricInput) metricInput.value = value;
    nowServing = Number(value) || 1;
    updateQueueCount();
  } catch (e) {
    console.error('metric1 fetch failed:', e);
  }
}

async function refreshTicketUI() {
  try {
    const r = await fetch('/api/peek-ticket');
    const { value } = await r.json();
    if (ticketEl) ticketEl.textContent = value;   // keep your existing UI
    lastIssued = Number(value) || 0;
    updateQueueCount();
  } catch (e) {
    console.error('peek failed:', e);
  }
}


// Helper functions to get and set the metric value safely
function getMetric(){
  return safeInt(metricInput.value);
}
// Safety setter: clamp to >= 1 and sync your app state
function setMetric(val){
  const n = parseInt(val,10);
  const safe = Number.isFinite(n) ? Math.max(1,n) : 1;
  metricInput.value = safe;
  nowServing = safe;           // <-- add this line
  updateQueueCount();          // <-- and this line (instant UI)
  postJSON('/api/metric1', { value: safe }).catch(console.error);
  broadcastMetric1?.(safe); // if you implemented BroadcastChannel
}

let lastApplied = null;

function applyMetricFromUI() {
  const v = metricInput.value;
  if (v === lastApplied) return;   // skip duplicate work
  lastApplied = v;
  setMetric(v);
}

metricInput?.addEventListener('change', applyMetricFromUI);
metricInput?.addEventListener('blur', applyMetricFromUI);

// Helper: updates the metric by a given change (+1 or -1)
function updateMetric(delta) {
  const prev = getMetric();
  const next = Math.max(1, prev + (parseInt(delta, 10) || 0));
  if (next !== prev) setMetric(next);
  console.log(`Metric updated: ${prev} → ${next}`);
}


// Buttons
leftBtn?.addEventListener('click', () => updateMetric(-1));
rightBtn?.addEventListener('click', () => updateMetric(1));

// (optional) allow arrow keys to adjust value, without the native spinners
metricInput?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp')   { e.preventDefault(); updateMetric(1); }
  if (e.key === 'ArrowDown') { e.preventDefault(); updateMetric(-1); }
});

function setDisplay(slot, value){ const el = document.getElementById(`dsp${slot}`); if(el) el.value = value; }
window.dashboardCard = {
  setMetric,
  getMetric,
  setDisplay,
  getDisplays:()=> [1,2,3,4].map(i => document.getElementById(`dsp${i}`).value)
};

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

// legacy: lost-count polling removed

function loadPageWithDetails(dsp1val, dsp4val, imgsrc, h1val) {

  dashboardCard.setDisplay(1, dsp1val);
  dashboardCard.setDisplay(4, dsp4val);
  
  // get rid of the text and hide dsp3 and dsp6
  // the text is the labels for the html was removed
  // it was dsp3 label = mins/guest, dsp6 label was $ per guest
  // don't have those functions yet so just hiding
  dashboardCard.setDisplay(3, "");
  dashboardCard.setDisplay(6, "");

  document.getElementById(`dsp3`).hidden = true;
  document.getElementById(`dsp6`).hidden = true;


  // logo + headline
  const logoIMG = document.getElementById('hdrLogo');
  if (logoIMG) logoIMG.src = imgsrc;

  const h1 = document.getElementById('headline');
  if (h1) h1.textContent = h1val;

}


// Initial load + (optional) polling
document.addEventListener('DOMContentLoaded', () => {
  refreshMetric1UI();   // loads metric1 once
  refreshTicketUI();    // loads ticket once
  setInterval(refreshTicketUI, 2000); // keep ticket fresh; metric1 usually set by admin

  loadPageWithDetails('qq000001', 'Luna Bakery', 'images/lunaLogo.jpg', 'Cedar Hill Luna Sunday');

  // legacy lost-count polling removed (handled by Supabase-backed admin views)
});


let hideTimer;


const middleBtn   = document.querySelector('#middleBtn');    // reset ticket button

function safeInt(val) {
  const n = parseInt(val, 10);
  return Number.isFinite(n) ? Math.max(1, n) : 1;
}

async function postJSON(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

// Reset the shared ticket counter to 0
middleBtn?.addEventListener('click', async () => {

  try {
      await postJSON('/api/reset-ticket', {});
      setMetric(1);
      await refreshTicketUI();          // << update the UI after reset
      console.log('Ticket counter reset and metric1 set to 1');
    } catch (e) {
      console.error('Reset failed', e);
    }
});



// use the code to reset a queue - something coming up
// 
(async () => {
  try {
    const r = await fetch('/api/metric1');
    const { value } = await r.json();
    metricInput.value = value;
  } catch {}
})();

middleBtn?.addEventListener('mouseenter', () => {
  middleBtn.classList.add('show');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    middleBtn.classList.remove('show');
  }, 1000);                        // stays visible ~1s
});

middleBtn?.addEventListener('mouseleave', () => {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    middleBtn.classList.remove('show');
  }, 150);                         // quick hide when you leave
});


// Temporary instructions - maybe put in a function - for adding queue data
// using this as way to reset (would be one time thing for queue?)
// when doing this, want to set lastTicketNumber to zero
/* middleBtn.addEventListener('click', () => {
  setMetric(1);
  middleBtn.classList.remove('show');

// demonstration of ability to change elments on screen - here forced
  dashboardCard.setDisplay(1, "qq00001");
  dashboardCard.setDisplay(2, "22");
  dashboardCard.setDisplay(3, "3.3");
  dashboardCard.setDisplay(4, "Street Burger");
  dashboardCard.setDisplay(5, "8");
  dashboardCard.setDisplay(6, "$8.75");

  logoIMG.src = "images/streetburger.jpg";

  
  // update the headlines directly
  document.getElementById("headline").textContent = "Event Number One";

  // code added to try to save value in place guest side can retrieve 8-31-2025 ebc
  // Persist so guest can see it (and to survive reloads)
  localStorage.setItem('lastTickNum', JSON.stringify({ value: 0, ts: Date.now() }));

}); */

