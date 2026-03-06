/* ─────────────────────────────────────────
   pond-gallery.js — KitsCodes
   Substitua os campos src/title/year/location/desc
   com as suas imagens reais em /images/
───────────────────────────────────────── */

const IMAGES = [
  {
    id: 1,
    src: "images/senna.jpg",
    title: "Senna McLaren",
    year: "2024",
    location: "Assetto Corsa",
    desc: "A classic automotive capture featuring the legendary McLaren Senna, showcasing its aggressive design and racing heritage.",
    rotation: -6, x: 40,  y: 60,
  },
  {
    id: 2,
    src: "images/gt3rs.jpg",
    title: "GT3 RS Porsche",
    year: "2024",
    location: "Assetto Corsa / Nurburgring",
    desc: "A dynamic shot of the Porsche GT3 RS in action on the Nurburgring, highlighting its aerodynamic features and beautiful design.",
    rotation: 5, x: 300, y: 40,
  },
  {
    id: 3,
    src: "images/gt3.jpg",
    title: "BMW Z4 GT3",
    year: "2024",
    location: "Assetto Corsa / Spa-Francorchamps",
    desc: "A low to the ground fast shot of the BMW Z4 GT3 in action at Spa-Francorchamps, showcasing its performance and agressiveness.",
    rotation: 5, x: 220, y: 240,
  },
  {
    id: 4,
    src: "images/laferrari.png",
    title: "LaFerrari",
    year: "2024",
    location: "Assetto Corsa",
    desc: "The iconic hybrid hypercar LaFerrari in all its glory, combining cutting-edge technology with timeless Ferrari elegance.",
    rotation: -8, x: 480, y: 280,
  },
  {
    id: 5,
    src: "images/mclaren1.jpg",
    title: "McLaren",
    year: "2024",
    location: "Assetto Corsa",
    desc: "A stunning McLaren capturing the essence of modern automotive engineering and performance.",
    rotation: 3, x: 120, y: 320,
  },
  {
    id: 6,
    src: "images/p992.jpg",
    title: "Porsche 992",
    year: "2024",
    location: "Assetto Corsa",
    desc: "The next generation Porsche 911, blending tradition with innovation in a stunning automotive masterpiece.",
    rotation: -5, x: 580, y: 120,
  },
  {
    id: 7,
    src: "images/speedtail.jpg",
    title: "McLaren Speedtail",
    year: "2024",
    location: "Assetto Corsa",
    desc: "The ultimate expression of McLaren's engineering prowess, the Speedtail represents peak automotive performance.",
    rotation: 7, x: 350, y: 380,
  },
  /* ── Add more images below ──
     Copy this block for each new photo.
     Adjust x/y to spread leaves around the space.
     rotation: angle in degrees (positive or negative)
     w/h: optional width and height in pixels (will be randomized if omitted)

  {
    id: 8,
    src: "images/your-photo.jpg",
    title: "Photo Title",
    year: "2024",
    location: "Game / Location",
    desc: "A brief description of the image.",
    rotation: 5, x: 300, y: 40,
  },
  */
];

const RIPPLE_DURATION = 1200;
const FRICTION  = 0.88;
const MIN_SPEED = 0.3;

/* ── State ── */
function randomize(img) {
  const pond   = document.getElementById('pond');
  const pw     = pond ? pond.offsetWidth  : 800;
  const ph     = pond ? pond.offsetHeight : 500;
  const w      = img.w || Math.round(180 + Math.random() * 120); // 180–300px
  const h      = img.h || Math.round(140 + Math.random() * 100); // 140–240px
  const pad    = 20; // margem para não cortar as folhas nas bordas
  const x      = Math.random() * (pw - w) + pad;
  const y      = Math.random() * (ph - h) + pad;
  const rotation = (Math.random() * 24) - 12;                    // -12° a +12°
  return { ...img, x, y, w, h, rotation, vx: 0, vy: 0 };
}

let items      = IMAGES.map(randomize);
let dragging   = null;
let dragMoved  = false;
let selectedId = null;
let animating  = new Set();

/* ── DOM refs ── */
const leafLayer   = document.getElementById('leaf-layer');
const rippleLayer = document.getElementById('ripple-layer');
const overlay     = document.getElementById('detail-overlay');
const detailImg   = document.getElementById('detail-img');
const detailMeta  = document.getElementById('detail-meta');
const detailTitle = document.getElementById('detail-title');
const detailDesc  = document.getElementById('detail-desc');
const detailClose = document.getElementById('detail-close');
const hint        = document.getElementById('hint');

/* ── Build leaves ── */
function buildLeaves() {
  leafLayer.innerHTML = '';
  items.forEach(item => {
    const el = document.createElement('div');
    el.className  = 'leaf';
    el.dataset.id = item.id;
    applyLeafStyle(el, item, false);
    el.innerHTML = `
      <div class="leaf-inner">
        <img src="${item.src}" alt="${item.title}" draggable="false" />
        <div class="leaf-vein"></div>
        <div class="leaf-shimmer"></div>
      </div>
      <div class="leaf-stem" style="transform: rotate(${-item.rotation * 0.5}deg)"></div>
    `;
    el.addEventListener('mousedown', onLeafMouseDown);
    leafLayer.appendChild(el);
  });
}

function applyLeafStyle(el, item, isSelected) {
  el.style.left      = item.x + 'px';
  el.style.top       = item.y + 'px';
  el.style.width     = item.w + 'px';
  el.style.height    = item.h + 'px';
  el.style.transform = `rotate(${item.rotation}deg) scale(${isSelected ? 1.04 : 1})`;
  el.style.zIndex    = isSelected ? 50 : 1;
  el.classList.toggle('selected', isSelected);
}

function syncLeaf(item) {
  const el = leafLayer.querySelector(`[data-id="${item.id}"]`);
  if (!el) return;
  applyLeafStyle(el, item, item.id === selectedId);
}

/* ── Drag ── */
function onLeafMouseDown(e) {
  e.preventDefault();
  const id   = parseInt(this.dataset.id);
  const item = items.find(i => i.id === id);

  animating.delete(id);
  item.vx = 0;
  item.vy = 0;

  dragMoved = false;
  dragging  = {
    id,
    startX: e.clientX, startY: e.clientY,
    origX:  item.x,    origY:  item.y,
    lastX:  e.clientX, lastY:  e.clientY,
    lastT:  performance.now(),
    vx: 0, vy: 0,
  };
}

document.addEventListener('mousemove', e => {
  if (!dragging) return;
  const dx = e.clientX - dragging.startX;
  const dy = e.clientY - dragging.startY;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;

  const now = performance.now();
  const dt  = Math.max(now - dragging.lastT, 1);
  dragging.vx = (e.clientX - dragging.lastX) / dt * 16;
  dragging.vy = (e.clientY - dragging.lastY) / dt * 16;
  dragging.lastX = e.clientX;
  dragging.lastY = e.clientY;
  dragging.lastT = now;

  const item = items.find(i => i.id === dragging.id);
  item.x = dragging.origX + dx;
  item.y = dragging.origY + dy;
  syncLeaf(item);
});

document.addEventListener('mouseup', e => {
  if (!dragging) return;
  const { id, vx, vy } = dragging;
  dragging = null;

  addRipple(e.clientX, e.clientY);
  bringToFront(id);

  if (!dragMoved) {
    openDetail(id);
    return;
  }

  const item = items.find(i => i.id === id);
  item.vx = vx || 0;
  item.vy = vy || 0;
  if (Math.abs(item.vx) > 0.1 || Math.abs(item.vy) > 0.1) {
    animating.add(id);
    requestAnimationFrame(inertiaLoop);
  }
});

/* ── Inércia ── */
function inertiaLoop() {
  if (animating.size === 0) return;
  animating.forEach(id => {
    const item = items.find(i => i.id === id);
    if (!item) { animating.delete(id); return; }
    item.vx *= FRICTION;
    item.vy *= FRICTION;
    item.x  += item.vx;
    item.y  += item.vy;
    syncLeaf(item);
    if (Math.abs(item.vx) < MIN_SPEED && Math.abs(item.vy) < MIN_SPEED) {
      item.vx = 0; item.vy = 0;
      animating.delete(id);
    }
  });
  if (animating.size > 0) requestAnimationFrame(inertiaLoop);
}

/* ── Bring to front ── */
function bringToFront(id) {
  const el = leafLayer.querySelector(`[data-id="${id}"]`);
  if (el) leafLayer.appendChild(el);
}

/* ── Detail panel ── */
function openDetail(id) {
  selectedId = id;
  const item = items.find(i => i.id === id);
  detailImg.src            = item.src;
  detailImg.alt            = item.title;
  detailMeta.textContent   = `${item.year} · ${item.location}`;
  detailTitle.textContent  = item.title;
  detailDesc.textContent   = item.desc;
  overlay.classList.remove('hidden');
  hint.classList.add('hidden');
  syncLeaf(item);
}

function closeDetail() {
  if (selectedId !== null) {
    const item = items.find(i => i.id === selectedId);
    selectedId = null;
    syncLeaf(item);
  }
  overlay.classList.add('hidden');
  hint.classList.remove('hidden');
  overlay.style.animation = 'none';
  requestAnimationFrame(() => { overlay.style.animation = ''; });
}

detailClose.addEventListener('click', closeDetail);
overlay.addEventListener('click', e => { if (e.target === overlay) closeDetail(); });

/* ── Fullscreen ── */
const fullscreenOverlay = document.getElementById('fullscreen-overlay');
const fullscreenImg     = document.getElementById('fullscreen-img');
const fullscreenMeta    = document.getElementById('fullscreen-meta');
const fullscreenTitle   = document.getElementById('fullscreen-title');
const fullscreenDesc    = document.getElementById('fullscreen-desc');
const fullscreenClose   = document.getElementById('fullscreen-close');
const detailExpand      = document.getElementById('detail-expand');

function openFullscreen() {
  const item = items.find(i => i.id === selectedId);
  if (!item) return;
  // Troca para imagem de alta qualidade removendo parâmetros de resize da URL
  fullscreenImg.src          = item.src.replace(/\?.*$/, '');
  fullscreenImg.alt          = item.title;
  fullscreenMeta.textContent = `${item.year} · ${item.location}`;
  fullscreenTitle.textContent = item.title;
  fullscreenDesc.textContent  = item.desc;
  fullscreenOverlay.classList.remove('hidden');
}

function closeFullscreen() {
  fullscreenOverlay.classList.add('hidden');
  fullscreenOverlay.style.animation = 'none';
  requestAnimationFrame(() => { fullscreenOverlay.style.animation = ''; });
}

detailExpand.addEventListener('click', openFullscreen);
fullscreenClose.addEventListener('click', closeFullscreen);
fullscreenOverlay.addEventListener('click', e => { if (e.target === fullscreenOverlay) closeFullscreen(); });

// Fechar com ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!fullscreenOverlay.classList.contains('hidden')) closeFullscreen();
    else if (!overlay.classList.contains('hidden')) closeDetail();
  }
});

/* ── Ripples ── */
function addRipple(clientX, clientY) {
  const rect = document.getElementById('pond').getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const group = document.createElement('div');
  group.className  = 'ripple-group';
  group.style.left = x + 'px';
  group.style.top  = y + 'px';
  for (let i = 0; i < 3; i++) {
    const ring = document.createElement('div');
    ring.className = 'ripple-ring';
    group.appendChild(ring);
  }
  rippleLayer.appendChild(group);
  setTimeout(() => group.remove(), RIPPLE_DURATION + 400);
}

/* ── Ripple em qualquer clique dentro do pond ── */
document.addEventListener('DOMContentLoaded', () => {
  // Inicializa com posições aleatórias agora que o DOM existe
  items = IMAGES.map(randomize);

  let lastRipple = 0;
  const RIPPLE_COOLDOWN = 300; // ms entre ripples no fundo

  document.getElementById('pond').addEventListener('click', e => {
    if (e.target.closest('.leaf')) return;
    const now = Date.now();
    if (now - lastRipple < RIPPLE_COOLDOWN) return;
    lastRipple = now;
    addRipple(e.clientX, e.clientY);
  });
  buildLeaves();
});