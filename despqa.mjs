import { chromium } from 'playwright';
const errs = [];
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
for (const [name, vp, mob] of [['escritorio', { width: 1440, height: 900 }, false], ['celular', { width: 390, height: 844 }, true]]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob });
  p.on('pageerror', e => { errs.push(e.message); console.log('ERR', e.message); }); p.on('console', m => { if (m.type() === 'error') { errs.push(m.text()); console.log('CONSOLE', m.text()); } });
  await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
  const [s, e] = await p.evaluate(() => [__despiece.start, __despiece.end]);
  for (const [tag, f] of [['1_armado', 0], ['2_medio', 0.36], ['3_abierto', 0.76], ['4_rearmado', 1]]) {
    await p.evaluate(y => __lenis.scrollTo(y, { immediate: true, force: true }), s + (e - s) * f); await p.waitForTimeout(1800);
    await p.screenshot({ path: `capturas/${name}_despiece_${tag}.png` });
    console.log(name, tag, 'ok');
  }
  await p.close();
}
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, reducedMotion: 'reduce' });
p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
await p.evaluate(() => document.querySelector('.despiece').scrollIntoView()); await p.waitForTimeout(1500);
await p.screenshot({ path: 'capturas/celular_reduced_despiece.png' });
await b.close();
console.log(errs.length ? `CONSOLA: ${errs.length} errores FALLA` : 'consola sin errores OK'); if (errs.length) process.exit(1);
