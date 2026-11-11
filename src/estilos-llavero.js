// Estilos de letra del llavero, en el orden del selector (Pacifico primero y seleccionada).
// id: archivo src/fuentes-llavero/<id>.json (subconjunto renombrado que genera el STL).
// familia/peso: la fuente web original sin modificar, solo para mostrar el nombre en el selector.
// ajustes de legibilidad (los usa nombre3d.js al armar el STL; mm):
//   engrosar: con cuánto empieza el engrosado adaptativo (sube de 0.1 en 0.1 solo en las piezas que lo necesitan para que
//     ningún trazo quede de menos de 1.2 mm). Las fuentes de trazo grueso empiezan en 0.1 para no tapar el diseño.
//   separacion: hueco mínimo, en la fuente sin engrosar, entre dos letras seguidas que no van unidas por diseño
//     (el relieve final debe dejar ≥ 0.6 mm visibles). Por defecto 0.9 + 2 × engrosar.
// El alto mínimo no es fijo por fuente: cada nombre se agranda lo necesario para que el contrapunzón más chico de sus
// letras mida ≥ 1.1 mm (Grand Hotel y Leckerli One tienen panzas diminutas: piden más alto y algunos nombres ya no caben).
export const ESTILOS = [
  { id: 'script', familia: 'Pacifico', peso: 400, slug: 'pacifico', ajustes: { engrosar: 0.1 } },
  { id: 'retro', familia: 'Lobster', peso: 400, slug: 'lobster', ajustes: { engrosar: 0.3 } },
  { id: 'moderna', familia: 'Lobster Two', peso: 700, slug: 'lobster-two', ajustes: { engrosar: 0.3 } },
  { id: 'dulce', familia: 'Leckerli One', peso: 400, slug: 'leckerli-one', ajustes: { engrosar: 0.1 } },
  { id: 'pincel', familia: 'Kaushan Script', peso: 400, slug: 'kaushan-script', ajustes: { engrosar: 0.3 } },
  { id: 'brocha', familia: 'Oleo Script', peso: 700, slug: 'oleo-script', ajustes: { engrosar: 0.1 } },
  { id: 'floreada', familia: 'Sansita Swashed', peso: 800, slug: 'sansita-swashed', ajustes: { engrosar: 0.1 } },
  { id: 'cursiva', familia: 'Courgette', peso: 400, slug: 'courgette', ajustes: { engrosar: 0.1 } },
  { id: 'vintage', familia: 'Grand Hotel', peso: 400, slug: 'grand-hotel', ajustes: { engrosar: 0.1 } },
  { id: 'tarde', familia: 'Merienda', peso: 700, slug: 'merienda', ajustes: { engrosar: 0.1 } },
];
