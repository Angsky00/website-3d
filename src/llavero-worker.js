// Genera el llavero fuera del hilo principal: el scroll y la escritura no se traban mientras manifold calcula.
import { construirLlavero, cargarManifold, MODELOS } from './nombre3d.js';
import wasmUrl from 'manifold-3d/manifold.wasm?url';

const FUENTES = import.meta.glob('./fuentes-llavero/*.json', { import: 'default' });
const cache = new Map();
let wasmP = null;

// solo se calcula el pedido más reciente: si llegan varios mientras uno se arma, los viejos se descartan
let siguiente = null, ocupado = false;
self.onmessage = ({ data }) => {
  if (siguiente) self.postMessage({ id: siguiente.id, descartado: true });
  siguiente = data; if (!ocupado) procesar();
};
async function procesar() {
  ocupado = true;
  while (siguiente) { const p = siguiente; siguiente = null; await armar(p); }
  ocupado = false;
}

async function armar({ id, estilo, nombre, modelo }) {
  try {
    wasmP ??= cargarManifold({ locateFile: () => wasmUrl });
    if (!cache.has(estilo)) cache.set(estilo, FUENTES[`./fuentes-llavero/${estilo}.json`]());
    const [w, fuente] = await Promise.all([wasmP, cache.get(estilo)]);
    const r = construirLlavero(w, fuente, nombre, modelo);
    if (!r.cabe) {
      // no cabe con letras de 10 mm: se buscan los modelos donde sí cabe, para resaltarlos
      const cabeEn = MODELOS.filter(x => x !== modelo && (() => { const o = construirLlavero(w, fuente, nombre, x); o.geometria?.dispose(); return o.cabe; })());
      self.postMessage({ id, meta: { cabe: false, modelo, cabeEn } }); return;
    }
    const { geometria, ...meta } = r;
    const pos = geometria.getAttribute('position').array, idx = geometria.getIndex().array;
    self.postMessage({ id, pos, idx, meta }, [pos.buffer, idx.buffer]);
  } catch (e) { self.postMessage({ id, error: String(e?.message || e) }); }
}
