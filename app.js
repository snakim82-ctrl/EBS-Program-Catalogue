let PROGRAMS = window.__PROGRAMS__.slice();
const ADMIN_PASSWORD = '1234';
let isAdmin = false;
let editingIndex = null;

const grid = document.getElementById('grid');
const lightbox = document.getElementById('lightbox');
const lbVideo = document.getElementById('lightboxVideo');
const lbTitle = document.getElementById('lbTitle');
const lbSub = document.getElementById('lbSub');
const lbKicker = document.getElementById('lbKicker');
const lbSynopsis = document.getElementById('lbSynopsis');

const ACCENTS = ['#ffcf33', '#5fd3d0', '#ff8b6b', '#b9a2f2', '#8fc36a'];

function cardMarkup(p, i) {
  const thumb = p.thumb
    ? `<img class="card-thumb" src="${p.thumb}" alt="${p.titleEn}" loading="lazy" />`
    : `<div class="card-thumb card-thumb--empty" style="--accent:${p.accent}"><span>${p.titleEn}</span></div>`;
  return `
    <article class="card" tabindex="0" data-index="${i}" style="--accent:${p.accent}">
      <div class="card-media">
        ${thumb}
        <span class="card-badge">${p.year || ''}</span>
        <div class="card-admin-controls">
          <button type="button" class="icon-btn" data-action="edit" data-index="${i}" title="Edit">✎</button>
          <button type="button" class="icon-btn danger" data-action="delete" data-index="${i}" title="Delete">✕</button>
        </div>
        <div class="card-caption">
          <h3>${p.titleEn}</h3>
        </div>
        <div class="play-ring" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
      </div>
    </article>`;
}

function renderGrid() {
  PROGRAMS.sort((a, b) => (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0));

  grid.innerHTML = PROGRAMS.map(cardMarkup).join('\n') +
    `<div class="add-tile" id="addTile"><span class="plus">＋</span><span>Add program</span></div>`;

  grid.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-admin-controls')) return;
      openCard(Number(card.getAttribute('data-index')));
    });
    card.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.card-admin-controls')) {
        openCard(Number(card.getAttribute('data-index')));
      }
    });
  });
  grid.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); openEdit(Number(btn.dataset.index)); });
  });
  grid.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btn.dataset.armed === '1') {
        PROGRAMS.splice(Number(btn.dataset.index), 1);
        renderGrid();
      } else {
        btn.dataset.armed = '1';
        btn.textContent = 'Sure?';
        setTimeout(() => {
          if (btn.isConnected) { btn.dataset.armed = ''; btn.textContent = '✕'; }
        }, 2500);
      }
    });
  });
  document.getElementById('addTile').addEventListener('click', () => openEdit(null));
}

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
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeLightbox(); closeEdit(); } });

// --- Admin mode ---

const adminGear = document.getElementById('adminGear');
const pwOverlay = document.getElementById('pwOverlay');
const pwForm = document.getElementById('pwForm');
const pwError = document.getElementById('pwError');
const saveBar = document.getElementById('saveBar');

adminGear.addEventListener('click', () => {
  if (isAdmin) {
    isAdmin = false;
    document.body.classList.remove('admin-mode');
    saveBar.classList.add('hidden');
    return;
  }
  pwError.classList.add('hidden');
  pwForm.reset();
  pwOverlay.classList.remove('hidden');
});
pwOverlay.addEventListener('click', (e) => { if (e.target === pwOverlay) pwOverlay.classList.add('hidden'); });
pwForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const val = new FormData(pwForm).get('password');
  if (val === ADMIN_PASSWORD) {
    isAdmin = true;
    document.body.classList.add('admin-mode');
    saveBar.classList.remove('hidden');
    pwOverlay.classList.add('hidden');
  } else {
    pwError.classList.remove('hidden');
  }
});

// --- Edit form ---

const editOverlay = document.getElementById('editOverlay');
const editForm = document.getElementById('editForm');
const editHeading = document.getElementById('editHeading');
const editError = document.getElementById('editError');

function openEdit(i) {
  editingIndex = i;
  editForm.reset();
  editError.classList.add('hidden');
  if (i === null) {
    editHeading.textContent = 'Add program';
  } else {
    editHeading.textContent = 'Edit program';
    const p = PROGRAMS[i];
    editForm.titleEn.value = p.titleEn || '';
    editForm.genre.value = p.genre || '';
    editForm.year.value = p.year || '';
    editForm.synopsis.value = p.synopsis || '';
  }
  editOverlay.classList.remove('hidden');
}
function closeEdit() { editOverlay.classList.add('hidden'); editingIndex = null; }
editOverlay.addEventListener('click', (e) => { if (e.target === editOverlay) closeEdit(); });

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  editError.classList.add('hidden');

  const data = new FormData(editForm);
  const titleEn = data.get('titleEn').trim();
  if (!titleEn) {
    editError.textContent = 'Please enter an English title.';
    editError.classList.remove('hidden');
    return;
  }

  const thumbFile = editForm.thumb.files[0];
  const videoFile = editForm.video.files[0];

  const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
  if (videoFile && videoFile.size > MAX_VIDEO_BYTES) {
    editError.textContent = `Trailer file is very large (${(videoFile.size / 1024 / 1024).toFixed(1)}MB). Please trim it to a short preview clip first.`;
    editError.classList.remove('hidden');
    return;
  }

  try {
    const isNew = editingIndex === null;
    const base = isNew
      ? { id: 'new_' + Date.now(), thumb: null, video: null, accent: ACCENTS[PROGRAMS.length % ACCENTS.length] }
      : { ...PROGRAMS[editingIndex] };

    base.titleEn = titleEn;
    base.genre = data.get('genre').trim();
    base.year = data.get('year').trim();
    base.synopsis = data.get('synopsis').trim();
    if (thumbFile) base.thumb = await readFileAsDataUrl(thumbFile);
    if (videoFile) base.video = await readFileAsDataUrl(videoFile);

    if (!base.video) {
      editError.textContent = 'Please choose a trailer video.';
      editError.classList.remove('hidden');
      return;
    }

    if (isNew) PROGRAMS.push(base);
    else PROGRAMS[editingIndex] = base;

    renderGrid();
    closeEdit();
  } catch (err) {
    editError.textContent = 'Something went wrong: ' + err.message;
    editError.classList.remove('hidden');
  }
});

// --- Download changes ---

const exportBtn = document.getElementById('exportBtn');
const saveBarStatus = document.getElementById('saveBarStatus');
const saveBarStatusDefault = saveBarStatus.textContent;

function setSaveStatus(text, isError) {
  saveBarStatus.textContent = text;
  saveBarStatus.style.color = isError ? '#ff8080' : '';
}

exportBtn.addEventListener('click', () => {
  const payload = JSON.stringify(PROGRAMS, null, 2);
  const jsContent = 'window.__PROGRAMS__ = ' + payload + ';\n';
  const blob = new Blob([jsContent], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'programs.js';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setSaveStatus('Downloaded programs.js — send this file back so the changes can be published.', false);
  setTimeout(() => setSaveStatus(saveBarStatusDefault, false), 6000);
});

renderGrid();
