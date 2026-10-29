'use strict';

// The same illustrations become the visual header of each project detail.
const visual = document.getElementById('dialog-visual');
document.querySelectorAll('[data-project]').forEach(button => {
  button.addEventListener('click', () => {
    const artwork = button.querySelector('.project-art').cloneNode(true);
    artwork.removeAttribute('style');
    artwork.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    visual.replaceChildren(artwork);
  });
});

// A very small tilt on the artwork, only when a fine pointer is in use.
const finePointer = window.matchMedia('(hover:hover) and (pointer:fine)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)');
document.querySelectorAll('.project-open').forEach(button => {
  let frame = 0;
  button.addEventListener('pointermove', event => {
    if (!finePointer.matches || reducedMotion.matches) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const box = button.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width - .5) * 2));
      const y = Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height - .5) * 2));
      button.style.setProperty('--tilt-x', (-y * 3).toFixed(2) + 'deg');
      button.style.setProperty('--tilt-y', (x * 4).toFixed(2) + 'deg');
    });
  }, {passive:true});
  button.addEventListener('pointerleave', () => {
    cancelAnimationFrame(frame);
    button.style.removeProperty('--tilt-x');
    button.style.removeProperty('--tilt-y');
  });
});

let progressFrame = 0;
function updateProgress() {
  const available = document.documentElement.scrollHeight - innerHeight;
  const progress = available > 0 ? Math.max(0, Math.min(1, scrollY / available)) : 0;
  document.documentElement.style.setProperty('--page-progress', String(progress));
  progressFrame = 0;
}
function scheduleProgress() {
  if (!progressFrame) progressFrame = requestAnimationFrame(updateProgress);
}
window.addEventListener('scroll', scheduleProgress, {passive:true});
window.addEventListener('resize', scheduleProgress, {passive:true});
window.addEventListener('load', scheduleProgress, {once:true});
updateProgress();

if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  const targets = document.querySelectorAll('.section-heading,.services-intro,.service-list,.process-grid article,.team-copy,.person,.contact-grid>div,.brief-form');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold:.08,rootMargin:'0px 0px -15px 0px'});
  targets.forEach(target => {
    target.classList.add('reveal');
    observer.observe(target);
  });
  document.documentElement.classList.add('motion-ready');
  document.addEventListener('focusin', event => {
    let target = event.target;
    while (target && target !== document.body) {
      if (target.classList && target.classList.contains('reveal')) target.classList.add('is-visible');
      target = target.parentElement;
    }
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) {
      observer.disconnect();
      targets.forEach(target => target.classList.add('is-visible'));
    }
  });
}
