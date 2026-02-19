// Keep arrow click-to-increment behavior
const metric1El = document.getElementById('metric1');  // element to display metric1
const dsp1 = document.getElementById('dsp1');

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

async function refreshMetric1() {
  try {
    const { value } = await getJSON('/api/metric1', { cache: 'no-store' });
    applyValue(metric1El, value);
  } catch (e) {
    console.error('Guest1 metric1 fetch failed', e);
  }
}

// Optional: instant same-device updates (if admin broadcasts)
const bc = 'BroadcastChannel' in window ? new BroadcastChannel('metric-sync') : null;
bc && (bc.onmessage = (e) => {
  if (e.data?.type === 'metric1') applyValue(metric1El, e.data.value);
});
window.addEventListener('beforeunload', () => bc?.close());

// ----- boot -----
document.addEventListener('DOMContentLoaded', () => {
  refreshMetric1();                  // load once
  setInterval(refreshMetric1, 2000); // keep synced cross-device
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

const actionBtn = document.getElementById('actionBtn');

actionBtn?.addEventListener('click', () => {
  setTimeout(() => {
    const url = new URL('./guest_queue_ticket.html', window.location.href);
    window.location.assign(url.toString());
  }, 150);
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

/*
// Temporary instructions - maybe put in a function - for adding queue data
middleBtn.addEventListener('click', () => {
  setMetric1(7);
  middleBtn.classList.remove('show');
  dashboardCard.setDisplay(1, "qq00001");
  dashboardCard.setDisplay(2, "08/10/2025");
  dashboardCard.setDisplay(3, "EST");
  dashboardCard.setDisplay(4, "Street Burger");
  dashboardCard.setDisplay(5, "11:00");
  dashboardCard.setDisplay(6, "19:00");

  setMiniText('Streetburger has fantastic burgers grilled fresh', 'They also have amazing fries');
  setMiniImage('streetburger.jpg');

  // update the headlines directly
//  document.getElementById("headline").textContent = "Event Number One";
  
  // commenting out because we don't reset that
  // document.getElementById("subhead2").textContent = "NOW SERVING";
});
*/

