// Tu nombre en 3D: valida el nombre, arma el modelo (letras en relieve sobre una placa) y exporta STL binario en mm.
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import fuenteJSON from './fuente-nombre.json';

export const MAX = 12;
const LETRA = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/;
// medidas en mm, pensadas para la K1C (cama 220 × 220). relieve = lo que sobresale de la placa;
// las letras se extruyen relieve + hundido y se hunden «hundido» en la placa para quedar unidas (alto total placa + relieve = 5 mm)
export const MEDIDAS = { letra: 16, relieve: 2.6, placa: 2.4, margen: 5, radio: 4, anchoMax: 180, anchoMin: 30, hundido: 0.4 };
const font = new FontLoader().parse(fuenteJSON);

export function validarNombre(raw) {
  const s = (raw ?? '').normalize('NFC').trim();
  if (!s) return { ok: false, nombre: s, msg: 'Escribe tu nombre.' };
  if (/\s/.test(s)) return { ok: false, nombre: s, msg: 'Solo un nombre, sin espacios.' };
  if (/\d/.test(s)) return { ok: false, nombre: s, msg: 'Sin números: solo letras.' };
  if (!LETRA.test(s)) {
    // letras de otros idiomas (À, ç, ß…) tienen su propio aviso; el resto son números, emoji o signos
    const fuera = [...s].filter(ch => !LETRA.test(ch));
    const msg = fuera.every(ch => /\p{L}\p{M}*/u.test(ch)) ? 'Esa letra no está disponible. Usa letras del español.' : 'Sin símbolos: solo letras, con acentos y ñ.';
    return { ok: false, nombre: s, msg };
  }
  if ([...s].length > MAX) return { ok: false, nombre: s, msg: 'Máximo 12 letras. Prueba con tu apodo o solo el primer nombre.' };
  return { ok: true, nombre: s, msg: '' };
}

function placa(w, h, r, t) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 6 });
}

// Devuelve { texto, base, medidas } con Z hacia arriba (cara de la placa sobre la cama en z = 0)
export function construirModelo(nombre, m = MEDIDAS) {
  let size = m.letra, texto;
  for (let i = 0; i < 2; i++) {
    texto = new TextGeometry(nombre, { font, size, depth: m.relieve + m.hundido, curveSegments: 5, bevelEnabled: false });
    texto.computeBoundingBox();
    const w = texto.boundingBox.max.x - texto.boundingBox.min.x;
    if (w + 2 * m.margen <= m.anchoMax) break;
    size *= (m.anchoMax - 2 * m.margen) / w; texto.dispose();
  }
  const bb = texto.boundingBox;
  texto.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, m.placa - m.hundido);
  const tw = bb.max.x - bb.min.x, th = bb.max.y - bb.min.y;
  const W = Math.max(m.anchoMin, tw + 2 * m.margen), H = th + 2 * m.margen;
  const base = placa(W, H, Math.min(m.radio, H / 2 - 0.01), m.placa);
  const ancho = Math.round(W * 10) / 10, alto = Math.round(H * 10) / 10, grueso = Math.round((m.placa + m.relieve) * 10) / 10;
  return { texto, base, medidas: { ancho, alto, grueso } };
}

// STL binario en mm. Un solo cuerpo por pieza: placa y letras van como cuerpos cerrados que el laminador une.
export function exportarSTL(modelo) {
  const strip = g => { const c = g.index ? g.toNonIndexed() : g.clone(); for (const k of Object.keys(c.attributes)) if (k !== 'position' && k !== 'normal') c.deleteAttribute(k); return c; };
  const g = mergeGeometries([strip(modelo.base), strip(modelo.texto)]);
  const mesh = new THREE.Mesh(g);
  const data = new STLExporter().parse(mesh, { binary: true });
  g.dispose();
  return data; // DataView
}

// conserva mayúsculas, acentos y ñ para que «I» e «i» o «Ñ» y «n» no choquen
export const archivoNombre = n => 'camino-digital-' + n.normalize('NFC') + '.stl';
