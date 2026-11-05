// Objetos impresos en 3D que cruzan la pantalla ligados al scroll.
// Todo modelado aquí, low-poly y facetado (sin modelos externos). Solo colores de la paleta.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

// material con líneas de capa sutiles (bandas en Y local) y sombreado facetado
function printMat(color) {
  const m = new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.6, metalness: 0.05 });
  m.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vLY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLY = position.y;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vLY;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= 0.9 + 0.1 * smoothstep(0.35, 0.65, fract(vLY * 22.0));');
  };
  return m;
}
const flat = g => { const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); return n; };
const ext = (shape, depth, bevel = 0.02) => flat(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, curveSegments: 6 }).center());
const circlePath = (r, n = 10) => { const p = new THREE.Path(); for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; i ? p.lineTo(Math.cos(a) * r, Math.sin(a) * r) : p.moveTo(r, 0); } return p; };
const at = (g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => { g = g.clone(); g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s))); return flat(g); };

export function models(C) {
  const M = {};
  // --- Barquito estilo "benchy" (diseño propio): casco con proa, cabina con ventanas, techo y chimenea
  const hullS = new THREE.Shape(); hullS.moveTo(-0.55, -0.25); hullS.lineTo(0.25, -0.25); hullS.quadraticCurveTo(0.6, -0.2, 0.7, 0); hullS.quadraticCurveTo(0.6, 0.2, 0.25, 0.25); hullS.lineTo(-0.55, 0.25); hullS.lineTo(-0.6, 0); hullS.closePath();
  const hull = at(ext(hullS, 0.28, 0.04), 0, 0, 0, Math.PI / 2);
  const deck = at(new THREE.BoxGeometry(0.9, 0.04, 0.42), -0.05, 0.16, 0);
  const cabin = at(new THREE.BoxGeometry(0.42, 0.34, 0.4), -0.22, 0.35, 0);
  const roof = at(new THREE.BoxGeometry(0.52, 0.05, 0.48), -0.22, 0.54, 0);
  const chim = at(new THREE.CylinderGeometry(0.06, 0.07, 0.24, 8), -0.33, 0.68, 0);
  const win = [at(new THREE.BoxGeometry(0.14, 0.12, 0.42), -0.15, 0.38, 0), at(new THREE.BoxGeometry(0.44, 0.12, 0.08), -0.22, 0.38, 0.0), at(new THREE.BoxGeometry(0.03, 0.14, 0.2), -0.005, 0.37, 0)];
  M.benchy = [[mergeGeometries([hull, deck]), C.terracota], [mergeGeometries([cabin, roof]), C.terracota], [chim, C.carbon], [mergeGeometries(win.map(w => at(w, 0, 0, 0, 0, 0, 0, 1.0))), C.carbon]];
  // ventanas: como cajas oscuras sobresaliendo levemente de la cabina (se ven en ambas caras)
  M.benchy[3][0] = mergeGeometries([at(new THREE.BoxGeometry(0.12, 0.1, 0.41), -0.12, 0.38, 0), at(new THREE.BoxGeometry(0.12, 0.1, 0.41), -0.32, 0.38, 0), at(new THREE.BoxGeometry(0.43, 0.1, 0.12), -0.22, 0.38, 0), at(new THREE.CylinderGeometry(0.07, 0.07, 0.43, 10), -0.22, 0.38, 0, 0, 0, Math.PI / 2)]);
  // --- Patito de hule (arena + pico terracota + ojos carbón)
  const body = at(new THREE.IcosahedronGeometry(0.4, 1), 0, 0, 0, 0, 0, 0); body.scale(1.25, 0.8, 1);
  const head = at(new THREE.IcosahedronGeometry(0.24, 1), 0.28, 0.42, 0);
  const tail = at(new THREE.ConeGeometry(0.12, 0.25, 5), -0.5, 0.18, 0, 0, 0, Math.PI / 2.6);
  const beak = at(new THREE.ConeGeometry(0.09, 0.22, 6), 0.56, 0.38, 0, 0, 0, -Math.PI / 2);
  const eyes = mergeGeometries([at(new THREE.IcosahedronGeometry(0.035, 0), 0.42, 0.5, 0.15), at(new THREE.IcosahedronGeometry(0.035, 0), 0.42, 0.5, -0.15)]);
  M.duck = [[mergeGeometries([flat(body), head, tail]), C.arena], [beak, C.terracota], [eyes, C.carbon]];
  // --- Engrane con dientes
  const gear = (R, teeth, hole) => { const s = new THREE.Shape(); const n = teeth * 4;
    for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, r = (i % 4 < 2) ? R : R * 0.8; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(r, 0); }
    s.holes.push(circlePath(hole, 6)); return ext(s, 0.14, 0.015); };
  M.gear = [[gear(0.5, 12, 0.14), C.jade]];
  M.gear2 = [[gear(0.34, 9, 0.1), C.terracota]];
  // --- Tuerca hexagonal y perno
  const hex = r => { const s = new THREE.Shape(); for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI * 2; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(r, 0); } return s; };
  const nutS = hex(0.3); nutS.holes.push(circlePath(0.14, 8)); M.nut = [[ext(nutS, 0.16, 0.02), C.carbon]];
  const bHead = at(ext(hex(0.22), 0.14, 0.015), 0, 0.42, 0, Math.PI / 2);
  const shaft = at(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8), 0, 0, 0);
  const thread = at(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 49 }, (_, i) => new THREE.Vector3(Math.cos(i * 0.8) * 0.105, -0.38 + i * 0.012, Math.sin(i * 0.8) * 0.105))), 60, 0.018, 4), 0, 0, 0);
  M.bolt = [[mergeGeometries([bHead, shaft, thread]), C.arena]];
  // --- Bisagra: dos hojas con barriles intercalados y perno
  const leaf = at(new THREE.BoxGeometry(0.42, 0.04, 0.6), 0, 0, 0);
  const holesL = [0.18, -0.18].map(z => at(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 8), 0.06, 0, z));
  const knA = [-0.24, 0.0, 0.24].map((z, i) => at(new THREE.CylinderGeometry(0.07, 0.07, 0.11, 10), -0.24, 0.02, z, Math.PI / 2));
  M.hinge = [[mergeGeometries([at(leaf, 0.0, 0, 0), knA[0], knA[2]]), C.jade], [mergeGeometries([at(leaf, -0.46, 0.08, 0, 0, 0, -0.5), knA[1]]), C.terracota], [mergeGeometries([at(new THREE.CylinderGeometry(0.025, 0.025, 0.66, 6), -0.24, 0.02, 0, Math.PI / 2), ...holesL]), C.carbon]];
  // --- Soporte en L / brida con agujeros
  const L = new THREE.Shape(); L.moveTo(-0.4, -0.4); L.lineTo(0.4, -0.4); L.lineTo(0.4, -0.26); L.lineTo(-0.26, -0.26); L.lineTo(-0.26, 0.4); L.lineTo(-0.4, 0.4); L.closePath();
  const flS = new THREE.Shape(); flS.absarc(0, 0, 0.42, 0, Math.PI * 2); flS.holes.push(circlePath(0.15, 10)); [0, 1, 2, 3].forEach(i => { const a = i * Math.PI / 2 + Math.PI / 4, h = circlePath(0.05, 6); h.translate?.(0, 0); const p = new THREE.Path(); for (let k = 0; k <= 6; k++) { const b = k / 6 * Math.PI * 2, x = Math.cos(a) * 0.29 + Math.cos(b) * 0.05, y = Math.sin(a) * 0.29 + Math.sin(b) * 0.05; k ? p.lineTo(x, y) : p.moveTo(x, y); } flS.holes.push(p); });
  M.bracket = [[ext(L, 0.3, 0.02), C.terracota]];
  M.flange = [[ext(flS, 0.1, 0.015), C.arena]];
  // --- Resorte helicoidal
  const helix = Array.from({ length: 121 }, (_, i) => { const a = i / 120 * Math.PI * 2 * 6; return new THREE.Vector3(Math.cos(a) * 0.22, -0.45 + i / 120 * 0.9, Math.sin(a) * 0.22); });
  M.spring = [[flat(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix), 160, 0.035, 5)), C.jade]];
  M.spring2 = [[flat(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix.map(v => new THREE.Vector3(v.x * 0.7, v.y * 0.8, v.z * 0.7))), 160, 0.03, 5)), C.carbon]];
  // --- Gema facetada (Artesanías)
  M.gem = [[flat(new THREE.OctahedronGeometry(0.42, 0).scale(1, 1.35, 1)), C.jade]];
  // --- Arco maya (isotipo): bloque con falsa bóveda escalonada
  const ar = new THREE.Shape(); ar.moveTo(-0.5, -0.45); ar.lineTo(0.5, -0.45); ar.lineTo(0.5, 0.45); ar.lineTo(-0.5, 0.45); ar.closePath();
  const vh = new THREE.Path(); [[-0.2, -0.45], [-0.2, -0.05], [-0.13, -0.05], [-0.13, 0.08], [-0.06, 0.08], [-0.06, 0.2], [0, 0.28], [0.06, 0.2], [0.06, 0.08], [0.13, 0.08], [0.13, -0.05], [0.2, -0.05], [0.2, -0.45]].forEach(([x, y], k) => k ? vh.lineTo(x, y) : vh.moveTo(x, y)); ar.holes.push(vh);
  M.arch = [[ext(ar, 0.22, 0.015), C.terracota], [flat(at(new THREE.BoxGeometry(1.1, 0.08, 0.3), 0, 0.5, 0)), C.jade]];
  return M;
}

export function createFloaters(canvas, { reduced, avoid = '' }) {
  const C = { terracota: css('--terracota'), jade: css('--jade'), arena: css('--arena'), carbon: css('--carbon'), crema: css('--crema') };
  const mobile = window.innerWidth < 820;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60); camera.position.z = 12;
  scene.add(new THREE.HemisphereLight(0xfff5e6, 0x3a2e28, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(new THREE.Color(C.jade), 0.9); rim.position.set(-5, 2, -3); scene.add(rim);

  const M = models(C), mats = {};
  // cada sección tiene sus objetos: Impresión = engranes + tuerca; Carpintería = escuadra + bisagra; Artesanías = patitos + gema; Nosotros = arco maya; Contacto = Benchy
  const SEC = mobile
    ? { hero: ['benchy', 'gear', 'duck', 'spring'], impresion: [], carpinteria: [], artesanias: [], nosotros: [], contacto: [] }
    : { hero: ['benchy', 'duck', 'gear', 'spring', 'nut', 'bolt', 'spring2', 'flange'], impresion: [], carpinteria: [], artesanias: [], nosotros: [], contacto: [] } // las secciones usan su fondo propio (sectionbg.js);
  const list = [], secOf = [];
  for (const [sec, ks] of Object.entries(SEC)) ks.forEach(k => { list.push(k); secOf.push(sec); });
  const BG = 0.25; // en secciones: fondo al 20 % de opacidad + desenfoque leve, el texto conserva su contraste
  const objs = list.map((k, i) => {
    const g = new THREE.Group(); for (const [geo, c] of M[k]) { const m = (mats[c] ??= printMat(c)).clone(); m.onBeforeCompile = mats[c].onBeforeCompile; m.transparent = true; g.add(new THREE.Mesh(geo, m)); } // geometría compartida, sin sombras
    const z = -1 - (i * 2.3 % 5);                     // profundidad → parallax
    const side = mobile ? (i % 3 === 0 ? -1 : 1) : (i % 2 ? 1 : -1);                         // entra por izquierda o derecha
    g.userData = { sec: secOf[i], s: secOf[i] === 'hero' ? 1 : 0, lane: mobile || secOf[i] !== 'hero', a: 1, z, side, off: i / list.length, speed: 0.9 + (i * 0.37 % 0.5), curve: 0.6 + (i * 0.53 % 1.2), spin: new THREE.Vector3(0.6 + i % 3 * 0.3, 1 + i % 2, 0.3), base: (mobile ? 0.4 : 0.95) * (0.85 + (i * 0.29 % 0.4)) };
    g.scale.setScalar(g.userData.base); scene.add(g); return g;
  });
  let p = 0, W = 1, H = 1;
  function layout() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); W = w; H = h; }
  addEventListener('resize', layout); layout();
  // posición en pantalla: cruza en diagonal curva de un lado al otro; t∈[0,1] por scroll
  const halfAt = z => { const d = camera.position.z - z, hh = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * d; return [hh * camera.aspect, hh]; };
  function place(o, prog, t) {
    const u = o.userData, [hw, hh] = halfAt(u.z);
    const lp = u.sec === 'hero' ? prog * 3 : (u.lp ?? 0); // objetos de sección: avanzan con el scroll de su propia sección
    const f = ((lp * u.speed + u.off) % 1 + 1) % 1;             // cada objeto cruza ~3 veces en la página, escalonado
    if (o.userData.lane) {
      // celular: carriles en los bordes; bajan/suben con el scroll asomándose medio fuera de pantalla
      const f2 = ((lp * u.speed * (u.sec === 'hero' ? 5 / 3 : 1) + u.off) % 1 + 1) % 1; // más pasadas en celular
      const inner = hw - u.base * (mobile ? 0.55 : 1.1), out = hw + u.base * 0.8; // dentro: visible en huecos; fuera: escondido tras el borde
      const x = u.side * THREE.MathUtils.lerp(out, inner, u.k ?? 0);
      const yr = u.sec === 'hero' ? 1.15 : 0.82; // objetos de sección: siempre dentro de la pantalla mientras su sección está activa
      const y = THREE.MathUtils.lerp(yr, -yr, u.sec === 'hero' ? f2 : 0.5 - 0.5 * Math.cos(f2 * Math.PI * 2)) * hh;
      o.position.set(x, y, u.z);
    } else {
    const x = THREE.MathUtils.lerp(-1.25, 1.25, f) * hw * u.side;
    const y = (THREE.MathUtils.lerp(0.9, -0.9, f) + Math.sin(f * Math.PI * u.curve) * 0.35 * u.side) * hh * (mobile ? 0.85 : 1);
    o.position.set(x, y, u.z);
    }
    const r = prog * 12 + u.off * 6;
    o.rotation.set(r * u.spin.x * 0.5, r * u.spin.y * 0.5 + t * 0.15, r * u.spin.z * 0.5);
  }
  // Proyecta el volumen completo: un radio estimado puede dejar fuera
  // los extremos de piezas alargadas, especialmente en pantallas anchas.
  const v = new THREE.Vector3(), box = new THREE.Box3(), corner = new THREE.Vector3();
  function screenBounds(o) {
    o.updateWorldMatrix(true, true);
    box.setFromObject(o);
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      corner.set(x, y, z).project(camera);
      const sx = (corner.x + 1) / 2 * W, sy = (1 - corner.y) / 2 * H;
      left = Math.min(left, sx); right = Math.max(right, sx);
      top = Math.min(top, sy); bottom = Math.max(bottom, sy);
    }
    return { left, top, right, bottom };
  }
  function fade(o, rects, instant) {
    const bounds = screenBounds(o), pad = mobile ? 8 : 24;
    const hit = rects.some(r => bounds.right + pad > r.left && bounds.left - pad < r.right && bounds.bottom + pad > r.top && bounds.top - pad < r.bottom);
    const u = o.userData, target = hit ? 0 : u.s * (u.sec === 'hero' ? 1 : BG);
    // Ocultar en el mismo fotograma evita residuos durante scroll rápido. Solo
    // la reaparición es gradual, cuando todo el volumen ha salido del texto.
    u.a = hit || instant ? target : u.a + (target - u.a) * 0.3;
    if (u.a < 0.01) u.a = 0;
    o.visible = u.a > 0;
    o.traverse(m => { if (m.material) { m.material.opacity = u.a; m.material.depthWrite = u.a > 0.9 || (u.sec !== 'hero' && u.a > BG * 0.9); } });
  }
  const els = avoid ? [...document.querySelectorAll(avoid)] : [];
    const rng = document.createRange();
  // en celular se miden las líneas reales de texto (y cada chip), así quedan libres los huecos a la derecha de títulos y renglones cortos
  const tight = e => mobile && e.matches('h2, .lead, .eyebrow, .mono, .hero-final, .progress');
  function visibleRects() { const out = []; for (const e of els) { const r = e.getBoundingClientRect(); if (r.bottom < 0 || r.top > H || !r.width) continue; if (+getComputedStyle(e).opacity < 0.1) continue;
    if (tight(e)) { rng.selectNodeContents(e); out.push(...rng.getClientRects()); } else if (mobile && e.matches('.canales')) { for (const c of e.children) out.push(c.getBoundingClientRect()); } else out.push(r); } return out; }
  const hitAt = (x, y, z, rad, rects) => { v.set(x, y, z).project(camera); const sx = (v.x + 1) / 2 * W, sy = (1 - v.y) / 2 * H; return rects.some(r => sx + rad > r.left && sx - rad < r.right && sy + rad > r.top && sy - rad < r.bottom); };
  const secEls = {}; for (const k of Object.keys(SEC)) secEls[k] = k === 'hero' ? document.querySelector('.hero, #hero') : document.getElementById(k);
  function sections() { // sección activa = la que ocupa el centro de la pantalla; progreso local de cada sección
    let cur = 'hero'; const loc = {};
    for (const [k, e] of Object.entries(secEls)) { if (!e || k === 'hero') continue; const r = e.getBoundingClientRect(); loc[k] = (H - r.top) / (r.height + H); if (r.top < H * 0.5 && r.bottom > H * 0.5) cur = k; }
    if (secEls.impresion && secEls.impresion.getBoundingClientRect().top > H * 0.5) cur = 'hero';
    for (const o of objs) { const u = o.userData; if (u.sec !== 'hero') u.lp = loc[u.sec] ?? 0; u.s += ((u.sec === cur ? 1 : 0) - u.s) * 0.2; if (u.s < 0.02) u.s = 0; }
    canvas.style.filter = cur === 'hero' ? '' : 'blur(1.2px)';
  }
  function render(prog, t = 0, instant = false) { sections(); const rects = visibleRects(); for (const o of objs) {
    if (o.userData.lane) { // carril de borde: entra a la pantalla solo donde hay hueco (entre bloques/secciones) y se esconde junto al texto
      const u = o.userData; place(o, prog, t); const [hw, hh] = halfAt(u.z), rad = u.base * 0.6 / hh * H / 2 + 4;
      const free = !hitAt(u.side * (hw - u.base * (mobile ? 0.55 : 1.1)), o.position.y, u.z, rad, rects);
      u.k = (u.k ?? 0) + ((free ? 1 : 0) - (u.k ?? 0)) * 0.35;
    }
    if (!o.userData.s && !o.userData.a) { o.visible = false; continue; } place(o, prog, t); fade(o, rects, instant); } renderer.render(scene, camera); }
  if (reduced) { // quietos: posiciones fijas en los márgenes, un solo render
    const fixed = mobile ? [[-0.85, -0.55], [0.85, -0.7], [-0.85, 0.55]] : [[-0.88, 0.6], [0.9, -0.65], [-0.9, -0.7], [0.88, 0.45]];
    objs.forEach((o, i) => { const f = fixed[i]; o.visible = !!f; if (!f) return; const [hw, hh] = halfAt(o.userData.z); o.position.set(f[0] * hw, f[1] * hh, o.userData.z); o.rotation.set(0.4, 0.6 + i, 0.1); });
    const rr = visibleRects(); objs.forEach(o => o.visible && fade(o, rr, true));
    renderer.render(scene, camera); addEventListener('resize', () => renderer.render(scene, camera));
    return { setProgress() {}, tick() {} };
  }
  // QA: círculos en pantalla de los objetos visibles (centro y radio aproximado en px)
  const debugRects = () => objs.filter(o => o.visible && o.userData.a > 0.05).map(o => { v.copy(o.position).project(camera); const [, hh] = halfAt(o.userData.z), rad = o.userData.base * 0.5 / hh * H / 2; return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, rad, sec: o.userData.sec, lane: !!o.userData.lane, a: +o.userData.a.toFixed(2), bounds: screenBounds(o) }; });
  return { setProgress(v) { p = v; }, tick(t) { render(p, t); }, debugRects };
}
