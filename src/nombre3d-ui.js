// Interfaz de «Tu nombre en 3D»: vista previa (solo cuando la sección está a la vista) y descarga.
import * as THREE from 'three';
import { validarNombre, construirModelo, exportarSTL, archivoNombre, MAX } from './nombre3d.js';

const C = { arena: 0xE7D9C1, terracota: 0xB2442E, carbon: 0x1F1B18 };

export function crearNombre3D(root, { reduced, inicial = 'Calkiní' } = {}) {
  const form = root.querySelector('form'), input = form.querySelector('input'), msg = root.querySelector('.n3d-msg');
  const medidas = root.querySelector('.n3d-medidas'), cv = root.querySelector('canvas');
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
    const b = new THREE.Mesh(modelo.base, mat(C.arena, 0.85)), t = new THREE.Mesh(modelo.texto, mat(C.terracota, 0.6));
    const z = -(modelo.medidas.grueso) / 2; b.position.z = z; t.position.z = z;
    grupo.add(b, t); encuadrar(); render();
  };
  const render = () => { if (renderer) renderer.render(scene, cam); };
  const loop = now => {
    raf = 0; if (!visible || reduced || !renderer) return;
    grupo.rotation.z = Math.sin((now - t0) / 2600) * 0.32; render(); raf = requestAnimationFrame(loop);
  };
  const arrancar = () => { if (!raf && visible && !reduced) raf = requestAnimationFrame(loop); };

  const actualizar = () => {
    const v = validarNombre(input.value);
    input.setAttribute('aria-invalid', v.ok ? 'false' : 'true');
    if (!v.ok) { msg.classList.remove('ok'); msg.textContent = input.value.trim() ? v.msg : ''; return null; }
    msg.textContent = ''; msg.classList.remove('ok');
    modelo = construirModelo(v.nombre);
    const { ancho, alto, grueso } = modelo.medidas;
    medidas.textContent = `${ancho} × ${alto} × ${grueso} mm · STL`;
    dibujarModelo();
    return v;
  };
  let pend = 0;
  input.addEventListener('input', () => { clearTimeout(pend); pend = setTimeout(actualizar, 160); });
  form.addEventListener('submit', e => {
    e.preventDefault(); clearTimeout(pend);
    const v = validarNombre(input.value);
    if (!v.ok) { msg.textContent = v.msg; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
    actualizar();
    const blob = new Blob([exportarSTL(modelo)], { type: 'model/stl' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = archivoNombre(v.nombre);
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    msg.textContent = 'Listo: tu archivo se descargó.'; msg.classList.add('ok');
  });
  input.maxLength = MAX; input.value = inicial; actualizar();
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) { iniciar(); render(); arrancar(); } }, { rootMargin: '200px 0px' }).observe(cv);
  addEventListener('resize', redimensionar);
  return { actualizar, get modelo() { return modelo; } };
}
