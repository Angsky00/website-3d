// Genera src/fuentes-llavero/<id>.json: contornos ya aplanados (unidades de 1000 por em) de solo las letras permitidas,
// para las fuentes del llavero. Todas son SIL OFL 1.1; varias declaran nombre reservado (Lobster, Leckerli One,
// Kaushan Script, Oleo Script, Courgette, Grand Hotel, Merienda), así que los subconjuntos modificados llevan
// nombres propios neutros que no contienen ninguno, y la licencia de cada una se publica en public/licencias/.
// Los créditos y nombres reservados salen del OFL original (google/fonts ofl/<familia>/OFL.txt).
// Uso: node tools/fuentes-llavero.mjs
import opentype from 'opentype.js';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'fs';
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÉÍÓÚÜÑáéíóúüñ';
export const FUENTES = [
  { id: 'script', nombre: 'Llavero Script', origen: 'Pacifico 400', pkg: 'pacifico', file: 'pacifico-latin-400-normal.woff', ofl: 'pacifico' },
  { id: 'retro', nombre: 'Llavero Retro', origen: 'Lobster 400', pkg: 'lobster', file: 'lobster-latin-400-normal.woff', ofl: 'lobster' },
  { id: 'moderna', nombre: 'Llavero Moderna', origen: 'Lobster Two Bold 700', pkg: 'lobster-two', file: 'lobster-two-latin-700-normal.woff', ofl: 'lobstertwo' },
  { id: 'dulce', nombre: 'Llavero Dulce', origen: 'Leckerli One 400', pkg: 'leckerli-one', file: 'leckerli-one-latin-400-normal.woff', ofl: 'leckerlione' },
  { id: 'pincel', nombre: 'Llavero Pincel', origen: 'Kaushan Script 400', pkg: 'kaushan-script', file: 'kaushan-script-latin-400-normal.woff', ofl: 'kaushanscript' },
  { id: 'brocha', nombre: 'Llavero Brocha', origen: 'Oleo Script Bold 700', pkg: 'oleo-script', file: 'oleo-script-latin-700-normal.woff', ofl: 'oleoscript' },
  { id: 'floreada', nombre: 'Llavero Floreada', origen: 'Sansita Swashed ExtraBold 800', pkg: 'sansita-swashed', file: 'sansita-swashed-latin-800-normal.woff', ofl: 'sansitaswashed' },
  { id: 'cursiva', nombre: 'Llavero Cursiva', origen: 'Courgette 400', pkg: 'courgette', file: 'courgette-latin-400-normal.woff', ofl: 'courgette' },
  { id: 'vintage', nombre: 'Llavero Vintage', origen: 'Grand Hotel 400', pkg: 'grand-hotel', file: 'grand-hotel-latin-400-normal.woff', ofl: 'grandhotel' },
  { id: 'tarde', nombre: 'Llavero Tarde', origen: 'Merienda Bold 700', pkg: 'merienda', file: 'merienda-latin-700-normal.woff', ofl: 'merienda' },
];
const SEG_Q = 6, SEG_C = 8;

function oflUpstream(familia) {
  const url = `https://raw.githubusercontent.com/google/fonts/main/ofl/${familia}/OFL.txt`;
  return execFileSync('curl', ['-fsSL', url], { encoding: 'utf8' });
}
function reservados(ofl) {
  const names = [];
  // solo el encabezado de créditos (antes del cuerpo de la OFL), con saltos de línea aplanados
  const corte = ofl.search(/This Font Software is licensed/i);
  const cabeza = (corte < 0 ? ofl : ofl.slice(0, corte)).replace(/\r\n/g, '\n').replace(/[ \t]*\n[ \t]*/g, ' ');
  const re = /Reserved Font Names?\s+([^\n]+)/gi;
  let m;
  while ((m = re.exec(cabeza))) {
    const tail = m[1].trim();
    const quoted = [...tail.matchAll(/["“«]([^"”»]+)["”»]/g)].map(x => x[1].trim());
    if (quoted.length) names.push(...quoted);
    else {
      const unquoted = tail.replace(/^[, ]+/, '').replace(/\s+and\s+/gi, ', ').replace(/\.$/, '').trim();
      if (unquoted) names.push(unquoted);
    }
  }
  return [...new Set(names.filter(Boolean))];
}
function copyrightOFL(ofl) {
  const lines = [];
  for (const ln of ofl.replace(/\r\n/g, '\n').split('\n')) {
    if (/This Font Software is licensed/i.test(ln)) break;
    if (ln.trim()) lines.push(ln.trim());
  }
  return lines.join(' ');
}

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
  const ofl = oflUpstream(f.ofl);
  const rfn = reservados(ofl);
  const choca = rfn.filter(n => f.nombre.toLowerCase().includes(n.toLowerCase()));
  if (choca.length) throw new Error(`${f.id}: el nombre del subconjunto «${f.nombre}» contiene el nombre reservado ${choca.join(', ')}`);
  const copyright = copyrightOFL(ofl);
  writeFileSync(`src/fuentes-llavero/${f.id}.json`, JSON.stringify({ nombre: f.nombre, origen: f.origen, copyright, licencia: 'SIL Open Font License 1.1; ver licencias/llavero-' + f.id + '-OFL.txt en el sitio', capHeight: Math.max(...glyphs.H.c.flatMap(c => c.filter((_, i) => i % 2))), glyphs, kern }));
  writeFileSync(`public/licencias/llavero-${f.id}-OFL.txt`, `«${f.nombre}» es una versión modificada de ${f.origen}: un subconjunto con las letras A–Z, a–z, Á É Í Ó Ú Ü Ñ y á é í ó ú ü ñ,\nconvertido a contornos para generar los llaveros de «Tu nombre en 3D» de Camino Digital.\n\n` + ofl);
  console.log(f.id, Object.keys(glyphs).length, 'letras', Object.keys(kern).length, 'pares de kerning', 'RFN', JSON.stringify(rfn), copyright.slice(0, 80));
}
