import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
for (const [w, h, mob] of [[360, 780, true], [390, 844, true], [1280, 800, false]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mob, hasTouch: mob });
  p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type()==='error') console.log('CONSOLE', m.text()); });
  await p.goto((process.env.QA_URL || 'http://localhost:4173/website-3d/'), { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
  await p.screenshot({ path: `capturas/loop_${w}_0_scroll0.png` });
  const ca = await p.evaluate(() => document.querySelector('.hero-clone').getBoundingClientRect().top + scrollY);
  await p.evaluate(() => { window.__noLoop = true; });
  await p.evaluate(y => __lenis.scrollTo(y - innerHeight, { immediate: true, force: true }), ca); await p.waitForTimeout(800);
  // bajar suave hasta que el clon llena la pantalla
  for (let i = 0; i <= 10; i++) { await p.evaluate(([y, i]) => __lenis.scrollTo(y - innerHeight * (1 - i / 10), { immediate: true, force: true }), [ca, i]); await p.waitForTimeout(120); }
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `capturas/loop_${w}_1_antes.png` });
  const maxY = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await p.evaluate(() => { window.__noLoop = false; }); await p.waitForTimeout(250);
  await p.screenshot({ path: `capturas/loop_${w}_2_despues.png` });
  console.log(w, 'clon', Math.round(ca), 'maxScroll', maxY, 'scrollY tras salto', await p.evaluate(() => Math.round(scrollY)), 'capa', await p.evaluate(() => document.querySelector('#capa').textContent));
  await p.close();
}
await b.close();
