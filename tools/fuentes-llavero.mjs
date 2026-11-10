// Genera src/fuentes-llavero/<id>.json: contornos ya aplanados (unidades de 1000 por em) de solo las letras permitidas,
// para las fuentes candidatas del llavero. Todas son SIL OFL 1.1 sin nombre reservado; aun así los subconjuntos llevan
// nombre propio y la licencia de cada una se publica en public/licencias/. Uso: node tools/fuentes-llavero.mjs
import opentype from 'opentype.js';
import { readFileSync, writeFileSync } from 'fs';
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÉÍÓÚÜÑáéíóúüñ';
export const FUENTES = [
  { id: 'script', nombre: 'Llavero Script', origen: 'Pacifico 400', pkg: 'pacifico', file: 'pacifico-latin-400-normal.woff' },
  { id: 'redonda', nombre: 'Llavero Redonda', origen: 'Baloo 2 ExtraBold 800', pkg: 'baloo-2', file: 'baloo-2-latin-800-normal.woff' },
  { id: 'suave', nombre: 'Llavero Suave', origen: 'Fredoka Bold 700', pkg: 'fredoka', file: 'fredoka-latin-700-normal.woff' },
];
const SEG_Q = 6, SEG_C = 8;
for (const f of FUENTES) {
  const buf = readFileSync(`node_modules/@fontsource/${f.pkg}/files/${f.file}`);
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  const k = 1000 / font.unitsPerEm, r = v => Math.round(v * k * 10) / 10;
  const glyphs = {};
  for (const ch of LETRAS) {
    const g = font.charToGlyph(ch);
    if (!g || g.index === 0) throw new Error(`${f.id}: falta la letra ${ch}`);
    const contornos = []; let cur = null, x = 0, y = 0;
    const push = (px, py) => { cur.push(r(px), r(py)); x = px; y = py; };
    for (const c of g.path.commands) {
      if (c.type === 'M') { cur = []; contornos.push(cur); push(c.x, c.y); }
      else if (c.type === 'L') push(c.x, c.y);
      else if (c.type === 'Q') { const x0 = x, y0 = y; for (let i = 1; i <= SEG_Q; i++) { const t = i / SEG_Q, a = (1 - t) ** 2, b = 2 * (1 - t) * t, d = t * t; push(a * x0 + b * c.x1 + d * c.x, a * y0 + b * c.y1 + d * c.y); } }
      else if (c.type === 'C') { const x0 = x, y0 = y; for (let i = 1; i <= SEG_C; i++) { const t = i / SEG_C, a = (1 - t) ** 3, b = 3 * (1 - t) ** 2 * t, e = 3 * (1 - t) * t * t, d = t ** 3; push(a * x0 + b * c.x1 + e * c.x2 + d * c.x, a * y0 + b * c.y1 + e * c.y2 + d * c.y); } }
    }
    // quitar el punto final repetido de cada contorno
    for (const p of contornos) if (p.length >= 4 && p[0] === p[p.length - 2] && p[1] === p[p.length - 1]) p.splice(-2, 2);
    glyphs[ch] = { ha: r(g.advanceWidth), c: contornos.filter(p => p.length >= 6) };
  }
  const kern = {};
  for (const a of LETRAS) for (const b of LETRAS) { const v = font.getKerningValue(font.charToGlyph(a), font.charToGlyph(b)); if (v) kern[a + b] = r(v); }
  const lic = readFileSync(`node_modules/@fontsource/${f.pkg}/LICENSE`, 'utf8');
  const copyright = lic.split('\n')[0].trim();
  writeFileSync(`src/fuentes-llavero/${f.id}.json`, JSON.stringify({ nombre: f.nombre, origen: f.origen, copyright, licencia: 'SIL Open Font License 1.1; ver licencias/llavero-' + f.id + '-OFL.txt en el sitio', capHeight: r(font.tables.os2.sCapHeight || 700), glyphs, kern }));
  writeFileSync(`public/licencias/llavero-${f.id}-OFL.txt`, `«${f.nombre}» es una versión modificada de ${f.origen}: un subconjunto con las letras A–Z, a–z, Á É Í Ó Ú Ü Ñ y á é í ó ú ü ñ,\nconvertido a contornos para generar los llaveros de «Tu nombre en 3D» de Camino Digital.\n\n` + lic);
  console.log(f.id, Object.keys(glyphs).length, 'letras', Object.keys(kern).length, 'pares de kerning', JSON.stringify(glyphs).length, 'bytes');
}
