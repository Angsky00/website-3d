import { chromium } from 'playwright';
const errs = [];
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
for (const [name, vp, mob] of [['escritorio', { width: 1440, height: 900 }, false], ['celular', { width: 390, height: 844 }, true]]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob });
  p.on('pageerror', e => { errs.push(e.message); console.log('ERR', e.message); }); p.on('console', m => { if (m.type() === 'error') { errs.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.goto((process.env.QA_URL || 'http://localhost:4173/website-3d/'), { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
  const [s, e] = await p.evaluate(() => [__despiece.start, __despiece.end]);
  for (const [tag, f] of [['1_armado', 0], ['2_medio', 0.36], ['3_abierto', 0.76], ['4_rearmado', 1]]) {
    await p.evaluate(y => __lenis.scrollTo(y, { immediate: true, force: true }), s + (e - s) * f); await p.waitForTimeout(1800);
    await p.screenshot({ path: `capturas/${name}_despiece_${tag}.png` });
    const r = await p.evaluate(() => { const st = document.querySelector('.despiece').getBoundingClientRect(), m = __desp.bounds();
      const M = { l: st.left + m.l, r: st.left + m.r, t: st.top + m.t, b: st.top + m.b };
      const cols = [...document.querySelectorAll('.dcol')].map(c => c.getBoundingClientRect()).filter(c => c.bottom > 0 && c.top < innerHeight);
      const sol = cols.filter(c => c.left < M.r && M.l < c.right && c.top < M.b && M.t < c.bottom).length;
      const op = [...document.querySelectorAll('.dcol .ri')].map(e => +getComputedStyle(e).opacity);
      return { solapeTextoModelo: sol, legibles: op.filter(o => o > 0.99).length + '/' + op.length, fuera: M.l < -2 || M.r > innerWidth + 2 }; });
    const bad = r.solapeTextoModelo > 0 || r.fuera || (tag === '3_abierto' && r.legibles.split('/')[0] !== r.legibles.split('/')[1]);
    if (bad) errs.push(`${name} ${tag} layout`); console.log(name, tag, r, bad ? 'FALLA' : 'OK');
  }
  await p.close();
}
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, reducedMotion: 'reduce' });
p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto((process.env.QA_URL || 'http://localhost:4173/website-3d/'), { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
await p.evaluate(() => document.querySelector('.despiece').scrollIntoView()); await p.waitForTimeout(1500);
await p.screenshot({ path: 'capturas/celular_reduced_despiece.png' });
await b.close();
console.log(errs.length ? `CONSOLA: ${errs.length} errores FALLA` : 'consola sin errores OK'); if (errs.length) process.exit(1);
