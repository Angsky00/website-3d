// Fondo por sección: al entrar (pin + scrub), el objeto de la sección vuela desde el fondo hacia cámara,
// crece hasta llenar el viewport y se queda como fondo desenfocado y tenue detrás del contenido.
import * as THREE from 'three';
import { models } from './floaters.js';

const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

export function createSectionBg(canvas) {
  const C = { terracota: css('--terracota'), jade: css('--jade'), arena: css('--arena'), carbon: css('--carbon'), crema: css('--crema') };
  const mobile = innerWidth < 820;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1 : 1.25)); // pixelRatio limitado
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100); camera.position.set(0, 0, 10);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6b5a4a, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 5, 6); scene.add(key);
  const M = models(C);
  // mapeo objeto→sección; [modelo, x, y, escala final, color opcional]. Nosotros (fondo carbón): crema / jade claro para que se vea
  const light = '#cfe3dc';
  const MAP = {
    impresion: mobile ? [['gear', 0, 0.3, 7], ['nut', 0.9, -1.4, 3.2]] : [['gear', -1.2, 0.2, 7], ['gear2', 2.6, -0.6, 4.5], ['nut', 0.9, 1.8, 2.6]],
    carpinteria: mobile ? [['bracket', 0, 0.2, 6], ['hinge', 0.6, -1.6, 3.4]] : [['bracket', -1.4, 0, 6.5], ['hinge', 2.4, 0.4, 4.5]],
    artesanias: mobile ? [['duck', -0.2, 0.2, 5.5], ['gem', 1, -1.6, 2.6]] : [['duck', -1.8, -0.2, 5.5], ['duck', 2.6, 0.9, 3.2], ['gem', 1.4, -1.4, 2.8]],
    nosotros: [['arch', 0, 0, mobile ? 6.5 : 7.5, C.crema, light]],
    contacto: [['benchy', 0, 0, mobile ? 6 : 7]],
  };
  const groups = {};
  for (const [sec, list] of Object.entries(MAP)) {
    const G = new THREE.Group(); G.visible = false; scene.add(G);
    list.forEach(([k, x, y, s, c1, c2], i) => {
      const g = new THREE.Group();
      M[k].forEach(([geo, c], j) => g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: (j === 0 ? c1 : c2) || c, flatShading: true, roughness: 0.6, transparent: true }))));
      g.userData = { x, y, s, i }; G.add(g);
    });
    groups[sec] = G;
  }
  let W = 1, H = 1;
  function layout() { W = innerWidth; H = innerHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
  addEventListener('resize', layout); layout();
  const st = {}; // sec → { q: progreso del vuelo 0..1, a: visibilidad }
  for (const k in MAP) st[k] = { q: 0, a: 0 };
  let active = null;
  const ease = t => 1 - Math.pow(1 - t, 3);
  function tick(t) {
    let blur = 0, op = 0;
    for (const [sec, G] of Object.entries(groups)) {
      const s = st[sec], target = sec === active ? 1 : 0;
      s.a += (target - s.a) * 0.12; if (s.a < 0.01) s.a = 0;
      G.visible = s.a > 0; if (!G.visible) continue;
      const e = ease(s.q), fit = mobile ? Math.min(1, W / H * 1.6) : 1;
      G.children.forEach(g => {
        const u = g.userData, z = THREE.MathUtils.lerp(-40, 0, e);
        g.position.set(u.x * e * fit, u.y * e + (1 - e) * (u.i - 0.5) * 2, z);
        g.scale.setScalar(THREE.MathUtils.lerp(0.6, u.s * fit, e));
        g.rotation.set(0.35 + (1 - e) * 2 + Math.sin(t * 0.15 + u.i) * 0.08, t * 0.08 + u.i + (1 - e) * 3, 0.1 * u.i);
        g.traverse(m => { if (m.material) m.material.opacity = s.a; });
      });
      if (sec === active) { blur = e * (mobile ? 9 : 14); op = THREE.MathUtils.lerp(0.95, 0.2, e); }
    }
    if (!active) op = Math.max(...Object.values(st).map(s => s.a)) * 0.2, blur = mobile ? 9 : 14;
    canvas.style.opacity = op.toFixed(3); canvas.style.filter = `blur(${blur.toFixed(1)}px)`;
    if (op > 0) renderer.render(scene, camera);
  }
  return { set(sec, q) { active = sec; if (sec) st[sec].q = q; }, tick };
}
