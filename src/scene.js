import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import svgText from '../public/02_isotipo.svg?raw';

const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

export function createScene(canvas, { reduced }) {
  const C = { terracota: css('--terracota'), jade: css('--jade'), arena: css('--arena'), carbon: css('--carbon'), crema: css('--crema') };
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.localClippingEnabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0xfff5e6, 0x3a2e28, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 7, 6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); scene.add(key);
  const rim = new THREE.DirectionalLight(new THREE.Color(C.jade), 1.2); rim.position.set(-5, 3, -4); scene.add(rim);

  // --- Impresora estilo K1C (caja cerrada, marco oscuro) ---
  const printer = new THREE.Group(); scene.add(printer);
  const W = 2.6, H = 3.0, D = 2.6, t = 0.12;
  const dark = new THREE.MeshStandardMaterial({ color: C.carbon, roughness: 0.55, metalness: 0.3 });
  const panel = new THREE.MeshStandardMaterial({ color: 0x2a2522, roughness: 0.7, metalness: 0.15 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x9a9590, roughness: 0.3, metalness: 0.9 });
  const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; printer.add(o); return o; };
  box(W, t * 2.2, D, dark, 0, t * 1.1, 0);           // base
  box(W, t, D, dark, 0, H - t / 2, 0);                // techo
  box(t, H, D, panel, -W / 2 + t / 2, H / 2, 0);      // lados
  box(t, H, D, panel, W / 2 - t / 2, H / 2, 0);
  box(W, H, t, panel, 0, H / 2, -D / 2 + t / 2);      // fondo
  for (const sx of [-1, 1]) box(t * 1.3, H, t * 1.3, dark, sx * (W / 2 - t * 0.6), H / 2, D / 2 - t * 0.6); // postes frontales
  // franja / pantalla
  box(0.7, 0.16, 0.02, new THREE.MeshStandardMaterial({ color: 0x111111, emissive: new THREE.Color(C.jade), emissiveIntensity: 0.6 }), 0, t * 1.1, D / 2 + 0.01);
  box(W * 0.98, 0.03, 0.02, new THREE.MeshStandardMaterial({ color: C.terracota, emissive: C.terracota, emissiveIntensity: 0.4 }), 0, H - t - 0.02, D / 2 - 0.02);
  // puerta de vidrio
  const glass = new THREE.Mesh(new THREE.BoxGeometry(W - t * 2.4, H - t * 3.4, 0.03),
    new THREE.MeshPhysicalMaterial({ color: 0xdfe8e4, transparent: true, opacity: 0.14, roughness: 0.05, metalness: 0, depthWrite: false }));
  glass.position.set(0, H / 2 + 0.04, D / 2 - 0.02); printer.add(glass);
  box(0.05, 0.6, 0.06, metal, W / 2 - 0.35, H / 2, D / 2 + 0.02); // manija
  // luz interior
  const inner = new THREE.PointLight(0xfff1dc, 2.5, 4, 1.5); inner.position.set(0, H - 0.3, 0.9); printer.add(inner);

  // cama
  const bedY = 0.55;
  box(W - 0.5, 0.06, D - 0.6, metal, 0, bedY, 0);
  box(W - 0.6, 0.015, D - 0.7, new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.4, metalness: 0.4 }), 0, bedY + 0.038, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.04, bedY - 0.25, 0.04, metal, sx * 0.9, (bedY + 0.25) / 2, sz * 0.8);

  // gantry core-XY: barras Y laterales y barra X móvil, cabezal
  const railY = H - 0.2;
  for (const sx of [-1, 1]) box(0.05, 0.05, D - 0.4, metal, sx * (W / 2 - 0.25), railY, 0);
  const xbar = box(W - 0.5, 0.05, 0.05, metal, 0, railY, 0);
  const head = new THREE.Group(); printer.add(head);
  const grey = new THREE.MeshStandardMaterial({ color: 0x4a4542, roughness: 0.5, metalness: 0.4 });
  const hb = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.3), new THREE.MeshStandardMaterial({ color: C.carbon, roughness: 0.45, metalness: 0.2 })); hb.castShadow = true; head.add(hb);
  const shroud = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.03), grey); shroud.position.z = 0.165; head.add(shroud);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 32), new THREE.MeshStandardMaterial({ color: 0x7a7570, metalness: 0.7, roughness: 0.35 })); ring.position.z = 0.185; head.add(ring);
  const blades = new THREE.Group(); blades.position.z = 0.18; head.add(blades);
  const bladeM = new THREE.MeshStandardMaterial({ color: 0x2b2725, roughness: 0.6 });
  for (let i = 0; i < 7; i++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.03, 0.006), bladeM); bl.position.x = 0.045; const piv = new THREE.Group(); piv.rotation.z = i * Math.PI * 2 / 7; bl.rotation.x = 0.4; piv.add(bl); blades.add(piv); }
  for (const gy of [-0.05, 0, 0.05]) { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.008, 0.008), grey); bar.position.set(0, gy, 0.19); head.add(bar); }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16), grey); hub.rotation.x = Math.PI / 2; hub.position.z = 0.19; head.add(hub);
  const heater = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.12), new THREE.MeshStandardMaterial({ color: 0xb8b2aa, metalness: 0.8, roughness: 0.3 })); heater.position.y = -0.2; head.add(heater);
  const noz = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.9, roughness: 0.25 })); noz.rotation.x = Math.PI; noz.position.y = -0.27; head.add(noz);
  // tubo/varilla vertical que conecta cabezal con la barra
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 8), metal); head.add(stem);

  // --- Arco extruido del isotipo: un mesh por path con el fill del propio SVG ---
  const data = new SVGLoader().parse(svgText);
  const parts = [];
  data.paths.forEach(p => { const fill = p.userData.style.fill; if (fill && fill !== 'none') parts.push({ fill, shapes: SVGLoader.createShapes(p) }); });
  const shapes = parts.flatMap(p => p.shapes);
  const opts = { depth: 40, bevelEnabled: true, bevelThickness: 2, bevelSize: 1.0, bevelSegments: 2, curveSegments: 6 };
  const geos = parts.map(p => { const g = new THREE.ExtrudeGeometry(p.shapes, opts); g.scale(1, -1, 1); return g; });
  const bb = new THREE.Box3(); geos.forEach(g => { g.computeBoundingBox(); bb.union(g.boundingBox); });
  const s = 1.9 / (bb.max.x - bb.min.x); // ~23 % más grande que antes (1.55)
  const archH = (bb.max.y - bb.min.y) * s, archW = (bb.max.x - bb.min.x) * s / 2;
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  const archGroup = new THREE.Group(); archGroup.position.set(0, bedY + 0.046, 0); printer.add(archGroup);
  const arch = new THREE.Group(); archGroup.add(arch);
  geos.forEach((g, i) => {
    g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2); g.scale(s, s, s); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: new THREE.Color(parts[i].fill), roughness: 0.55, metalness: 0.05, clippingPlanes: [clip], side: THREE.DoubleSide }));
    m.castShadow = true; arch.add(m);
  });
  // capa "caliente" en el borde de impresión
  const hot = new THREE.Mesh(new THREE.PlaneGeometry(archW * 2.2, 1), new THREE.MeshBasicMaterial({ color: 0xffb08a, transparent: true, opacity: 0, depthWrite: false }));
  hot.rotation.x = -Math.PI / 2; printer.add(hot);
  const groundY = 0;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 48), new THREE.ShadowMaterial({ opacity: 0.18 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  // muestreo de contorno por altura: intervalos X ocupados a cada altura (aprox. con raycast 2D sobre shapes)
  const pts = shapes.map(sh => ({ o: sh.getPoints(8), h: sh.holes.map(h => h.getPoints(8)) }));
  const inside = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; };
  const svgX = x => x / s + (bb.min.x + bb.max.x) / 2, svgY = y => -(y / s + bb.min.y);
  function occupied(h) { // devuelve lista de X (escena) ocupadas a esa altura
    const out = [], yy = svgY(h);
    for (let i = 0; i <= 40; i++) { const xs = archW * (i / 20 - 1); const sx = svgX(xs);
      if (pts.some(p => inside(p.o, sx, yy) && !p.h.some(hh => inside(hh, sx, yy)))) out.push(xs); }
    return out.length ? out : [0];
  }

  let progress = 0, spin = 0, last = performance.now();
  function setProgress(p) { progress = p; }
  function layout() {
    const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false);
    camera.aspect = w / h; const mobile = w / h < 0.9;
    camera.fov = mobile ? 42 : 30; camera.updateProjectionMatrix();
    if (mobile) { printer.position.set(0, -0.2, 0); camera.position.set(0, 3.2, 11.5); camera.lookAt(0, 2.5, 0); }
    else { printer.position.set(1.7, 0, 0); camera.position.set(-0.2, 2.6, 9.5); camera.lookAt(0.9, 1.4, 0); }
    floor.position.copy(printer.position);
  }
  window.addEventListener('resize', layout); layout();

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const hNow = progress * archH;
    clip.constant = printer.position.y + archGroup.position.y + hNow + (progress >= 1 ? 1 : 0);
    const done = progress >= 0.999, printing = progress > 0.001 && !done;
    // boquilla: altura de capa + recorrido XY sobre los segmentos ocupados
    const xs = occupied(Math.max(0.01, hNow - 0.01));
    const phase = progress * 120 * Math.PI; // ~1 pasada por capa
    const u = 0.5 + 0.5 * Math.sin(phase);
    const idx = Math.min(xs.length - 1, Math.floor(u * xs.length));
    const tx = done ? 0 : xs[idx], tz = done ? 0 : Math.cos(phase * 0.5) * 0.25;
    head.position.x += (tx - head.position.x) * Math.min(1, dt * 14);
    head.position.z += (tz - head.position.z) * Math.min(1, dt * 14);
    const targetY = done ? Math.min(railY - 0.25, archGroup.position.y + archH + 0.45) : archGroup.position.y + hNow + 0.31;
    head.position.y += (targetY - head.position.y) * Math.min(1, dt * 12);
    stem.scale.y = Math.max(0.01, railY - head.position.y - 0.18); stem.position.y = 0.18 + stem.scale.y / 2;
    xbar.position.z = head.position.z;
    if (!reduced) blades.rotation.z += dt * 18;
    hot.position.set(0, archGroup.position.y + hNow, 0); hot.material.opacity = printing ? 0.35 : 0; hot.visible = false;
    // al final gira suave
    if (done && !reduced) spin += dt * 0.35; else if (!done) spin *= 0.9;
    arch.rotation.y = spin;
    renderer.render(scene, camera);
    if (!reduced) requestAnimationFrame(frame);
  }
  if (reduced) { progress = 1; requestAnimationFrame(t => { last = t; for (let i = 0; i < 60; i++) frame(t + i * 16); }); }
  else requestAnimationFrame(frame);
  if (reduced) window.addEventListener('resize', () => frame(performance.now()));
  return { setProgress };
}
