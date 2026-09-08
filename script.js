const btn = document.getElementById('menuBtn');
const links = document.getElementById('navLinks');

btn?.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
});

document.querySelectorAll('#navLinks a').forEach(a => a.addEventListener('click', () => {
  links.classList.remove('open');
  btn?.setAttribute('aria-expanded', 'false');
}));

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: 0.12});
  revealItems.forEach(el => observer.observe(el));
} else {
  revealItems.forEach(el => el.classList.add('in-view'));
}

const navAnchors = [...document.querySelectorAll('#navLinks a')];
const sections = navAnchors.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const setActiveLink = () => {
  const y = window.scrollY + 150;
  let active = sections[0];
  sections.forEach(section => { if (section.offsetTop <= y) active = section; });
  navAnchors.forEach(a => a.classList.toggle('active', active && a.getAttribute('href') === `#${active.id}`));
};
window.addEventListener('scroll', setActiveLink, {passive:true});
setActiveLink();

const backToTop = document.getElementById('backToTop');
const updateBackToTop = () => backToTop?.classList.toggle('show', window.scrollY > 700);
window.addEventListener('scroll', updateBackToTop, {passive:true});
updateBackToTop();
backToTop?.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));

// Creative V2: reading progress + compact header state.
const progress = document.getElementById('scrollProgress');
const updateProgress = () => {
  const doc = document.documentElement;
  const max = Math.max(1, doc.scrollHeight - doc.clientHeight);
  const pct = Math.min(100, Math.max(0, (doc.scrollTop / max) * 100));
  if (progress) progress.style.width = `${pct}%`;
  document.body.classList.toggle('scrolled', window.scrollY > 40);
};
window.addEventListener('scroll', updateProgress, {passive:true});
window.addEventListener('resize', updateProgress, {passive:true});
updateProgress();

// Creative V2: gallery lightbox. Uses the existing original image files only.
const lightbox = document.getElementById('galleryLightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');
let lastGalleryTrigger = null;

const closeLightbox = () => {
  if (!lightbox) return;
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  lastGalleryTrigger?.focus();
};

document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    if (!lightbox || !lightboxImage || !lightboxCaption) return;
    lastGalleryTrigger = item;
    lightboxImage.src = item.dataset.gallerySrc || '';
    lightboxImage.alt = item.dataset.galleryAlt || '';
    lightboxCaption.textContent = item.dataset.galleryAlt || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lightboxClose?.focus();
  });
});
lightboxClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && lightbox?.classList.contains('open')) closeLightbox(); });
