/* Behaviour ported from the design reference (`design_handoff_site/Ekaterina Glebova Site.dc.html`).
   Every animation is skipped under `prefers-reduced-motion: reduce`. Cursor, spotlight and
   magnetic buttons react to the mouse only. */

const EASE = 'cubic-bezier(.16,1,.3,1)';
const INTRO_ON = true;   // splash on first load
const CURSOR_ON = true;  // custom cursor on fine-pointer devices

// phone <600 · tab-v 600–1024 · tab-h 1025–1366 + coarse pointer · desk otherwise
const bpFor = (w, coarse) => w < 600 ? 'phone' : w <= 1024 ? 'tab-v' : (w <= 1366 && coarse) ? 'tab-h' : 'desk';
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const html = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mqCoarse = matchMedia('(pointer: coarse)');

const page = $('#page');
const heroes = $('#top');
const prog = $('.progress');
const nav = $('.nav');
const fab = $('.fab');
const menu = $('.menu');
const ring = $('[data-ring]');
const stepsBox = $('[data-steps]');
const stepsLine = $('[data-steps-line]');
const stepsTrack = $('[data-steps-track]');
const stepEls = $$('[data-step]');
const dotEls = stepEls.map((s) => $('[data-stepdot]', s));
const reviews = $('[data-reviews]');
const glow = $('[data-glow]');
const introEl = $('.intro');
const cursorEl = CURSOR_ON && matchMedia('(pointer: fine)').matches ? $('.cursor') : null;
if (cursorEl) html.classList.add('has-cursor');

/* ---------- Breakpoint / active hero ---------- */
let bp = html.dataset.bp;
let hero = null, heroPar = null, heroText = null, heroMouse = null;
function pickHero() {
  hero = $(`[data-hero="${bp}"]`);
  heroPar = hero && $('[data-hero-par]', hero);
  heroText = hero && $('[data-hero-text]', hero);
  heroMouse = hero && $('[data-hero-mouse]', hero);
}
pickHero();

function syncVp() {
  const next = bpFor(html.clientWidth || innerWidth, mqCoarse.matches);
  if (next === bp) return;
  bp = next;
  html.dataset.bp = next;
  pickHero();
  if (menuOpen) setMenu(false);
  playHero(0);
  requestAnimationFrame(() => { layout(); update(); });
}

/* ---------- Pointer state ---------- */
let tx = innerWidth / 2, ty = innerHeight / 2, cx = tx, cy = ty;
let mx = 0, my = 0, hx = 0, hy = 0, cs = 1, csT = 1;
let magEl = null, magRect = null;
let menuOpen = false, navOn = false, fabOn = false, ticking = false;
let pendingReveal = [];

/* ---------- Reveals + count-up ---------- */
function show(el) {
  if (el.dataset.reveal === 'clip') el.style.clipPath = 'inset(0 0 0 0)';
  else { el.style.opacity = '1'; el.style.transform = 'none'; }
}
function setupReveals() {
  if (reduced) return;
  const hidden = { up: 'translate3d(0,56px,0)', scale: 'scale(.94)' };
  const els = $$('[data-reveal]', page);
  els.forEach((el) => {
    const t = el.dataset.reveal, d = +(el.dataset.delay || 0);
    if (t === 'clip') { el.style.clipPath = 'inset(100% 0 0 0)'; el.style.transition = `clip-path 1.6s ${EASE} ${d}ms`; }
    else { el.style.opacity = '0'; el.style.transform = hidden[t] || hidden.up; el.style.transition = `opacity 1.1s ${EASE} ${d}ms, transform 1.3s ${EASE} ${d}ms`; }
  });
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    show(e.target); io.unobserve(e.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  els.forEach((el) => io.observe(el));
  pendingReveal = els;

  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    countUp(e.target); cio.unobserve(e.target);
  }), { threshold: 0.6 });
  $$('[data-count]', page).forEach((el) => { el.textContent = '0'; cio.observe(el); });
}
function countUp(el) {
  const raw = el.dataset.count, dec = raw.includes(',') ? 1 : 0, target = parseFloat(raw.replace(',', '.'));
  const t0 = performance.now(), dur = 2000;
  const step = (t) => {
    const p = clamp((t - t0) / dur), e = 1 - Math.pow(2, -10 * p);
    el.textContent = (p >= 1 ? target : target * e).toFixed(dec).replace('.', ',');
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- Ambient: blobs, marquees, ring ---------- */
function setupAmbient() {
  if (reduced) return;
  $$('[data-blob]', page).forEach((el, i) => {
    const k = +el.dataset.blob || 0, dx = [40, -50, 30][k], dy = [30, 40, -35][k];
    el.animate(
      [{ transform: 'translate3d(0,0,0) scale(1)' }, { transform: `translate3d(${dx}px,${dy}px,0) scale(1.08)` }, { transform: 'translate3d(0,0,0) scale(1)' }],
      { duration: 16000 + k * 4000 + i * 700, iterations: Infinity, easing: 'ease-in-out' }
    );
  });
  $$('[data-marquee]', page).forEach((el) => el.animate(
    [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }],
    { duration: +el.dataset.marquee || 30000, iterations: Infinity }
  ));
  if (ring) ring.animate(
    [{ transform: 'scale(1)', opacity: .6 }, { transform: 'scale(1.15)', opacity: 1 }, { transform: 'scale(1)', opacity: .6 }],
    { duration: 8000, iterations: Infinity, easing: 'ease-in-out' }
  );
}

/* ---------- Intro + hero entrance ---------- */
function playHero(base) {
  if (!hero || reduced) return;
  const lines = $$('[data-line]', hero);
  lines.forEach((el, i) => el.animate(
    [{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }],
    { duration: 1300, delay: base + i * 110, easing: EASE, fill: 'backwards' }
  ));
  // The phone h1 wraps freely (no per-line wrappers), so it enters as one block.
  const flowH1 = lines.length ? null : $('.hero__h1', hero);
  if (flowH1) flowH1.animate(
    [{ opacity: 0, translate: '0 30px' }, { opacity: 1, translate: '0 0' }],
    { duration: 1300, delay: base, easing: EASE, fill: 'backwards' }
  );
  $$('[data-hero-fade]', hero).forEach((el, i) => el.animate(
    [{ opacity: 0, translate: '0 30px' }, { opacity: 1, translate: '0 0' }],
    { duration: 1200, delay: base + 550 + i * 150, easing: EASE, fill: 'backwards' }
  ));
  const img = $('[data-hero-img]', hero);
  if (img) img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 2200, delay: Math.max(0, base - 400), easing: EASE, fill: 'backwards' });
  // The hero's own reveal items (desktop feature bar) are part of the entrance, not scroll-driven:
  // on a 988px-tall viewport they sit just below the scroll-reveal threshold and would stay hidden.
  const own = $$('[data-reveal]', hero);
  setTimeout(() => { own.forEach(show); pendingReveal = pendingReveal.filter((el) => !own.includes(el)); }, base);
}
function playIntro() {
  html.style.overflow = 'hidden';
  setTimeout(() => {
    $$('[data-iw]', introEl).forEach((el, i) => el.animate(
      [{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }],
      { duration: 1000, delay: 150 + i * 140, easing: EASE, fill: 'both' }
    ));
    const line = $('[data-il]', introEl);
    if (line) line.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 1200, delay: 450, easing: EASE, fill: 'both' });
    playHero(1750);
    setTimeout(() => {
      const a = introEl.animate(
        [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }],
        { duration: 1100, easing: 'cubic-bezier(.77,0,.18,1)', fill: 'forwards' }
      );
      a.onfinish = () => { html.style.overflow = ''; introEl.remove(); };
    }, 1500);
  }, 0);
}

/* ---------- Mouse: spotlight, magnetic, cursor ---------- */
function handleMove(e) {
  if (e.pointerType && e.pointerType !== 'mouse') return;
  tx = e.clientX; ty = e.clientY;
  mx = e.clientX / innerWidth * 2 - 1; my = e.clientY / innerHeight * 2 - 1;
  const t = e.target && e.target.closest ? e.target : null; if (!t) return;
  const s = t.closest('[data-spot]');
  if (s) { const r = s.getBoundingClientRect(); s.style.setProperty('--mx', (e.clientX - r.left) + 'px'); s.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
  const m = t.closest('[data-magnetic]');
  if (m !== magEl) { if (magEl) magEl.style.transform = ''; magEl = m; if (m) { m.style.transform = ''; magRect = m.getBoundingClientRect(); } }
  if (m && magRect) {
    const r = magRect, dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    m.style.transform = `translate(${dx * 0.18}px, ${dy * 0.3}px)`;
  }
  csT = t.closest('a,button,[data-magnetic]') ? 3.2 : (t.closest('[data-spot]') ? 2 : 1);
  if (cursorEl && cursorEl.style.opacity !== '1') cursorEl.style.opacity = '1';
}
function frame() {
  if (cursorEl) {
    cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2; cs += (csT - cs) * 0.15;
    cursorEl.style.transform = `translate3d(${cx - 8}px,${cy - 8}px,0) scale(${cs})`;
  }
  if (reduced) return;
  hx += (mx - hx) * 0.05; hy += (my - hy) * 0.05;
  if (heroMouse && scrollY < innerHeight) heroMouse.style.transform = `translate3d(${hx * -10}px,0,0)`;
  if (glow) glow.style.transform = `translate3d(${hx * 80}px,${hy * 60}px,0)`;
}
const loop = () => { frame(); requestAnimationFrame(loop); };

/* ---------- Scroll-driven layout ---------- */
function layout() {
  $$('[data-hsec]', page).forEach((s) => {
    const t = $('[data-htrack]', s);
    if (t) s.style.height = Math.max(innerHeight * 1.5, t.scrollWidth - s.clientWidth + innerHeight * 1.2) + 'px';
  });
}
function updateSteps(vh) {
  if (!stepsBox || !dotEls.length || !dotEls[0]) return;
  const sr = stepsBox.getBoundingClientRect();
  const ys = dotEls.map((d) => { const r = d.getBoundingClientRect(); return r.top + r.height / 2 - sr.top; });
  const first = ys[0], last = ys[ys.length - 1], len = Math.max(1, last - first);
  [stepsTrack, stepsLine].forEach((l) => { if (l) { l.style.top = first + 'px'; l.style.height = len + 'px'; } });
  const mid = vh * 0.55, pos = mid - sr.top;
  if (stepsLine) stepsLine.style.transform = `scaleY(${clamp((pos - first) / len)})`;
  let a = 0; ys.forEach((y, i) => { if (y <= pos + 0.5) a = i; });
  stepEls.forEach((el, i) => {
    const reached = ys[i] <= pos + 0.5 || (i === 0 && pos >= first);
    el.style.opacity = i === a ? '1' : (i < a ? '.55' : '.32');
    const d = dotEls[i];
    d.style.background = reached ? '#a3502c' : '#ebe8e1';
    d.style.boxShadow = i === a && reached ? '0 0 0 7px rgba(163,80,44,.16)' : 'none';
  });
}
function update() {
  const y = scrollY, vh = innerHeight;
  const hsecs = $$('[data-hsec]', page);
  if (hsecs.some((s) => s.offsetHeight < vh)) layout();
  const docH = html.scrollHeight - vh;
  if (prog) prog.style.transform = `scaleX(${docH > 0 ? y / docH : 0})`;
  if (nav) {
    const on = y > 40;
    if (on !== navOn) { navOn = on; nav.classList.toggle('is-scrolled', on); }
  }
  if (fab && heroes) {
    const on = y > heroes.offsetHeight * 0.55 && !menuOpen;
    if (on !== fabOn) { fabOn = on; fab.classList.toggle('is-on', on); }
  }
  updateSteps(vh);
  if (pendingReveal.length) {
    pendingReveal = pendingReveal.filter((el) => {
      if (!el.isConnected) return false;
      if (el.getBoundingClientRect().top > vh * 0.94) return true;
      show(el);
      return false;
    });
  }
  if (reduced) return;
  if (y < vh * 1.2) {
    if (heroPar) heroPar.style.transform = `translate3d(0,${y * 0.15}px,0)`;
    // Text parallax only where the text sits high in the hero (desktop, tablet landscape). In the
    // portrait layouts it is at the bottom of the black panel, and shifting it would push the
    // feature cards past the panel edge.
    if (heroText) heroText.style.transform = (bp === 'desk' || bp === 'tab-h') ? `translate3d(0,${y * 0.08}px,0)` : '';
  }
  $$('[data-par]', page).forEach((el) => {
    const sec = el.closest('section'); if (!sec) return;
    const r = sec.getBoundingClientRect(), p = clamp((vh - r.top) / (vh + r.height));
    el.style.transform = `translate3d(0,${((0.5 - p) * 12).toFixed(2)}%,0)`;
  });
  hsecs.forEach((hs) => {
    const tr = $('[data-htrack]', hs); if (!tr) return;
    const r = hs.getBoundingClientRect(), total = hs.offsetHeight - vh;
    const p = total > 0 ? clamp(-r.top / total) : 0;
    const dist = Math.max(0, tr.scrollWidth - hs.clientWidth);
    tr.style.transform = `translate3d(${(-p * dist).toFixed(1)}px,0,0)`;
    const bar = $('[data-hbar]', hs); if (bar) bar.style.transform = `scaleX(${p})`;
  });
}
const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } };

/* ---------- Mobile menu ---------- */
function setMenu(open) {
  menuOpen = open;
  html.style.overflow = open ? 'hidden' : '';
  menu.classList.toggle('is-open', open);
  menu.setAttribute('aria-hidden', String(!open));
  update();
}
$$('[data-open-menu]').forEach((b) => b.addEventListener('click', () => setMenu(true)));
$$('[data-close-menu]').forEach((b) => b.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) setMenu(false); });

/* ---------- FAQ accordion (first item open; clicking the open one closes it) ---------- */
const faqItems = $$('[data-faq]');
faqItems.forEach((item) => {
  const btn = $('.faq-item__q', item);
  btn.addEventListener('click', () => {
    const wasOpen = item.classList.contains('is-open');
    faqItems.forEach((i) => { i.classList.remove('is-open'); $('.faq-item__q', i).setAttribute('aria-expanded', 'false'); });
    if (!wasOpen) { item.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
  });
});

/* ---------- Reviews slider ---------- */
const revScroll = (dir) => reviews && reviews.scrollBy({ left: dir * 380, behavior: 'smooth' });
$$('[data-rev-prev]').forEach((b) => b.addEventListener('click', () => revScroll(-1)));
$$('[data-rev-next]').forEach((b) => b.addEventListener('click', () => revScroll(1)));

/* ---------- Boot ---------- */
setupReveals();
setupAmbient();
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => { syncVp(); layout(); update(); });
addEventListener('pointermove', handleMove, { passive: true });
new ResizeObserver(syncVp).observe(html);
mqCoarse.addEventListener('change', syncVp);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); update(); });
requestAnimationFrame(loop);
layout(); update();

if (introEl && INTRO_ON && !reduced) playIntro();
else { if (introEl) introEl.remove(); playHero(200); }
