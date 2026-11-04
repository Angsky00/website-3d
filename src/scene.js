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
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(0, 10, 3); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 }); key.shadow.bias = -0.0005; scene.add(key);
  const fill = new THREE.DirectionalLight(0xfff0e0, 0.8); fill.position.set(-4, 3, 5); scene.add(fill);
  const rim = new THREE.DirectionalLight(new THREE.Color(C.jade), 1.2); rim.position.set(-5, 3, -4); scene.add(rim);

  // --- Impresora abierta: base, cama, dos postes y pórtico X que sube con la capa ---
  const printer = new THREE.Group(); scene.add(printer);
  const dark = new THREE.MeshStandardMaterial({ color: C.carbon, roughness: 0.55, metalness: 0.25 });
  const alu = new THREE.MeshStandardMaterial({ color: 0x3a3532, roughness: 0.45, metalness: 0.6 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xa8a39d, roughness: 0.3, metalness: 0.9 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.9, roughness: 0.25 });
  const grey = new THREE.MeshStandardMaterial({ color: 0x55504c, roughness: 0.5, metalness: 0.4 });
  const blackPl = new THREE.MeshStandardMaterial({ color: 0x141211, roughness: 0.7 });
  const box = (w, h, d, m, x, y, z, parent = printer) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const cyl = (r, h, m, parent, seg = 20) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); o.castShadow = true; parent.add(o); return o; };
  const PX = 1.45, PZ = -0.42, PH = 3.35; // postes
  box(3.3, 0.14, 2.3, dark, 0, 0.07, 0);                       // base delgada
  box(3.3, 0.02, 0.02, new THREE.MeshStandardMaterial({ color: C.terracota }), 0, 0.12, 1.151); // filo terracota
  box(0.5, 0.12, 0.01, new THREE.MeshStandardMaterial({ color: 0x111111, emissive: new THREE.Color(C.jade), emissiveIntensity: 0.5 }), 0.95, 0.07, 1.151); // pantalla
  const bedY = 0.42;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.05, bedY - 0.14, 0.05, metal, sx * 0.95, (bedY + 0.14) / 2, sz * 0.7);
  box(2.4, 0.05, 1.8, alu, 0, bedY, 0);                         // placa
  // hoja PEI con textura de puntos
  const tc = document.createElement('canvas'); tc.width = tc.height = 256; const tx = tc.getContext('2d');
  tx.fillStyle = '#2a2624'; tx.fillRect(0, 0, 256, 256); tx.fillStyle = 'rgba(231,217,193,.10)';
  for (let y = 4; y < 256; y += 8) for (let x = 4; x < 256; x += 8) { tx.beginPath(); tx.arc(x, y, 1.4, 0, 7); tx.fill(); }
  tx.strokeStyle = 'rgba(231,217,193,.25)'; tx.lineWidth = 3; tx.strokeRect(6, 6, 244, 244);
  const tex = new THREE.CanvasTexture(tc); tex.colorSpace = THREE.SRGBColorSpace;
  box(2.3, 0.012, 1.7, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.2 }), 0, bedY + 0.031, 0);
  for (const sx of [-1, 1]) {
    box(0.14, PH, 0.14, dark, sx * PX, 0.14 + PH / 2, PZ);           // poste
    box(0.02, PH - 0.3, 0.02, metal, sx * PX, 0.14 + PH / 2, PZ + 0.08); // guía lineal
    const lead = cyl(0.018, PH - 0.4, metal, printer, 10); lead.position.set(sx * PX, 0.14 + PH / 2, PZ - 0.1);
    box(0.24, 0.22, 0.24, grey, sx * PX, 0.25, PZ);                  // motor Z
  }
  box(2 * PX + 0.14, 0.1, 0.14, dark, 0, 0.14 + PH + 0.05, PZ);     // travesaño superior
  // pórtico móvil
  const gantry = new THREE.Group(); printer.add(gantry);
  box(2 * PX, 0.09, 0.07, alu, 0, 0, PZ + 0.16, gantry);           // riel X
  box(2 * PX - 0.1, 0.012, 0.012, metal, 0, 0.03, PZ + 0.2, gantry); // guía del riel
  for (const sx of [-1, 1]) { box(0.26, 0.2, 0.22, dark, sx * PX, 0, PZ + 0.06, gantry); // carros Z
    const pul = cyl(0.045, 0.04, metal, gantry); pul.rotation.x = Math.PI / 2; pul.position.set(sx * (PX - 0.2), 0, PZ + 0.215); }
  const beltM = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  box(2 * PX - 0.4, 0.012, 0.012, beltM, 0, 0.045, PZ + 0.215, gantry);
  box(2 * PX - 0.4, 0.012, 0.012, beltM, 0, -0.045, PZ + 0.215, gantry);

  // --- Cabezal detallado (origen = punta de boquilla) ---
  const head = new THREE.Group(); printer.add(head);
  const noz = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.07, 16), brass); noz.rotation.x = Math.PI; noz.position.y = 0.035; head.add(noz);
  const nozHex = cyl(0.04, 0.03, brass, head, 6); nozHex.position.y = 0.085;
  box(0.16, 0.08, 0.13, metal, 0.02, 0.14, 0, head);                // bloque calentador
  const cart = cyl(0.012, 0.1, metal, head, 8); cart.rotation.z = Math.PI / 2; cart.position.set(0.12, 0.14, 0.03);
  const brk = cyl(0.018, 0.06, metal, head, 10); brk.position.y = 0.2;  // heatbreak
  for (let i = 0; i < 6; i++) { const fin = cyl(0.06, 0.008, metal, head, 24); fin.position.y = 0.23 + i * 0.022; } // disipador
  // carcasa con chaflanes
  const hs = new THREE.Shape(); const w = 0.2, hh = 0.22, c = 0.06;
  hs.moveTo(-w + c, -hh); hs.lineTo(w - c, -hh); hs.lineTo(w, -hh + c); hs.lineTo(w, hh - 0.02); hs.lineTo(w - 0.02, hh); hs.lineTo(-w + 0.02, hh); hs.lineTo(-w, hh - 0.02); hs.lineTo(-w, -hh + c); hs.closePath();
  const hg = new THREE.ExtrudeGeometry(hs, { depth: 0.28, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2 }); hg.translate(0, 0, -0.14);
  const housing = new THREE.Mesh(hg, new THREE.MeshStandardMaterial({ color: C.carbon, roughness: 0.42, metalness: 0.2 })); housing.position.y = 0.6; housing.castShadow = true; head.add(housing);
  // ventilador frontal
  const ff = new THREE.Group(); ff.position.set(0, 0.6, 0.16); head.add(ff);
  const fr = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.27, 0.02), grey); ff.add(fr);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 8, 40), metal); ring.position.z = 0.012; ff.add(ring);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.105, 40), blackPl); hole.position.z = 0.011; ff.add(hole);
  const blades = new THREE.Group(); blades.position.z = 0.016; ff.add(blades);
  const bladeM = new THREE.MeshStandardMaterial({ color: 0x3b3633, roughness: 0.55, side: THREE.DoubleSide });
  for (let i = 0; i < 9; i++) { const piv = new THREE.Group(); piv.rotation.z = i * Math.PI * 2 / 9; const bl = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.028, 0.004), bladeM); bl.position.x = 0.058; bl.rotation.x = 0.5; piv.add(bl); blades.add(piv); }
  const hub = cyl(0.03, 0.012, grey, ff, 20); hub.rotation.x = Math.PI / 2; hub.position.z = 0.024;
  const hubLogo = new THREE.Mesh(new THREE.CircleGeometry(0.018, 20), new THREE.MeshStandardMaterial({ color: C.terracota })); hubLogo.position.z = 0.031; ff.add(hubLogo);
  for (let i = -2; i <= 2; i++) { const g1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.006, 0.006), metal); g1.position.set(0, i * 0.04, 0.034); ff.add(g1); }
  for (const r of [0.05, 0.085]) { const gr = new THREE.Mesh(new THREE.TorusGeometry(r, 0.003, 6, 40), metal); gr.position.z = 0.034; ff.add(gr); }
  // ventilador lateral de capa + ducto
  const sf = new THREE.Group(); sf.position.set(0.25, 0.5, 0); head.add(sf);
  box(0.08, 0.22, 0.22, grey, 0, 0, 0, sf);
  const sring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.01, 8, 32), metal); sring.rotation.y = Math.PI / 2; sring.position.x = 0.045; sf.add(sring);
  const sblades = new THREE.Group(); sblades.position.x = 0.045; sblades.rotation.y = Math.PI / 2; sf.add(sblades);
  for (let i = 0; i < 7; i++) { const piv = new THREE.Group(); piv.rotation.z = i * Math.PI * 2 / 7; const bl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.022, 0.004), bladeM); bl.position.x = 0.04; bl.rotation.x = 0.5; piv.add(bl); sblades.add(piv); }
  const duct = box(0.06, 0.3, 0.12, grey, 0.24, 0.24, 0, head); duct.rotation.z = -0.35;
  box(0.1, 0.035, 0.1, grey, 0.14, 0.075, 0, head).rotation.z = -0.2;   // salida del ducto
  // LED discreto (sin luz real)
  box(0.12, 0.012, 0.005, new THREE.MeshStandardMaterial({ color: C.jade, emissive: new THREE.Color(C.jade), emissiveIntensity: 0.7 }), 0, 0.4, 0.165, head);
  // carro sobre el riel
  box(0.34, 0.24, 0.05, alu, 0, 0.6, -0.2, head);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const wh = cyl(0.028, 0.03, blackPl, head, 16); wh.rotation.x = Math.PI / 2; wh.position.set(sx * 0.12, 0.6 + sy * 0.09, -0.235); }
  // tubo PTFE y cable: curva regenerada cada frame desde el cabezal hasta clips en el travesaño
  box(0.06, 0.06, 0.06, grey, 0, 0.8, 0, head); // acople
  const barY = 0.14 + PH + 0.05, clipZ = PZ + 0.09;
  const anchors = { ptfe: new THREE.Vector3(-0.35, barY - 0.02, clipZ), cable: new THREE.Vector3(0.4, barY - 0.02, clipZ) };
  for (const k in anchors) box(0.08, 0.08, 0.05, grey, anchors[k].x, barY, PZ + 0.085);
  const ptfeM = new THREE.MeshPhysicalMaterial({ color: 0xf4f1ea, roughness: 0.25, transparent: true, opacity: 0.85 });
  const tubes = [
    { off: new THREE.Vector3(0, 0.83, 0), a: anchors.ptfe, r: 0.016, m: ptfeM },
    { off: new THREE.Vector3(0, 0.83, 0), a: anchors.ptfe, r: 0.007, m: new THREE.MeshStandardMaterial({ color: C.terracota }) },
    { off: new THREE.Vector3(0.12, 0.72, -0.15), a: anchors.cable, r: 0.02, m: blackPl },
  ].map(t => { const mesh = new THREE.Mesh(new THREE.BufferGeometry(), t.m); mesh.castShadow = true; printer.add(mesh); return { ...t, mesh }; });
  const _p0 = new THREE.Vector3();
  function updateTubes() {
    for (const t of tubes) {
      _p0.copy(head.position).add(t.off);
      const h = THREE.MathUtils.clamp((t.a.y - _p0.y) * 0.5, 0.04, 0.45);
      const curve = new THREE.CubicBezierCurve3(_p0.clone(), _p0.clone().add(new THREE.Vector3(0, h, 0)), t.a.clone().add(new THREE.Vector3(0, -Math.max(0.12, h * 0.6), 0.25)), t.a);
      t.mesh.geometry.dispose(); t.mesh.geometry = new THREE.TubeGeometry(curve, 32, t.r, 8);
    }
  }
  const GANTRY_OFF = 0.6; // altura del riel respecto a la punta
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
  const floor = new THREE.Mesh(new THREE.CircleGeometry(2.4, 48), new THREE.ShadowMaterial({ opacity: 0.16 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

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
    if (mobile) { printer.position.set(0, -0.2, 0); camera.position.set(0, 3.0, 14.5); camera.lookAt(0, 2.6, 0); }
    else { printer.position.set(1.7, 0, 0); camera.position.set(-0.2, 2.8, 10.8); camera.lookAt(0.9, 1.75, 0); }
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
    const tx = done ? 0 : xs[idx];
    head.position.x += (tx - head.position.x) * Math.min(1, dt * 14);
    const targetY = done ? archGroup.position.y + archH + 0.35 : archGroup.position.y + hNow + 0.005;
    head.position.y += (targetY - head.position.y) * Math.min(1, dt * 12);
    gantry.position.y = head.position.y + GANTRY_OFF;
    updateTubes();
    if (!reduced) { blades.rotation.z += dt * 18; sblades.rotation.z += dt * (printing ? 25 : 4); }
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
