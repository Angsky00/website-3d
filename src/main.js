import './style.css';
import { content as c } from './content.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createScene } from './scene.js';
import { createFloaters } from './floaters.js';
import { createSectionBg } from './sectionbg.js';
import { createDespiece } from './despiece.js';
gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const marca = c.marca.nombre.replace(/^3D/, '<b>3D</b>');
const iso = import.meta.env.BASE_URL + '02_isotipo.svg';

document.querySelector('#app').innerHTML = `
<canvas id="secbg" aria-hidden="true"></canvas>
<canvas id="floaters" aria-hidden="true"></canvas>
<a class="skip" href="#main">Saltar al contenido</a>
<header class="nav">
  <a class="brand" href="#hero" aria-label="${c.marca.nombre}, inicio"><img src="${iso}" alt="" width="38" height="38"><span>${marca}</span></a>
  <nav aria-label="Principal"><ul>
    <li><a href="#impresion">Impresión 3D</a></li><li><a href="#personalizado">Personalizado</a></li><li><a href="#carpinteria">Carpintería</a></li>
    <li><a href="#artesanias">Artesanías</a></li><li><a href="#nosotros">Nosotros</a></li><li><a href="#contacto">Contacto</a></li>
  </ul></nav>
</header>
<main id="main">
  <section id="hero" aria-label="Inicio">
    <canvas id="scene" role="img" aria-label="Animación: una impresora 3D imprime capa por capa el arco maya del logotipo de ${c.marca.nombre}"></canvas>
    <div class="hero-copy">
      <span class="eyebrow">${c.contacto.ubicacion}</span>
      <h1>${c.hero.titulo.replace(/capa\.$/, '<em>capa.</em>')}</h1><p>${c.hero.subtitulo}</p>
      <a class="btn ghost" href="#contacto">${c.hero.boton} <span aria-hidden="true">→</span></a>
    </div>
    <p class="hero-final">${c.hero.final}</p>
    <p class="progress" aria-hidden="true">capa <span id="capa">0</span> / 120 · 0.20 mm</p>
  </section>
  <section id="impresion" class="s"><div class="wrap">
    <span class="eyebrow">01 · Servicio</span><h2 class="reveal">${c.impresion.titulo}</h2>
    <p class="lead reveal">${c.impresion.texto}</p>
    <div class="cards">${c.impresion.tarjetas.map(t=>`<article class="card reveal"><h3>${t}</h3></article>`).join('')}</div>
    <p class="mono">${c.impresion.dato}</p>
  </div></section>
  <section id="personalizado" class="s perso">
  <div class="despiece">
    <canvas id="despiece" role="img" aria-label="Animación: las piezas del extrusor de la impresora se separan una a una en diagonal y se vuelven a armar"></canvas>
    <div class="dcol dl-l"><span class="eyebrow ri">02 · Posibilidades</span><h2 class="ri">${c.personalizado.titulo}</h2><p class="dlead ri">${c.personalizado.texto}</p><h3 class="dk ri">${c.personalizado.bloques[0].titulo}</h3><ul>${c.personalizado.bloques[0].lista.map(([k,t])=>`<li class="ri"><b>${k}</b> ${t}</li>`).join('')}</ul></div>
    <div class="dcol dl-r"><h3 class="dk ri">${c.personalizado.bloques[1].titulo}</h3><ul>${c.personalizado.bloques[1].lista.map(([k,t])=>`<li class="ri"><b>${k}</b> ${t}</li>`).join('')}</ul><p class="dcierre ri">${c.personalizado.cierre}</p><a class="btn ri" href="#contacto">${c.personalizado.boton} <span aria-hidden="true">→</span></a></div>
  </div></section>
  <section id="carpinteria" class="s alt"><div class="wrap">
    <span class="eyebrow">03 · Oficio</span><h2 class="reveal">${c.carpinteria.titulo}</h2>
    <p class="lead reveal">${c.carpinteria.texto}</p><div class="pending">${c.carpinteria.pendiente}</div>
  </div></section>
  <section id="artesanias" class="s"><div class="wrap">
    <span class="eyebrow">04 · Región</span><h2 class="reveal">${c.artesanias.titulo}</h2>
    <p class="lead reveal">${c.artesanias.texto}</p><div class="pending">${c.artesanias.pendiente}</div>
  </div></section>
  <section id="nosotros" class="s dark"><div class="wrap split">
    <div><span class="eyebrow">Calkiní, Campeche</span><h2 class="reveal">${c.nosotros.titulo}</h2><p class="lead reveal">${c.nosotros.texto}</p></div>
    <img src="${iso}" alt="Isotipo de ${c.marca.nombre}: arco maya" width="320" height="320">
  </div></section>
  <section id="contacto" class="s alt"><div class="wrap">
    <span class="eyebrow">Cotiza</span><h2>${c.contacto.titulo}</h2><p class="lead">${c.contacto.texto}</p>
    <p class="mono">Ubicación: ${c.contacto.ubicacion}</p>
    <form novalidate>
      <label>Nombre<input name="nombre" autocomplete="name"></label>
      <label>¿Qué necesitas?<textarea name="mensaje" rows="4"></textarea></label>
      <button class="btn" type="submit">Enviar</button>
      <p class="aviso" role="status" aria-live="polite"></p>
    </form>
    <div class="canales">${c.contacto.canales.map(n=>`<span class="canal">${n} · <small>Próximamente</small></span>`).join('')}</div>
  </div></section>
</main>
<footer>${c.pie}<span class="obra">Sitio en construcción</span></footer>
${reduced ? '' : `<div class="hero-clone" aria-hidden="true" inert><img class="shot" alt="">
  <div class="hero-copy"><span class="eyebrow">${c.contacto.ubicacion}</span><h1>${c.hero.titulo.replace(/capa\.$/, '<em>capa.</em>')}</h1><p>${c.hero.subtitulo}</p><span class="btn ghost">${c.hero.boton} <span aria-hidden="true">→</span></span></div>
  <p class="progress">capa 0 / 120 · 0.20 mm</p></div><div class="loop-pad" aria-hidden="true"></div>`}`;

document.querySelector('form').addEventListener('submit', e => {
  e.preventDefault(); document.querySelector('.aviso').textContent = c.contacto.avisoForm;
});

const floaters = createFloaters(document.querySelector('#floaters'), { reduced, avoid: '.progress, .hero-copy, .hero-final, .s h2, .s .lead, .eyebrow, .card, .mono, .pending, .bloque, .cierre, .despiece, .dcol, form, .canales, .split img' });
const scene = createScene(document.querySelector('#scene'), { reduced });
const desp = createDespiece(document.querySelector('#despiece'), { reduced });
// celular: el texto va arriba y abajo del escenario fijado (sin tapar el modelo); escritorio: a los costados
const dStage = document.querySelector('.despiece'), dL = document.querySelector('.dl-l'), dR = document.querySelector('.dl-r'), mqD = matchMedia('(max-width: 820px)');
const placeDCols = () => { if (mqD.matches) { dStage.before(dL); dStage.after(dR); } else { dStage.append(dL, dR); } };
placeDCols();
const dItems = [...document.querySelectorAll('.dcol .ri')];
const revealD = p => dItems.forEach((el, k) => { el.style.opacity = reduced || mqD.matches ? 1 : Math.min(1, Math.max(0, (p - 0.02 - k * 0.025) / 0.06)); });
revealD(reduced ? 1 : 0);
const capa = document.querySelector('#capa');
const final = document.querySelector('.hero-final');
const copy = document.querySelector('.hero-copy');

if (reduced) {
  desp.setProgress(0.78); // abierto y estático
  // reduced-motion: los objetos quietos solo existen dentro del hero; fuera de él el canvas se recorta por completo
  const fc = document.querySelector('#floaters'), hero = document.querySelector('#hero');
  const clip = () => { const b = Math.max(0, hero.getBoundingClientRect().bottom); fc.style.clipPath = `inset(0 0 ${Math.max(0, innerHeight - b)}px 0)`; fc.style.visibility = b <= 0 ? 'hidden' : 'visible'; };
  clip(); addEventListener('scroll', clip, { passive: true }); addEventListener('resize', clip);
  // secciones: solo fundido de opacidad (sin desplazamiento, sin acercamiento)
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  scene.setProgress(1); capa.textContent = 120; // el texto de cierre no se muestra: el hero ya ocupa ese espacio
} else {
  const pins = {};
  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis; window.__navTok = 0;
  // menú: directo a cada sección (Lenis no interfiere con el pin del hero)
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const id = a.getAttribute('href').slice(1), el = document.getElementById(id); if (!el) return; e.preventDefault();
    /* el fin del pin se lee al clic y se vuelve a leer al terminar (puede moverse por refresh/clon); se corrige exacto */
    const tok = ++window.__navTok; const goal = () => id === 'hero' ? 0 : pins[id] ? pins[id].end : el;
    const fix = (n = 0) => { if (tok !== window.__navTok) return; const y = goal(); if (typeof y !== 'number') return; if (Math.abs(lenis.scroll - y) >= 1) lenis.scrollTo(y, { immediate: true, force: true }); if (n < 3) requestAnimationFrame(() => requestAnimationFrame(() => fix(n + 1))); };
    lenis.scrollTo(goal(), { duration: 1.2, force: true, lock: true, onComplete: () => fix() }); history.replaceState(null, '', '#' + id); }));
  const st = ScrollTrigger.create({
    trigger: '#hero', start: 'top top', end: () => '+=' + window.innerHeight * 3,
    pin: true, scrub: 0.6,
    onUpdate: self => {
      const p = self.progress, pr = gsap.utils.clamp(0, 1, (p - 0.08) / 0.82);
      scene.setProgress(pr); capa.textContent = Math.round(pr * 120);
      copy.style.opacity = 1 - gsap.utils.clamp(0, 1, (p - 0.02) / 0.15);
      final.style.opacity = gsap.utils.clamp(0, 1, (p - 0.88) / 0.08);
    },
  });
  window.__hero = st;
  // objetos impresos cruzando: progreso de toda la página con scrub
  const fp = { v: 0 };
  ScrollTrigger.create({ trigger: document.body, start: 'top top', end: 'bottom bottom', onUpdate: self => gsap.to(fp, { v: self.progress, duration: 0.8, ease: 'power2.out', overwrite: true }) });
  gsap.ticker.add(t => { floaters.setProgress(fp.v); floaters.tick(t); });
  // A) fondo por sección: pin ~100vh; el objeto vuela hacia cámara, se queda como fondo y luego entra el contenido
  const bg = createSectionBg(document.querySelector('#secbg'));
  const ids = ['impresion', 'carpinteria', 'artesanias', 'nosotros', 'contacto'];
  // capas: fondo de color de la sección (envoltura) < canvas del objeto-fondo < contenido de la sección
  ids.forEach(id => { const sec = document.getElementById(id), cs = getComputedStyle(sec), w = document.createElement('div');
    w.className = 'sbg'; w.style.backgroundColor = cs.backgroundColor; w.style.backgroundImage = cs.backgroundImage;
    sec.before(w); w.append(sec); sec.style.background = 'transparent'; sec.style.position = 'relative'; sec.style.zIndex = 2; });
  const mkDesp = () => {
  // despiece: el escenario se fija 3 pantallas con scrub; el enlace del menú lleva al inicio de la sección
  const dst = ScrollTrigger.create({ trigger: '#personalizado .despiece', start: 'top top', end: () => '+=' + innerHeight * 3, pin: true, pinSpacing: true, scrub: 0.5, onUpdate: s => { desp.setProgress(s.progress); revealD(s.progress); }, onRefresh: s => { desp.setProgress(s.progress); revealD(s.progress); } });
  pins.personalizado = ScrollTrigger.create({ trigger: '#personalizado', start: 'top top', end: 'top top' });
  window.__despiece = dst; window.__desp = desp; window.__floaters = floaters;
  mqD.addEventListener('change', () => { placeDCols(); revealD(dst.progress); ScrollTrigger.refresh(); });
  };
  // orden DOM: impresion → despiece → resto (ScrollTrigger calcula los pines en orden de creación)
  ids.forEach(id => { pins[id] = ScrollTrigger.create({ trigger: '#' + id, start: 'top top', end: () => '+=' + innerHeight, pin: true, pinSpacing: true }); if (id === 'impresion') mkDesp(); });
  window.__pins = pins;
  const clone = document.querySelector('.hero-clone'), shot = clone.querySelector('img.shot'), sceneCv = document.querySelector('#scene');
  // el clon muestra la escena SIEMPRE en capa 0: al acercarse el clon, la escena se fuerza a progreso 0 y se fotografía
  let shotOk = false;
  const snap = () => { scene.setProgress(0); requestAnimationFrame(() => requestAnimationFrame(() => { shot.src = sceneCv.toDataURL('image/png'); shotOk = true; })); };
  addEventListener('resize', () => { shotOk = false; });
  let jumping = false;
  gsap.ticker.add(t => {
    const y = lenis.scroll ?? scrollY; let act = null, q = 0;
    for (const id of ids) { const p = pins[id]; if (y >= p.start - 1) { act = id; q = gsap.utils.clamp(0, 1, (y - p.start) / (p.end - p.start)); } }
    const ct = clone.getBoundingClientRect().top;
    if (ct < innerHeight * 2.5) { if (!shotOk) snap(); scene.setProgress(0); gsap.killTweensOf(fp); fp.v = 0; /* flotantes en estado de scroll 0 */ capa.textContent = 0; copy.style.opacity = 1; final.style.opacity = 0; } else if (shotOk && ct > innerHeight * 4) shotOk = false;
    if (y >= pins.personalizado.start - 1 && y < pins.carpinteria.start - 1) act = null; // el despiece no lleva objeto-fondo
    if (ct < innerHeight * 0.6) act = null; // entrando al clon del hero: el fondo de Contacto se desvanece
    bg.set(act, q); bg.tick(t);
    for (const id of ids) { const w = document.querySelector('#' + id + ' .wrap'), p = pins[id]; const qq = gsap.utils.clamp(0, 1, (y - p.start) / (p.end - p.start)); w.style.opacity = y < p.start ? 0 : gsap.utils.clamp(0, 1, (qq - 0.55) / 0.35); }
    // B) loop: al llegar al inicio del clon (más allá del pie) → arriba, capa 0, sin salto visible; nunca con un campo enfocado
    const busy = document.activeElement && document.activeElement.closest && document.activeElement.closest('form');
    if (!jumping && !busy && !window.__noLoop && ct < 1) { jumping = true; lenis.scrollTo(0, { immediate: true, force: true }); gsap.killTweensOf(fp); fp.v = 0; scene.setProgress(0); capa.textContent = 0; copy.style.opacity = 1; final.style.opacity = 0; ScrollTrigger.update(); requestAnimationFrame(() => { jumping = false; }); }
  });
  // entrada del hero
  gsap.from('.hero-copy > *', { opacity: 0, y: 30, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 0.2 });
  gsap.utils.toArray('.card').forEach((el, i) => gsap.set(el, { opacity: 0, y: 40 }));
  ScrollTrigger.batch('.card', { start: 'top 90%', onEnter: b => gsap.to(b, { opacity: 1, y: 0, stagger: 0.1, duration: .8, ease: 'power3.out' }) });
  gsap.utils.toArray('.s h2').forEach(el => gsap.from(el, { clipPath: 'inset(0 100% 0 0)', duration: 1.1, ease: 'power3.inOut', scrollTrigger: { trigger: el, start: 'top 85%' } }));
  gsap.utils.toArray('.reveal').forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: .7, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
}
