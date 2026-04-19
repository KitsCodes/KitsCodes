/* ─────────────────────────────────────────
   showcase.js — KitsCodes
   Galeria com imagem principal + miniaturas
───────────────────────────────────────── */

const SHOWCASE_IMAGES = [
  {
    id: 1,
    src: "images/senna.jpg",
    title: "Senna McLaren",
    year: "2024",
    location: "Assetto Corsa",
    desc: "Edited by me.",
  },
  /* ── Adicione suas fotos abaixo ──
  {
    id: 2,
    src: "images/sua-foto.jpg",
    title: "Título",
    year: "2024",
    location: "Local / Jogo",
    desc: "Descrição da foto.",
  },
  */
  {
    id: 1001,
    src: "images/bmwgt3.png",
    title: "BMW M3 Touring GT3 EVO",
    year: "2026",
    location: "Assetto",
    desc: "Edited by me.",
  },
  {
    id: 1002,
    src: "images/ford.png",
    title: "Ford Mustang GT3",
    year: "2023",
    location: "24H of Le Mans",
    desc: "Edited by me. <3",
  },
];

/* ── DOM refs ── */
const showcaseMain     = document.getElementById('showcase-main');
const showcaseThumbs   = document.getElementById('showcase-thumbs');
const showcaseMeta     = document.getElementById('showcase-info-meta');
const showcaseTitle    = document.getElementById('showcase-info-title');
const showcaseDesc     = document.getElementById('showcase-info-desc');

let activeId = null;

/* ── Seleciona uma imagem ── */
function selectImage(id) {
  const item = SHOWCASE_IMAGES.find(i => i.id === id);
  if (!item) return;
  activeId = id;

  // Fade na troca
  showcaseMain.style.opacity = '0';
  setTimeout(() => {
    showcaseMain.src           = item.src;
    showcaseMain.alt           = item.title;
    showcaseMeta.textContent   = `${item.year} · ${item.location}`;
    showcaseTitle.textContent  = item.title;
    showcaseDesc.textContent   = item.desc;
    showcaseMain.style.opacity = '1';
  }, 180);

  // Atualiza miniatura ativa
  document.querySelectorAll('.showcase-thumb').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.id) === id);
  });
}

/* ── Constrói as miniaturas ── */
function buildShowcase() {
  if (!SHOWCASE_IMAGES.length) return;

  showcaseThumbs.innerHTML = '';
  SHOWCASE_IMAGES.forEach(item => {
    const thumb = document.createElement('div');
    thumb.className   = 'showcase-thumb';
    thumb.dataset.id  = item.id;
    thumb.title       = item.title;
    thumb.innerHTML   = `<img src="${item.src}" alt="${item.title}" draggable="false" />`;
    thumb.addEventListener('click', () => selectImage(item.id));
    showcaseThumbs.appendChild(thumb);
  });

  // Seleciona a primeira por padrão
  selectImage(SHOWCASE_IMAGES[0].id);
}

/* ── Navegação por teclado ── */
document.addEventListener('keydown', e => {
  if (!SHOWCASE_IMAGES.length) return;
  const idx = SHOWCASE_IMAGES.findIndex(i => i.id === activeId);
  if (e.key === 'ArrowRight' && idx < SHOWCASE_IMAGES.length - 1) {
    selectImage(SHOWCASE_IMAGES[idx + 1].id);
  }
  if (e.key === 'ArrowLeft' && idx > 0) {
    selectImage(SHOWCASE_IMAGES[idx - 1].id);
  }
});

/* ── Init ── */
document.addEventListener('DOMContentLoaded', buildShowcase);