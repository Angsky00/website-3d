// Interfaz de «Tu nombre en 3D» (llavero): vista previa (solo cuando la sección está cerca de la vista) y descarga.
// El motor geométrico (manifold-3d, wasm) corre en un Worker y se carga solo al acercarse a la sección.
import * as THREE from 'three';
import { validarNombre, exportarSTL, archivoNombre } from './nombre3d.js';

import { ESTILOS } from './estilos-llavero.js';

// miniaturas de los modelos (SVG en línea, decorativas: el texto de la opción ya lo dice)
const T = '#c4683f', A = '#ecd9b8', LET = `<text x="40" y="33" text-anchor="middle" font-family="Pacifico,cursive" font-size="19" fill="${A}" stroke="#7a3f25" stroke-width=".6">Ana</text>`;
const svg = c => `<svg class="n3d-mini" viewBox="0 0 80 48" aria-hidden="true" focusable="false">${c}</svg>`;
const MINIATURAS = {
  letras: svg(`<circle cx="15" cy="27" r="5" fill="none" stroke="${A}" stroke-width="3.2"/><text x="44" y="34" text-anchor="middle" font-family="Pacifico,cursive" font-size="22" fill="${A}" stroke="#7a3f25" stroke-width=".7">Ana</text>`),
  fondo: svg(`<rect x="7" y="10" width="68" height="30" rx="14" fill="${T}"/><circle cx="16" cy="25" r="3.2" fill="#fff8ee"/>` + LET.replace('x="40"', 'x="46"')),
  hueso: svg(`<g fill="${T}"><rect x="14" y="15" width="52" height="18"/><circle cx="12" cy="16" r="8"/><circle cx="12" cy="32" r="8"/><circle cx="68" cy="16" r="8"/><circle cx="68" cy="32" r="8"/></g><circle cx="10" cy="14" r="2.6" fill="#fff8ee"/>` + LET),
  cuadros: svg(`<g fill="${T}" stroke="${A}" stroke-width="1.6"><rect x="10" y="12" width="21" height="24" rx="3"/><rect x="30" y="12" width="21" height="24" rx="3"/><rect x="50" y="12" width="21" height="24" rx="3"/></g><circle cx="5" cy="24" r="4" fill="${T}"/><circle cx="5" cy="24" r="1.8" fill="#fff8ee"/><g font-family="Pacifico,cursive" font-size="15" fill="${A}" text-anchor="middle"><text x="20.5" y="30">A</text><text x="40.5" y="30">n</text><text x="60.5" y="30">a</text></g>`),
};
import '@fontsource/pacifico/latin-400.css'; import '@fontsource/lobster/latin-400.css'; import '@fontsource/lobster-two/latin-700.css';
import '@fontsource/leckerli-one/latin-400.css'; import '@fontsource/kaushan-script/latin-400.css'; import '@fontsource/oleo-script/latin-700.css';
import '@fontsource/sansita-swashed/latin-800.css'; import '@fontsource/courgette/latin-400.css'; import '@fontsource/grand-hotel/latin-400.css';
import '@fontsource/merienda/latin-700.css';

// la geometría se calcula en un Worker (manifold-3d en wasm + contornos de la fuente elegida, cargados al pedirlos)
let worker = null, sig = 0;
const pedidos = new Map();
const generar = (estilo, nombre, modelo) => new Promise((res, rej) => {
  if (!worker) {
    worker = new Worker(new URL('./llavero-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => { const p = pedidos.get(data.id); pedidos.delete(data.id); if (p) data.error ? p.rej(new Error(data.error)) : p.res(data); };
  }
  const id = ++sig; pedidos.set(id, { res, rej }); worker.postMessage({ id, estilo, nombre, modelo });
});
const aGeometria = ({ pos, idx }) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
  return g;
};

const C = { arena: 0xE7D9C1, terracota: 0xB2442E, carbon: 0x1F1B18 };

export function crearNombre3D(root, { reduced, inicial = 'Calkiní', textos = {} } = {}) {
  const form = root.querySelector('form'), input = form.querySelector('input'), msg = root.querySelector('.n3d-msg');
  const medidas = root.querySelector('.n3d-medidas'), cv = root.querySelector('canvas'), boton = form.querySelector('button[type=submit]');
  // selector de estilo: cada opción muestra el nombre escrito en su fuente
  const selector = root.querySelector('.n3d-estilos');
  selector.innerHTML = ESTILOS.map((e, i) => `<label class="n3d-estilo"><input type="radio" name="estilo" value="${e.id}"${i ? '' : ' checked'}><span class="sr">Estilo ${i + 1} de ${ESTILOS.length}: </span><span class="n3d-muestra" style="font-family:'${e.familia}',cursive;font-weight:${e.peso}"></span></label>`).join('');
  const estilo = () => selector.querySelector('input:checked').value;
  // selector de modelo: miniatura dibujada (terracota = base, arena = letras/relieve) + nombre + nota
  const selModelo = root.querySelector('.n3d-modelos');
  selModelo.innerHTML = (textos.modelos || []).map((o, i) => `<label class="n3d-modelo"><input type="radio" name="modelo" value="${o.id}"${i ? '' : ' checked'}><span class="n3d-ficha">${MINIATURAS[o.id]}<span class="n3d-ficha-txt"><strong>${o.nombre}</strong><small>${o.nota}</small></span></span></label>`).join('');
  const tipo = () => selModelo.querySelector('input:checked')?.value || 'letras';
  selModelo.addEventListener('change', () => { listo = true; actualizar(); });
  const muestras = [...selector.querySelectorAll('.n3d-muestra')];
  const pintarMuestras = () => { const v = validarNombre(input.value); const txt = v.ok ? v.nombre : (textos.campo || 'Tu nombre'); muestras.forEach(s => { s.textContent = txt; }); };
  selector.addEventListener('change', () => { listo = true; actualizar(); });
  let renderer = null, scene, cam, grupo, visible = false, modelo = null, raf = 0, t0 = performance.now();

  const iniciar = () => {
    if (renderer) return;
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    scene = new THREE.Scene();
    cam = new THREE.PerspectiveCamera(32, 1, 1, 2000);
    scene.add(new THREE.HemisphereLight(0xfff6ea, 0x3a302a, 1.4));
    const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(60, 120, 160); scene.add(d);
    grupo = new THREE.Group(); grupo.rotation.x = -Math.PI / 6; scene.add(grupo);
    redimensionar(); dibujarModelo();
  };
  const redimensionar = () => { if (!renderer) return; const w = cv.clientWidth, h = cv.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); encuadrar(); render(); };
  const encuadrar = () => {
    if (!modelo) return; const { ancho, alto } = modelo.medidas;
    const r = Math.hypot(ancho, alto) / 2, fit = r / Math.sin(THREE.MathUtils.degToRad(cam.fov / 2)) / Math.min(1, cam.aspect);
    cam.position.set(0, 0, fit * 0.85); cam.lookAt(0, 0, 0);
  };
  const dibujarModelo = () => {
    if (!renderer || !modelo) return;
    grupo.children.forEach(o => o.geometry.dispose()); grupo.clear();
    const mat = (color, rough) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.05 });
    // un solo sólido; solo en la vista previa, las letras (todo lo que sube del respaldo) van en otro tono para que se lean
    const g = modelo.geometria.toNonIndexed(), z = g.attributes.position, tope = modelo.respaldo + 0.01, letras = [], fondo = [];
    for (let i = 0; i < z.count; i += 3) (Math.max(z.getZ(i), z.getZ(i + 1), z.getZ(i + 2)) > tope ? letras : fondo).push(i);
    const pos = new Float32Array(z.count * 3); let k = 0;
    for (const i of [...fondo, ...letras]) for (let j = 0; j < 3; j++, k += 3) { pos[k] = z.getX(i + j); pos[k + 1] = z.getY(i + j); pos[k + 2] = z.getZ(i + j); }
    const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    o.addGroup(0, fondo.length * 3, 0); o.addGroup(fondo.length * 3, letras.length * 3, 1);
    o.computeVertexNormals(); o.translate(0, 0, -modelo.medidas.grueso / 2); g.dispose();
    grupo.add(new THREE.Mesh(o, [mat(C.terracota, 0.7), mat(C.arena, 0.55)])); encuadrar(); render();
  };
  const limpiar = () => { if (!renderer) return; grupo.children.forEach(o => o.geometry.dispose()); grupo.clear(); render(); };
  const render = () => { if (renderer) renderer.render(scene, cam); };
  const loop = now => {
    raf = 0; if (!visible || reduced || !renderer) return;
    grupo.rotation.z = Math.sin((now - t0) / 2600) * 0.32; render(); raf = requestAnimationFrame(loop);
  };
  const arrancar = () => { if (!raf && visible && !reduced) raf = requestAnimationFrame(loop); };

  let turno = 0;
  const actualizar = async () => {
    const yo = ++turno;
    const v = validarNombre(input.value);
    const vacio = !input.value.trim();
    input.setAttribute('aria-invalid', v.ok || vacio ? 'false' : 'true');
    if (!v.ok) {
      // campo vacío: invitación en gris, no error
      msg.classList.remove('ok'); msg.classList.toggle('pista', vacio); msg.textContent = vacio ? textos.vacio : v.msg;
      selModelo.querySelectorAll('.n3d-sugerido').forEach(l => l.classList.remove('n3d-sugerido'));
      modelo = null; medidas.textContent = ''; boton.disabled = true; limpiar(); return null;
    }
    msg.textContent = ''; msg.classList.remove('ok', 'pista');
    boton.disabled = true; root.classList.add('n3d-cargando');
    let r;
    try { r = await generar(estilo(), v.nombre, tipo()); } catch (e) {
      if (yo !== turno) return null;
      root.classList.remove('n3d-cargando'); msg.textContent = 'No pudimos armar tu llavero. Prueba con otro modelo o estilo.'; console.error(e); return null;
    }
    if (yo !== turno || r.descartado) return null; // llegó otra tecla mientras tanto
    selModelo.querySelectorAll('.n3d-modelo').forEach(l => l.classList.remove('n3d-sugerido'));
    if (!r.meta.cabe) {
      // aviso suave (gris, como los demás) y descarga bloqueada; se resaltan los modelos donde sí cabe
      if (modelo) modelo.geometria.dispose();
      modelo = null; medidas.textContent = ''; limpiar(); root.classList.remove('n3d-cargando');
      msg.classList.add('pista'); msg.textContent = textos.noCabe;
      for (const id of r.meta.cabeEn) selModelo.querySelector(`input[value=${id}]`).closest('.n3d-modelo').classList.add('n3d-sugerido');
      return null;
    }
    const nuevo = { ...r.meta, geometria: aGeometria(r) };
    if (modelo) modelo.geometria.dispose();
    modelo = nuevo; root.classList.remove('n3d-cargando'); boton.disabled = false;
    const { ancho, alto, grueso } = modelo.medidas;
    medidas.textContent = `${ancho} × ${alto} × ${grueso} mm · STL`;
    dibujarModelo();
    return v;
  };
  let pend = 0, listo = false;
  input.addEventListener('input', () => { pintarMuestras(); clearTimeout(pend); pend = setTimeout(actualizar, 350); });
  form.addEventListener('submit', async e => {
    e.preventDefault(); clearTimeout(pend);
    const v0 = validarNombre(input.value);
    if (!v0.ok) { actualizar(); msg.textContent = v0.msg; input.focus(); return; }
    const v = await actualizar(); if (!v || !modelo) return;
    const blob = new Blob([exportarSTL(modelo)], { type: 'model/stl' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = archivoNombre(v.nombre);
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    msg.textContent = 'Listo: tu archivo se descargó.'; msg.classList.remove('pista'); msg.classList.add('ok');
  });
  input.maxLength = 40; // tope amplio solo contra pegados enormes; el límite de 12 lo avisa validarNombre
  input.value = inicial; boton.disabled = true; pintarMuestras();
  // el primer cálculo (y la descarga del motor) espera a que la sección esté cerca
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) { iniciar(); render(); arrancar(); if (!listo) { listo = true; actualizar(); } } }, { rootMargin: '600px 0px' }).observe(cv);
  input.addEventListener('focus', () => { if (!listo) { listo = true; actualizar(); } });
  addEventListener('resize', redimensionar);
  return { actualizar, get modelo() { return modelo; } };
}
