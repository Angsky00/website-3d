// Worker de stlqa: carga manifold una vez y arma un llavero por mensaje. El hilo principal lo puede matar si se pasa del tope.
import { parentPort } from 'node:worker_threads';
import { createServer } from 'vite';
import { readFileSync, readdirSync } from 'node:fs';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const m = await vite.ssrLoadModule('/src/nombre3d.js');
const w = await m.cargarManifold();
const FUENTES = readdirSync('src/fuentes-llavero').map(f => f.replace('.json', '')).sort();
const fuentes = Object.fromEntries(FUENTES.map(id => [id, JSON.parse(readFileSync(`src/fuentes-llavero/${id}.json`, 'utf8'))]));
parentPort.postMessage({ t: 'listo' });

parentPort.on('message', msg => {
  const { fid, nombre, modelo, verbose, lento } = msg;
  try {
    const t0 = Date.now();
    const mod = m.construirLlavero(w, fuentes[fid], nombre, modelo);
    const ms = Date.now() - t0;
    if (lento && ms > +lento) console.log('LENTO', modelo, fid, nombre, ms, 'ms');
    if (!mod.cabe) {
      parentPort.postMessage({ t: 'res', cabe: false, modelo: mod.modelo, medidas: mod.medidas, ms });
      return;
    }
    const dv = m.exportarSTL(mod);
    const stl = Uint8Array.from(new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength));
    parentPort.postMessage({
      t: 'res', cabe: true, modelo: mod.modelo, mayuscula: mod.mayuscula, medidas: mod.medidas,
      cuerpos: mod.cuerpos, resistencia: mod.resistencia, estado: mod.estado, genero: mod.genero,
      volumen: mod.volumen, engrosado: mod.engrosado, perdida: mod.perdida, stl: stl.buffer, ms,
      contadores: mod.contadores, generoEsperado: mod.generoEsperado, altoLetraMin: mod.altoLetraMin,
      componentes: mod.componentes, componentesGlifo: mod.componentesGlifo, separacionAcentos: mod.separacionAcentos,
    }, [stl.buffer]);
  } catch (e) {
    parentPort.postMessage({ t: 'res', error: String(e && e.stack || e) });
  }
});
