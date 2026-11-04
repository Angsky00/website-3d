import './style.css';
import { content as c } from './content.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createScene } from './scene.js';
gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const marca = c.marca.nombre.replace(/^3D/, '<b>3D</b>');
const iso = '/02_isotipo.svg';

document.querySelector('#app').innerHTML = `
<a class="skip" href="#main">Saltar al contenido</a>
<header class="nav">
  <a class="brand" href="#hero" aria-label="${c.marca.nombre}, inicio"><img src="${iso}" alt="" width="38" height="38"><span>${marca}</span></a>
  <nav aria-label="Principal"><ul>
    <li><a href="#impresion">Impresión 3D</a></li><li><a href="#carpinteria">Carpintería</a></li>
    <li><a href="#artesanias">Artesanías</a></li><li><a href="#nosotros">Nosotros</a></li><li><a href="#contacto">Contacto</a></li>
  </ul></nav>
</header>
<main id="main">
  <section id="hero" aria-label="Inicio">
    <canvas id="scene" role="img" aria-label="Animación: una impresora 3D imprime capa por capa el arco maya del logotipo de ${c.marca.nombre}"></canvas>
    <div class="hero-copy">
      <h1>${c.hero.titulo}</h1><p>${c.hero.subtitulo}</p>
      <a class="btn" href="#contacto">${c.hero.boton}</a>
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
  <section id="carpinteria" class="s alt"><div class="wrap">
    <span class="eyebrow">02 · Oficio</span><h2 class="reveal">${c.carpinteria.titulo}</h2>
    <p class="lead reveal">${c.carpinteria.texto}</p><div class="pending">${c.carpinteria.pendiente}</div>
  </div></section>
  <section id="artesanias" class="s"><div class="wrap">
    <span class="eyebrow">03 · Región</span><h2 class="reveal">${c.artesanias.titulo}</h2>
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
<footer>${c.pie}</footer>`;

document.querySelector('form').addEventListener('submit', e => {
  e.preventDefault(); document.querySelector('.aviso').textContent = c.contacto.avisoForm;
});

const scene = createScene(document.querySelector('#scene'), { reduced });
const capa = document.querySelector('#capa');
const final = document.querySelector('.hero-final');
const copy = document.querySelector('.hero-copy');

if (reduced) {
  scene.setProgress(1); capa.textContent = 120; final.style.opacity = 1;
} else {
  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;
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
  gsap.utils.toArray('.reveal').forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: .7, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
}
