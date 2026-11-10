// Genera src/fuente-nombre.json (formato typeface de Three.js) con solo las letras permitidas
// a partir de IBM Plex Sans Bold (SIL OFL 1.1, © 2017 IBM Corp., nombre reservado «Plex»: el subconjunto se llama «Nombre 3D»). Uso: node tools/fuente-nombre.mjs
import opentype from 'opentype.js';
import { readFileSync, writeFileSync } from 'fs';
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÉÍÓÚÜÑáéíóúüñ';
const buf = readFileSync('node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff');
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const scale = 1000 / font.unitsPerEm, r = v => Math.round(v * scale);
const glyphs = {};
for (const ch of LETRAS) {
  const g = font.charToGlyph(ch);
  if (!g || g.index === 0) throw new Error('falta la letra ' + ch);
  const o = g.path.commands.map(c => {
    if (c.type === 'M') return `m ${r(c.x)} ${r(c.y)}`;
    if (c.type === 'L') return `l ${r(c.x)} ${r(c.y)}`;
    if (c.type === 'Q') return `q ${r(c.x)} ${r(c.y)} ${r(c.x1)} ${r(c.y1)}`;
    if (c.type === 'C') return `b ${r(c.x)} ${r(c.y)} ${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)}`;
    return '';
  }).filter(Boolean).join(' ');
  const bb = g.getBoundingBox();
  glyphs[ch] = { ha: r(g.advanceWidth), x_min: r(bb.x1), x_max: r(bb.x2), o };
}
const out = {
  glyphs, familyName: 'Nombre 3D', ascender: r(font.ascender), descender: r(font.descender),
  underlinePosition: -100, underlineThickness: 50, resolution: 1000, original_font_information: { license: 'SIL Open Font License 1.1', copyright: 'Copyright © 2017 IBM Corp. with Reserved Font Name "Plex"', modificada: 'subconjunto renombrado «Nombre 3D»; ver licencias/fuente-nombre-OFL.txt en el sitio' },
  boundingBox: { yMin: r(font.tables.head.yMin), xMin: r(font.tables.head.xMin), yMax: r(font.tables.head.yMax), xMax: r(font.tables.head.xMax) },
  cssFontWeight: 'bold', cssFontStyle: 'normal',
};
writeFileSync('src/fuente-nombre.json', JSON.stringify(out));
console.log('letras', Object.keys(glyphs).length, 'bytes', JSON.stringify(out).length);
