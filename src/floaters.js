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

function models(C) {
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
  const kinds = ['benchy', 'duck', 'gear', 'spring', 'nut', 'hinge', 'duck', 'bolt', 'bracket', 'gear2', 'benchy', 'flange', 'spring2', 'duck', 'gear', 'spring'];
  const list = mobile ? ['benchy', 'duck', 'gear', 'spring', 'nut', 'duck', 'spring2'] : kinds;
  const objs = list.map((k, i) => {
    const g = new THREE.Group(); for (const [geo, c] of M[k]) { const m = (mats[c] ??= printMat(c)).clone(); m.onBeforeCompile = mats[c].onBeforeCompile; m.transparent = true; g.add(new THREE.Mesh(geo, m)); } // geometría compartida, sin sombras
    const z = -1 - (i * 2.3 % 5);                     // profundidad → parallax
    const side = i % 2 ? 1 : -1;                         // entra por izquierda o derecha
    g.userData = { a: 1, z, side, off: i / list.length, speed: 0.9 + (i * 0.37 % 0.5), curve: 0.6 + (i * 0.53 % 1.2), spin: new THREE.Vector3(0.6 + i % 3 * 0.3, 1 + i % 2, 0.3), base: (mobile ? 0.55 : 0.95) * (0.85 + (i * 0.29 % 0.4)) };
    g.scale.setScalar(g.userData.base); scene.add(g); return g;
  });
  let p = 0, W = 1, H = 1;
  function layout() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); W = w; H = h; }
  addEventListener('resize', layout); layout();
  // posición en pantalla: cruza en diagonal curva de un lado al otro; t∈[0,1] por scroll
  const halfAt = z => { const d = camera.position.z - z, hh = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * d; return [hh * camera.aspect, hh]; };
  function place(o, prog, t) {
    const u = o.userData, [hw, hh] = halfAt(u.z);
    const f = ((prog * u.speed * 3 + u.off) % 1 + 1) % 1;             // cada objeto cruza ~3 veces en la página, escalonado
    const x = THREE.MathUtils.lerp(-1.25, 1.25, f) * hw * u.side;
    const y = (THREE.MathUtils.lerp(0.9, -0.9, f) + Math.sin(f * Math.PI * u.curve) * 0.35 * u.side) * hh * (mobile ? 0.85 : 1);
    o.position.set(x, y, u.z);
    const r = prog * 12 + u.off * 6;
    o.rotation.set(r * u.spin.x * 0.5, r * u.spin.y * 0.5 + t * 0.15, r * u.spin.z * 0.5);
  }
  // legibilidad: si un objeto pasa por detrás de un titular, texto, botón, tarjeta o formulario, se desvanece casi por completo
  const v = new THREE.Vector3();
  function fade(o, rects, instant) {
    v.copy(o.position).project(camera);
    const sx = (v.x + 1) / 2 * W, sy = (1 - v.y) / 2 * H, [, hh] = halfAt(o.userData.z), rad = o.userData.base * 0.75 / hh * H / 2 + 10;
    const hit = rects.some(r => sx + rad > r.left && sx - rad < r.right && sy + rad > r.top && sy - rad < r.bottom);
    const target = hit ? 0.08 : 1; o.userData.a = instant ? target : o.userData.a + (target - o.userData.a) * 0.2;
    o.visible = o.userData.a > 0.02;
    o.traverse(m => { if (m.material) { m.material.opacity = o.userData.a; m.material.depthWrite = o.userData.a > 0.9; } });
  }
  const els = avoid ? [...document.querySelectorAll(avoid)] : [];
    function visibleRects() { const out = []; for (const e of els) { const r = e.getBoundingClientRect(); if (r.bottom < 0 || r.top > H || !r.width) continue; if (+getComputedStyle(e).opacity < 0.1) continue; out.push(r); } return out; }
  function render(prog, t = 0, instant = false) { const rects = visibleRects(); for (const o of objs) { place(o, prog, t); fade(o, rects, instant); } renderer.render(scene, camera); }
  if (reduced) { // quietos: posiciones fijas en los márgenes, un solo render
    const fixed = mobile ? [[-0.85, -0.55], [0.85, -0.7], [-0.85, 0.55]] : [[-0.88, 0.6], [0.9, -0.65], [-0.9, -0.7], [0.88, 0.45]];
    objs.forEach((o, i) => { const f = fixed[i]; o.visible = !!f; if (!f) return; const [hw, hh] = halfAt(o.userData.z); o.position.set(f[0] * hw, f[1] * hh, o.userData.z); o.rotation.set(0.4, 0.6 + i, 0.1); });
    const rr = visibleRects(); objs.forEach(o => o.visible && fade(o, rr, true));
    renderer.render(scene, camera); addEventListener('resize', () => renderer.render(scene, camera));
    return { setProgress() {}, tick() {} };
  }
  return { setProgress(v) { p = v; }, tick(t) { render(p, t); } };
}
