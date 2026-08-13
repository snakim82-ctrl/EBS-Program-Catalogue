const PROGRAMS = window.__PROGRAMS__.slice().sort(
  (a, b) => (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0)
);

const grid = document.getElementById('grid');
const lightbox = document.getElementById('lightbox');
const lbVideo = document.getElementById('lightboxVideo');
const lbTitle = document.getElementById('lbTitle');
const lbSub = document.getElementById('lbSub');
const lbKicker = document.getElementById('lbKicker');
const lbSynopsis = document.getElementById('lbSynopsis');

function cardMarkup(p, i) {
  const thumb = p.thumb
    ? `<img class="card-thumb" src="${p.thumb}" alt="${p.titleEn}" loading="lazy" />`
    : `<div class="card-thumb card-thumb--empty" style="--accent:${p.accent}"><span>${p.titleEn}</span></div>`;
  return `
    <article class="card" tabindex="0" data-index="${i}" style="--accent:${p.accent}">
      <div class="card-media">
        ${thumb}
        <span class="card-badge">${p.year || ''}</span>
        <div class="card-caption">
          <h3>${p.titleEn}</h3>
        </div>
        <div class="play-ring" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
      </div>
    </article>`;
}

grid.innerHTML = PROGRAMS.map(cardMarkup).join('\n');

grid.querySelectorAll('.card').forEach((card) => {
  const i = Number(card.getAttribute('data-index'));
  card.addEventListener('click', () => openCard(i));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') openCard(i);
  });
});

function openCard(i) {
  const p = PROGRAMS[i];
  lbKicker.textContent = p.genre || '';
  lbKicker.style.color = p.accent;
  lbTitle.textContent = p.titleEn;
  lbSub.textContent = p.year || '';
  lbSynopsis.textContent = p.synopsis || '';
  lbVideo.src = p.video;
  lightbox.classList.remove('hidden');
}

function closeLightbox() {
  lbVideo.pause();
  lbVideo.removeAttribute('src');
  lightbox.classList.add('hidden');
}

document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
