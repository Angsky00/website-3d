// Despiece del extrusor (procedural, sin descargas). Puramente visual (sin rótulos). Inspirado en despieces editoriales: eje diagonal (escritorio) / vertical (celular),
// vista 3/4, materiales PBR y luz de estudio. setProgress(p): 0 armado → piezas se separan una a una → p≥0.82 se rearma.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

export function createDespiece(canvas, { reduced }) {
  const C = { terracota: css('--terracota'), jade: css('--jade'), arena: css('--arena'), carbon: css('--carbon'), crema: css('--crema') };
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(26, 1, 0.1, 200);
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.55;
  // luz de estudio suave: principal cálida con sombra, relleno y contraluz terracota/jade
  const key = new THREE.DirectionalLight(0xfff4e6, 2.6); key.position.set(5, 8, 7); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 6; key.shadow.bias = -0.0008;
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 }); scene.add(key);
  scene.add(new THREE.HemisphereLight(0xf4ecdd, 0x1f1b18, 0.6));
  const rimT = new THREE.DirectionalLight(0xffffff, 0.8); rimT.position.set(6, -2, -6); scene.add(rimT);
  const rimJ = new THREE.DirectionalLight(0xffffff, 0.6); rimJ.position.set(-7, 3, -4); scene.add(rimJ);
  // eje: tiltZ (diagonal/vertical) > tiltX + spinY (vista 3/4) > piezas sobre el eje local Y
  const tiltZ = new THREE.Group(), tilt = new THREE.Group(); scene.add(tiltZ); tiltZ.add(tilt); tilt.rotation.set(0.32, 0.72, 0);
  const plastic = c => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.32, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.18 });
  const metal = (c, r = 0.28) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0.95 });
  const M = { carbon: plastic('#3b3836'), arena: plastic('#8f8b86'), crema: plastic('#b9b5b0'), alu: metal('#a8a49f', 0.32), hot: metal(C.terracota, 0.4), hotP: plastic(C.terracota), aluD: metal('#8d8478', 0.35), steel: metal('#c9c1b4', 0.22), brass: metal('#9a9792', 0.2),
    ptfe: new THREE.MeshPhysicalMaterial({ color: '#d8d6d3', roughness: 0.25, transmission: 0, transparent: true, opacity: 0.55, clearcoat: 1, depthWrite: false }),
    fil: new THREE.MeshStandardMaterial({ color: C.jade, roughness: 0.35, emissive: new THREE.Color(C.jade), emissiveIntensity: 0.25 }),
    cable: new THREE.MeshStandardMaterial({ color: C.carbon, roughness: 0.6 }) };
  const mk = (geo, m, g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  const rb = (w, h, d, r = 0.04) => new RoundedBoxGeometry(w, h, d, 3, r);
  const cyl = (r, h, s = 32) => new THREE.CylinderGeometry(r, r, h, s);
  const gearGeo = (r, n, t) => { const s = new THREE.Shape(); for (let i = 0; i <= n * 4; i++) { const a = i / (n * 4) * Math.PI * 2, k = i % 4, rr = k === 1 || k === 2 ? r : r * 0.84; s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    const h = new THREE.Path(); h.absarc(0, 0, r * 0.22, 0, Math.PI * 2, true); s.holes.push(h); return new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 6 }).translate(0, 0, -t / 2); };
  const parts = [];
  // [constructor, posición armada, posición abierta]; el orden = orden de separación (de arriba a abajo del eje)
  const add = (build, home, open) => { const g = new THREE.Group(); build(g); tilt.add(g); const mats = new Set(); g.traverse(o => { if (o.material) mats.add(o.material); });
    parts.push({ g, home: new THREE.Vector3(...home), open: new THREE.Vector3(...open), rot: 0.12, meshes: [] }); g.traverse(o => { if (o.isMesh) parts.at(-1).meshes.push([o, o.material]); }); };
  add(g => { mk(cyl(0.075, 1.6), M.ptfe, g); mk(cyl(0.028, 3.4, 12), M.fil, g, 0, 0.7); mk(cyl(0.12, 0.14, 6), M.brass, g, 0, -0.8); }, [0, 2.35, 0], [0, 6.6, 0]); // tubo PTFE + filamento
  add(g => { mk(rb(0.95, 0.95, 0.8, 0.06), M.carbon, g); for (const y of [-0.3, 0.3]) mk(rb(0.97, 0.07, 0.82, 0.02), M.aluD, g, 0, y); mk(cyl(0.05, 0.4, 16), M.steel, g, 0, 0, 0.55, Math.PI / 2);
    mk(cyl(0.03, 0.5, 8), M.cable, g, -0.3, -0.6, 0); }, [-0.95, 1.4, -0.1], [0, 5.1, 0]); // motor
  add(g => { const geo = gearGeo(0.27, 12, 0.16); mk(geo, M.steel, g, -0.29, 0, 0); mk(geo, M.steel, g, 0.29, 0, 0); mk(cyl(0.05, 0.3, 12), M.brass, g, -0.29, 0, 0, Math.PI / 2); mk(cyl(0.05, 0.3, 12), M.brass, g, 0.29, 0, 0, Math.PI / 2); }, [0, 1.4, 0], [0, 3.8, 0]); // engranes
  add(g => { for (let i = 0; i < 10; i++) mk(cyl(0.42 - (i % 2) * 0.02, 0.045, 40), M.alu, g, 0, -0.25 + i * 0.09); mk(cyl(0.13, 1.05, 24), M.aluD, g, 0, 0.1); mk(rb(0.9, 0.16, 0.9, 0.03), M.carbon, g, 0, 0.72); }, [0, 0.35, 0], [0, 2.5, 0]); // disipador
  add(g => { const f = new THREE.Shape(); f.moveTo(-0.45, -0.45); f.lineTo(0.45, -0.45); f.lineTo(0.45, 0.45); f.lineTo(-0.45, 0.45); const h = new THREE.Path(); h.absarc(0, 0, 0.38, 0, Math.PI * 2, true); f.holes.push(h);
    mk(new THREE.ExtrudeGeometry(f, { depth: 0.16, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }).translate(0, 0, -0.08), M.carbon, g);
    mk(cyl(0.13, 0.14, 24), M.carbon, g, 0, 0, 0, Math.PI / 2); for (let i = 0; i < 7; i++) { const b = mk(rb(0.27, 0.12, 0.02, 0.01), M.arena, g, Math.cos(i * 0.898) * 0.22, Math.sin(i * 0.898) * 0.22, 0, 0.5, 0, i * 0.898); }
    for (const [x, y] of [[-0.38, -0.38], [0.38, -0.38], [-0.38, 0.38], [0.38, 0.38]]) mk(cyl(0.03, 0.2, 10), M.steel, g, x, y, 0, Math.PI / 2); }, [0, 0.35, 0.58], [0, 1.15, 0]); // ventilador
  add(g => { const s = new THREE.Shape(); s.moveTo(-0.5, 0.15); s.lineTo(0.5, 0.15); s.lineTo(0.3, -0.25); s.lineTo(-0.3, -0.25); mk(new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }).translate(0, 0, -0.25), M.arena, g);
    mk(rb(0.5, 0.1, 0.22, 0.03), M.arena, g, 0, -0.3, 0.1); }, [0, -0.55, 0.55], [0, -0.05, 0]); // ducto
  add(g => { mk(rb(0.78, 0.48, 0.52, 0.04), M.hot, g); mk(cyl(0.05, 0.08, 6), M.steel, g, 0.2, 0.26, 0.15); }, [0, -0.62, 0], [0, -1.25, 0]); // bloque calentador
  add(g => { mk(cyl(0.085, 0.82, 24), M.steel, g, 0, 0, 0, 0, 0, Math.PI / 2); mk(cyl(0.02, 0.6, 8), M.cable, g, 0.65, 0.04, 0.03, 0, 0, Math.PI / 2); mk(cyl(0.02, 0.6, 8), M.cable, g, 0.65, -0.04, -0.03, 0, 0, Math.PI / 2); }, [0.05, -0.55, 0.1], [0, -2.3, 0]); // cartucho
  add(g => { mk(cyl(0.04, 0.5, 16), M.steel, g, 0, 0, 0, 0, 0, Math.PI / 2); mk(new THREE.SphereGeometry(0.055, 16, 12), M.carbon, g, -0.26, 0, 0); mk(cyl(0.015, 0.5, 8), M.cable, g, 0.5, 0, 0, 0, 0, Math.PI / 2); }, [0.05, -0.75, -0.14], [0, -3.15, 0]); // termistor
  add(g => { mk(cyl(0.05, 0.3, 16), M.hot, g, 0, 0.2); mk(cyl(0.16, 0.14, 6), M.hot, g, 0, 0); mk(new THREE.ConeGeometry(0.12, 0.22, 24), M.hot, g, 0, -0.18, 0, Math.PI); }, [0, -1.0, 0], [0, -4.1, 0]); // boquilla
  const N = parts.length, glow = new Map(); // activa: realce sutil (emisivo crema) sobre su propio material
  const hi = m => { if (!glow.has(m)) { const h = m.clone(); h.emissive = new THREE.Color(C.crema); h.emissiveIntensity = 0.22; glow.set(m, h); } return glow.get(m); };
  let W = 1, H = 1, mobile = false, last = -1, ready = false, cur = reduced ? 0.76 : 0;
  const v = new THREE.Vector3();
  function place(s) { parts.forEach(q => { q.g.position.lerpVectors(q.home, q.open, s); }); }
  function layout() {
    const r = canvas.getBoundingClientRect(); W = r.width || 1; H = r.height || 1; mobile = W < 820;
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.5)); renderer.setSize(W, H, false); camera.aspect = W / H;
    tiltZ.rotation.z = mobile ? 0 : -Math.PI / 4; // escritorio: eje de arriba-derecha a abajo-izquierda
    place(1); scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(tilt), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // área útil: escritorio deja libre la columna de texto izquierda; celular deja título arriba y ficha abajo
    // escritorio: el modelo llena el hueco entre las columnas de texto (medidas reales)
    let fw = 0.86, fh = 0.8, gapC = W / 2;
    if (!mobile) { const st = canvas.parentElement.getBoundingClientRect(), cl = canvas.parentElement.querySelector('.dl-l'), cr = canvas.parentElement.querySelector('.dl-r');
      const a = cl ? cl.getBoundingClientRect().right - st.left + 24 : 0.25 * W, b = cr ? cr.getBoundingClientRect().left - st.left - 24 : 0.75 * W;
      fw = Math.max(0.3, (b - a) / W); fh = 0.86; gapC = (a + b) / 2; }
    const d = Math.max(sz.y / fh / 2 / t, sz.x / fw / 2 / (t * camera.aspect)) + sz.z / 2;
    const sx = 0, sy = 0; // desplazamiento en pantalla del conjunto (px)
    const wpp = 2 * d * t / H; // unidades por px a la distancia d
    camera.position.set(c.x - sx * wpp, c.y + sy * wpp, c.z + d); camera.lookAt(camera.position.x, camera.position.y, c.z); camera.updateProjectionMatrix();
    // ajuste fino en pantalla con las cajas de cada pieza (más justas que la caja global en diagonal): escala y centra en el hueco
    const pts = []; parts.forEach(q => { const b = new THREE.Box3().setFromObject(q.g); for (let k = 0; k < 8; k++) pts.push(new THREE.Vector3(k & 1 ? b.max.x : b.min.x, k & 2 ? b.max.y : b.min.y, k & 4 ? b.max.z : b.min.z)); });
    for (let it = 0; it < 4; it++) {
      camera.updateMatrixWorld(); const pr = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 };
      pts.forEach(P => { v.copy(P).project(camera); pr.x0 = Math.min(pr.x0, v.x); pr.x1 = Math.max(pr.x1, v.x); pr.y0 = Math.min(pr.y0, v.y); pr.y1 = Math.max(pr.y1, v.y); });
      const dist = camera.position.z - c.z, k = Math.max((pr.x1 - pr.x0) / 2 / fw, (pr.y1 - pr.y0) / 2 / fh), w2 = 2 * dist * t / H;
      const ox = (pr.x0 + pr.x1) / 2 * W / 2 - (mobile ? 0 : gapC - W / 2), oy = (pr.y0 + pr.y1) / 2 * H / 2;
      camera.position.x += ox * w2; camera.position.y += oy * w2; camera.position.z = c.z + dist * k;
      camera.lookAt(camera.position.x, camera.position.y, c.z); camera.updateProjectionMatrix(); }
    ready = true; last = -1; draw(cur);
  }
  const sm = t => t * t * (3 - 2 * t), cl = (a, b, x) => Math.min(b, Math.max(a, x));
  function draw(p) {
    if (!ready) return;
    // separación: 0.04–0.70 una por una; 0.70–0.82 abierto; 0.82–0.98 rearmado
    const back = sm(cl(0, 1, (p - 0.82) / 0.16)), slot = 0.66 / N;
    let active = -1;
    parts.forEach((q, i) => {
      const a = 0.04 + i * slot, s = sm(cl(0, 1, (p - a) / slot)) * (1 - back);
      if (!reduced && p >= a && p < a + slot) active = i;
      q.g.position.lerpVectors(q.home, q.open, s); q.g.rotation.set(q.rot * 0.6 * s, q.rot * s, q.rot * 0.4 * s); q.s = s;
    });
    if (!reduced && p > 0.82 && p < 0.98) active = N - 1 - Math.min(N - 1, Math.floor((p - 0.82) / 0.16 * N));
    parts.forEach((q, i) => q.meshes.forEach(([o, m]) => { o.material = i === active && m !== M.fil ? hi(m) : m; }));
    scene.updateMatrixWorld(); renderer.render(scene, camera);
  }
  addEventListener('resize', layout); requestAnimationFrame(layout);
  const bounds = () => { const r = { l: 1e9, r: -1e9, t: 1e9, b: -1e9 }; parts.forEach(q => { const b = new THREE.Box3().setFromObject(q.g);
    for (let k = 0; k < 8; k++) { v.set(k & 1 ? b.max.x : b.min.x, k & 2 ? b.max.y : b.min.y, k & 4 ? b.max.z : b.min.z).project(camera); const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H; r.l = Math.min(r.l, x); r.r = Math.max(r.r, x); r.t = Math.min(r.t, y); r.b = Math.max(r.b, y); } }); return r; };
  return { bounds, setProgress(p) { cur = p; if (Math.abs(p - last) > 1e-4) { last = p; draw(p); } }, layout };
}
