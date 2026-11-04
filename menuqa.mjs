import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
for (const [w, h, mob] of [[1440, 900, false], [390, 844, true]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
  for (const id of ['impresion', 'personalizado', 'carpinteria', 'artesanias', 'nosotros', 'contacto']) {
    await p.evaluate(() => __lenis.scrollTo(0, { immediate: true, force: true })); await p.waitForFunction(() => scrollY < 1 && !__lenis.isScrolling, null, { timeout: 10000 }); await p.waitForTimeout(400);
    // en celular el menú está oculto: se dispara el mismo enlace por código
    await p.evaluate(id => document.querySelector(`.nav a[href="#${id}"]`).click(), id); await p.waitForTimeout(1500); await p.waitForFunction(() => !__lenis.isScrolling, null, { timeout: 15000 }); await p.waitForTimeout(600);
    const r = await p.evaluate(id => ({ y: Math.round(scrollY), lenis: Math.round(__lenis.scroll), target: Math.round(__lenis.targetScroll), pinEnd: Math.round(__pins[id].end), limit: Math.round(__lenis.limit) }), id);
    console.log(w, id, JSON.stringify(r), r.y === r.pinEnd ? 'OK' : 'FALLA');
  }
  await p.close();
}
await b.close();
