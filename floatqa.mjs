// QA: ningún objeto flotante tapa los textos del despiece (.dcol li/h2/…) durante el pin, a 360, 390, 1280 y 1920
import { chromium } from 'playwright';
const url = process.env.QA_URL || 'http://localhost:4173/website-3d/';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const readHits = p => p.evaluate(() => { const items = [...document.querySelectorAll('.dcol .ri, .dcol h2, .dcol li')].map(el => [el, el.getBoundingClientRect()]).filter(([el, r]) => r.width && r.bottom > 0 && r.top < innerHeight && +getComputedStyle(el).opacity > 0.1);
      const fl = __floaters.debugRects(); const out = [];
      for (const c of fl) for (const [el, r] of items) {
        const b = c.bounds || { left: c.x - c.rad, right: c.x + c.rad, top: c.y - c.rad, bottom: c.y + c.rad };
        if (b.right > r.left && b.left < r.right && b.bottom > r.top && b.top < r.bottom) out.push([el.textContent.slice(0, 20), c]);
      }
      return out; });

let fails = 0;
for (const [w, h, mob] of [[360, 640, true], [390, 844, true], [1280, 800, false], [1920, 1080, false]].filter(([w]) => !process.env.QA_WIDTH || w === +process.env.QA_WIDTH)) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob });
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
  const [s, e] = await p.evaluate(() => [__despiece.start, __despiece.end]);
  // recorre antes, durante y justo después del pin (incluye el final, donde QA lo vio)
  for (let k = -2; k <= 12; k++) {
    const y = s + (e - s) * k / 10; await p.evaluate(y => __lenis.scrollTo(y, { immediate: true, force: true }), y); // medir tanto durante la transición como una vez asentada
    for (const delay of [100, 1400]) {
      await p.waitForTimeout(delay);
      const hits = await readHits(p);
      if (hits.length) { fails++; console.log(w, 'paso', k, 'tras', delay, 'ms FALLA', JSON.stringify(hits)); }
    }
  }
  if (errors.length) { fails++; console.log(w, 'consola FALLA', errors); }
  console.log(w, 'revisado'); await p.close();
}
await b.close(); console.log(fails ? `flotantes sobre texto: ${fails} FALLA` : 'flotantes sin tapar texto OK'); if (fails) process.exit(1);
