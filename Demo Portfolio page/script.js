// Custom cursor: only for devices with a real mouse, and the system cursor is
// hidden only AFTER this script has started, so it can never end up with no cursor.
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
if (cursor && ring && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.body.classList.add('has-custom-cursor');
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; cursor.style.left = mx + 'px'; cursor.style.top = my + 'px'; });
  function animateRing() { rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12; ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; requestAnimationFrame(animateRing); }
  animateRing();
  document.querySelectorAll('a, button, [onclick]').forEach(el => {
    el.addEventListener('mouseenter', () => { ring.style.transform = 'translate(-50%,-50%) scale(1.6)'; ring.style.borderColor = 'rgba(0,212,255,0.7)'; });
    el.addEventListener('mouseleave', () => { ring.style.transform = 'translate(-50%,-50%) scale(1)'; ring.style.borderColor = 'rgba(0,212,255,0.4)'; });
  });
}

// Copy to clipboard
const toast = document.getElementById('toast');
function copyText(text, el) {
  navigator.clipboard.writeText(text).then(() => {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  });
}

// Scroll-reveal
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; } });
}, { threshold: 0.1 });
document.querySelectorAll('.about-card, .skill-card, .service-card, .project-card, .social-link, .pay-method').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(18px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease, border-color 0.25s, box-shadow 0.25s';
  observer.observe(el);
});
