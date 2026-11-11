// Diagnóstico de legibilidad del llavero: arma «Angel», «Maximiliano» y «Begoña» en las 10 fuentes × 4 modelos y guarda,
// por caso, el engrosado aplicado, la apertura de cada contrapunzón, la separación entre letras y la huella 2D (base y relieve).
// Uso: node tools/legibilidad.mjs <salida.json> [nombres separados por coma]
import { createServer } from 'vite';
import { readFileSync, writeFileSync } from 'node:fs';
const [, , salida, lista] = process.argv;
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const m = await vite.ssrLoadModule('/src/nombre3d.js');
const { ESTILOS } = await vite.ssrLoadModule('/src/estilos-llavero.js');
const w = await m.cargarManifold();
const NOMBRES = lista ? lista.split(',') : ['Angel', 'Maximiliano', 'Begoña'];
const out = [];
for (const nombre of NOMBRES) for (const e of ESTILOS) for (const modelo of m.MODELOS) {
  const fuente = JSON.parse(readFileSync(`src/fuentes-llavero/${e.id}.json`, 'utf8'));
  const t0 = Date.now();
  const r = m.construirLlavero(w, fuente, nombre, modelo, m.MEDIDAS, { legibilidad: true, dibujo: true });
  const ms = Date.now() - t0;
  r.geometria?.dispose();
  const L = r.legibilidad;
  out.push({ nombre, estilo: e.id, familia: e.familia, modelo, cabe: r.cabe, ms, engrosado: r.engrosado, mayuscula: r.mayuscula, medidas: r.medidas, legibilidad: L, dibujo: r.dibujo });
  console.log(nombre.padEnd(12), e.familia.padEnd(16), modelo.padEnd(8), r.cabe ? `engr ${r.engrosado} · apertura mín ${L.minApertura} · hueco mín ${L.minHueco} · ${ms} ms` : 'no cabe');
}
writeFileSync(salida, JSON.stringify(out));
await vite.close(); process.exit(0);
