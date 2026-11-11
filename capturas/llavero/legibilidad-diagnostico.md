# Legibilidad del llavero por fuente y modelo

Nombres: «Angel», «Maximiliano», «Begoña». Antes = main `cfc5f36`; después = rama `fix/legibilidad-fuentes`. Medido sobre la huella 2D real del STL (relieve de las letras) con `tools/legibilidad.mjs`.

- **Engrosado**: el mayor que aplicó `reforzar` en los 3 nombres (mm por lado).
- **Panza mín.**: el ancho inscrito más chico de los contrapunzones del glifo original (e, a, o, g, d, p, A, B…) ya en el relieve; 0 = se cerró. Se exige ≥ 1 mm. Entre paréntesis, las letras que quedaban cerradas o de menos de 1 mm.
- **Hueco mín.**: la separación más chica entre dos letras seguidas que no van unidas en la fuente; se exige ≥ 0.6 mm. Entre paréntesis, los pares fundidos o pegados. En Cuadritos cada letra va en su cuadro y no aplica.
- **Mayúscula**: alto de mayúscula final en mm por nombre (A = Angel, M = Maximiliano, B = Begoña); «no cabe» = el nombre no entra en 150 mm con letras legibles y la página lo avisa.

| Fuente | Modelo | Engrosado antes → después | Panza mín. antes → después (mm) | Hueco mín. antes → después (mm) | Mayúscula después (mm) |
|---|---|---|---|---|---|
| Pacifico | Solo letras | 0.3 → 0.1 | 0.00 (g e l a) → **1.15** | 0.59 (Be) → **0.98** | A 15, M 15, B 15 |
| Pacifico | Con fondo | 0.3 → 0.1 | 0.00 (g e l a) → **1.15** | 0.59 (Be) → **0.98** | A 15, M 15, B 15 |
| Pacifico | Huesito | 0.3 → 0.1 | 0.00 (g e l a) → **1.15** | 0.59 (Be) → **0.98** | A 15, M 15, B 15 |
| Pacifico | Cuadritos | 0.3 → 0.1 | 0.00 (g e l) → **1.11** | — → **—** | A 15.4, B 15.4; no cabe: Maximiliano |
| Lobster | Solo letras | 0.5 → 0.5 | 0.00 (A g e) → **1.09** | 0.04 (Ma Be) → **0.91** | A 15, M 15, B 15 |
| Lobster | Con fondo | 0.5 → 0.5 | 0.00 (A g e) → **1.09** | 0.04 (Ma Be) → **0.91** | A 15, M 15, B 15 |
| Lobster | Huesito | 0.5 → 0.5 | 0.00 (A g e) → **1.09** | 0.04 (Ma Be) → **0.91** | A 15, M 15, B 15 |
| Lobster | Cuadritos | 0.3 → 0.3 | 0.00 (A g e) → **1.09** | — → **—** | A 15.4, B 15.4; no cabe: Maximiliano |
| Lobster Two | Solo letras | 0.5 → 0.5 | 0.00 (g e) → **1.09** | 0.23 (Be) → **0.91** | A 15, M 15, B 15 |
| Lobster Two | Con fondo | 0.5 → 0.5 | 0.00 (g e) → **1.09** | 0.23 (Be) → **0.91** | A 15, M 15, B 15 |
| Lobster Two | Huesito | 0.5 → 0.5 | 0.00 (g e) → **1.09** | 0.23 (Be) → **0.91** | A 15, M 15, B 15 |
| Lobster Two | Cuadritos | 0.3 → 0.3 | 0.00 (A g e) → **1.09** | — → **—** | A 15.4, B 15.4; no cabe: Maximiliano |
| Leckerli One | Solo letras | 0.3 → 0.1 | 0.00 (g e l o) → **1.08** | 0.62 → **1.63** | A 15, B 19.3; no cabe: Maximiliano |
| Leckerli One | Con fondo | 0.3 → 0.1 | 0.00 (g e l o) → **1.08** | 0.62 → **1.63** | A 15, B 19.3; no cabe: Maximiliano |
| Leckerli One | Huesito | 0.3 → 0.1 | 0.00 (g e l o) → **1.08** | 0.62 → **1.63** | A 15, B 19.3; no cabe: Maximiliano |
| Leckerli One | Cuadritos | 0.3 → 0.1 | 0.00 (g e l o) → **1.08** | — → **—** | A 15.4, B 16.6; no cabe: Maximiliano |
| Kaushan Script | Solo letras | 0.4 → 0.4 | 0.00 (e) → **1.10** | 0.56 (eg) → **0.81** | A 15, M 15, B 15 |
| Kaushan Script | Con fondo | 0.4 → 0.4 | 0.00 (e) → **1.10** | 0.56 (eg) → **0.81** | A 15, M 15, B 15 |
| Kaushan Script | Huesito | 0.4 → 0.4 | 0.00 (e) → **1.10** | 0.56 (eg) → **0.81** | A 15, M 15, B 15 |
| Kaushan Script | Cuadritos | 0.3 → 0.3 | 0.00 (e) → **1.10** | — → **—** | A 15.4, B 15.4; no cabe: Maximiliano |
| Oleo Script | Solo letras | 0.3 → 0.1 | 0.00 (g e a B) → **1.09** | 0.01 (An ng ge el xi im mi il li ia an no Be eg go ña) → **0.91** | A 15, M 15, B 15 |
| Oleo Script | Con fondo | 0.3 → 0.1 | 0.00 (g e a B) → **1.09** | 0.01 (An ng ge el xi im mi il li ia an no Be eg go ña) → **0.91** | A 15, M 15, B 15 |
| Oleo Script | Huesito | 0.3 → 0.1 | 0.00 (g e a B) → **1.09** | 0.01 (An ng ge el xi im mi il li ia an no Be eg go ña) → **0.91** | A 15, M 15, B 15 |
| Oleo Script | Cuadritos | 0.3 → 0.1 | 0.00 (g e B a) → **1.09** | — → **—** | A 15.4, B 15.4; no cabe: Maximiliano |
| Sansita Swashed | Solo letras | 0.3 → 0.2 | 0.00 (A) → **1.59** | 0.09 (An ax Be eg) → **0.81** | A 15, M 15, B 15 |
| Sansita Swashed | Con fondo | 0.3 → 0.2 | 0.00 (A) → **1.59** | 0.09 (An ax Be eg) → **0.81** | A 15, M 15, B 15 |
| Sansita Swashed | Huesito | 0.3 → 0.2 | 0.00 (A) → **1.59** | 0.09 (An ax Be eg) → **0.81** | A 15, M 14.3, B 15 |
| Sansita Swashed | Cuadritos | 0.3 → 0.1 | 0.00 (A) → **1.36** | — → **—** | A 15.4, B 15.4; no cabe: Maximiliano |
| Courgette | Solo letras | 0.3 → 0.2 | 1.62 → **2.03** | 0.25 (An ax an) → **0.96** | A 15, M 15, B 15 |
| Courgette | Con fondo | 0.3 → 0.2 | 1.62 → **2.03** | 0.25 (An ax an) → **0.96** | A 15, M 15, B 15 |
| Courgette | Huesito | 0.3 → 0.2 | 1.62 → **2.03** | 0.25 (An ax an) → **0.96** | A 15, M 15, B 15 |
| Courgette | Cuadritos | 0.3 → 0.1 | 1.62 → **2.03** | — → **—** | A 15.4, B 15.4; no cabe: Maximiliano |
| Grand Hotel | Solo letras | 0.3 → 0.1 | 0.00 (g e l o) → **1.07** | 0.54 (Ma) → **1.45** | A 19.6, M 21.2, B 21.2 |
| Grand Hotel | Con fondo | 0.3 → 0.1 | 0.00 (g e l o) → **1.07** | 0.54 (Ma) → **1.45** | A 19.6, M 21.2, B 21.2 |
| Grand Hotel | Huesito | 0.3 → 0.1 | 0.00 (g e l o) → **1.07** | 0.54 (Ma) → **1.45** | A 19.6, M 21.2, B 21.2 |
| Grand Hotel | Cuadritos | 0.3 → 0.1 | 0.00 (g e l o) → **1.07** | — → **—** | A 18.7, B 16.6; no cabe: Maximiliano |
| Merienda | Solo letras | 0.3 → 0.3 | 2.02 → **2.23** | 1.22 → **1.47** | A 15, M 15, B 15 |
| Merienda | Con fondo | 0.3 → 0.3 | 2.02 → **2.23** | 1.22 → **1.47** | A 15, M 15, B 15 |
| Merienda | Huesito | 0.3 → 0.3 | 2.02 → **2.23** | 1.22 → **1.47** | A 15, M 15, B 15 |
| Merienda | Cuadritos | 0.3 → 0.2 | 2.02 → **2.23** | — → **—** | A 15.4, B 15.4; no cabe: Maximiliano |

Llaveros ilegibles (alguna panza < 1 mm o letras fundidas): **antes 87 de 110**, **después 0 de 107**.

## Por qué se perdía la lectura (main `cfc5f36`)

1. **El cierre de 0.8 mm de `reforzar` rellenaba las panzas.** Después del engrosado de 0.3 mm por lado, el cierre (+0.8/−0.8) tapa cualquier hueco de menos de 1.6 mm: en la fuente original eso es toda panza de menos de ~2.2 mm. A 15 mm de mayúscula caían la e, g, a, l, p, d de casi todas; en los nombres que se achican para caber (Maximiliano) caían más. Coincide con la línea base de QA de Esmeraldukis (`/workspace/qa3d/v22`): 507 de 1066 panzas rellenas; peor Oleo Script, Pacifico, Grand Hotel y Leckerli One; Courgette y Merienda sin panzas cerradas.
2. **Engrosado parejo de 0.3 mm (hasta 0.5 en Lobster/Lobster Two y 0.4 en Kaushan)** en fuentes que ya tienen trazos de más de 1.2 mm (Pacifico, Oleo, Leckerli, Sansita): solo engordaba la letra y achicaba los huecos.
3. **Letras sueltas casi pegadas.** Con 0.3 mm por lado, pares que en la fuente están separados quedaban a 0.04–0.6 mm (Be, An, eg, ña en Lobster, Oleo Script, Sansita, Courgette y Kaushan): en la impresión se leen como una mancha.
4. **Cuadritos.** Las letras anchas (P con floritura de Sansita) tocaban el marco; con menos engrosado eso dejaba un cuello fino.
5. **Fuentes con panzas diminutas por diseño.** Aun sin engrosar, a 15 mm de mayúscula Grand Hotel tiene la o de 0.78 mm y el ojo de la l de 0.84 mm; Leckerli One, la o de 0.86 mm y la w de 0.74 mm; Lobster Two, la cola de la Q de 0.63 mm. No se pueden dejar en ≥ 1 mm sin agrandar las letras.

## Qué cambió (rama `fix/legibilidad-fuentes`)

- **Panzas protegidas** (`src/nombre3d.js`, `reforzar`): cada contrapunzón del glifo original se protege; el engrosado y el cierre pueden achicarlo, pero no por debajo de 1.1 mm (los que ya miden menos se quedan como están). El cierre de 0.8 mm se sigue haciendo, pero ya no tapa los contrapunzones, y las cápsulas de `sinCuellos` (r 0.62) no los cruzan. El engrosado adaptativo además sube si la apertura de 0.6 mm rompiera la pared de una panza (una «a» no puede volverse «c»). Trazo mínimo de 1.2 mm intacto (`abrir` 0.6, cápsulas 0.62).
- **Engrosado por fuente** (`src/estilos-llavero.js`, `ajustes.engrosar`): 0.1 mm en Pacifico, Leckerli One, Oleo Script, Sansita Swashed, Courgette, Grand Hotel y Merienda; 0.3 mm en Lobster, Lobster Two y Kaushan Script (trazos finos). Sigue subiendo de 0.1 en 0.1 solo en las piezas que lo necesitan.
- **Espaciado** (`ajustes.separacion`, por defecto 0.9 + 2 × engrosar mm): entre dos letras seguidas que no se tocan en la fuente se abre lo justo para que queden ≥ 0.6 mm visibles; las uniones de las script no se mueven.
- **Alto mínimo por legibilidad**: cada nombre se agranda lo necesario para que el contrapunzón más chico de sus letras mida ≥ 1.1 mm (p. ej. «Angel» en Grand Hotel pasa de 15 a 19.6 mm). Sigue la regla de 150 mm: si no cabe, la página lo avisa y bloquea la descarga; si no cabe en ningún modelo con ese estilo, el aviso sugiere otro estilo. En Cuadritos el cuadro crece si una letra lo pide, y las letras anchas ya no tocan el marco. El Huesito no pasa de 54 mm de alto.

## Prueba en stlqa

`stlqa.mjs` mide cada llavero contra la fuente original sin engrosar: cada contrapunzón del glifo (≥ 0.3 mm² y ≥ 0.25 mm de ancho en la fuente) debe seguir siendo un hueco del relieve con ancho inscrito ≥ 1 mm (si desaparece cuenta 0 y falla), y cada par de letras seguidas que no se tocan en la fuente debe quedar en piezas distintas del relieve con ≥ 0.6 mm entre ellas. Se agregaron Maximiliano, Begoña, Gabriela, Diego, Pepe, Bob y Quique a los casos difíciles.

Corrida la misma prueba sobre la geometría de main `cfc5f36`: **2231 fallas** (todas de legibilidad). Sobre la rama: **0 fallas**.

## No caben más nombres

En 30 nombres × 10 fuentes × 4 modelos, 15 combinaciones que antes cabían ahora no caben (y salen con aviso): Grand Hotel en Cuadritos (Alejandra, Calkiní, Leonardo, Rodrigo, Santiago, Valentina) y en Huesito (Guadalupeñaz); Leckerli One con Maximiliano en Solo letras, Con fondo y Huesito, y Rodrigo en Cuadritos; Pacifico en Cuadritos (Fernanda, Leonardo); Lobster y Lobster Two en Cuadritos (Quique).
