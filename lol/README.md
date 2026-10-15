# RuneSurvivor · prototipo (PokéSurvivor con campeones de LoL)

El mismo juego que PokéSurvivor (bullet heaven + roguelike + gacha), pero con
campeones, monstruos y lugares de League of Legends. Esta carpeta **no cambia
nada del juego original**: `lol/tools/build.py` lee `dev.html` y `js/` tal
cual, les aplica unos parches y monta una web aparte en `lol/dist/`.

```
python lol/tools/build.py             # monta lol/dist/ (≈5 s, necesita Pillow)
python lol/tools/build.py --preview   # y lol/dist/preview.png con todos los sprites
python -m http.server -d lol/dist     # jugar en http://localhost:8000
```

## Decisiones del dueño (15-10-2026)

| Tema | Decisión |
|---|---|
| Combate | Igual que PokéSurvivor: **un ataque activo** que se cambia con 1-4 / Q / E. Mismo balance. |
| Sprites | Sprites pixel art con el formato de Mundo Misterioso, **hechos sobre los Pokémon que ya tenemos** (repintados y luego retocados, a mano o con ayuda de IA gratuita). |
| Campeones | **Poco a poco** hasta tenerlos todos. |
| Gacha | Se mantiene (tickets ganados jugando, sin dinero). |

## Sistema de League of Legends (desde el 15-10-2026, 2.ª versión)

Petición del dueño: kit propio de cada campeón que se desbloquea por nivel, subir
de nivel más difícil, mejoras que sean de tus habilidades, pasiva y objetos de tu
campeón, evoluciones que añadan cosas nuevas, estadísticas de LoL y enemigos de LoL.

| Parte | Cómo funciona | Dónde |
|---|---|---|
| **Estadísticas** | DA, PH, armadura, RM, vel. de ataque, celeridad, crítico, robo de vida, omnivampirismo, penetraciones, velocidad, regeneración; crecen por nivel como en LoL (vida y DA de LoL entre ~6) | `js/lol-stats.js` |
| **Daño** | físico (contra armadura), mágico (contra RM) o verdadero; `100/(100+resistencia)`. Los enemigos también tienen armadura y RM (cada monstruo la suya, sube con el reloj) y te pegan físico o mágico | `js/lol-stats.js`, `tools/roster.py` (RESIST) |
| **Kit** | ataque básico siempre (cuerpo a cuerpo o a distancia, con la vel. de ataque) + una habilidad activa (Q/W/E, se cambia con 1-3) + la R, que se lanza sola al recargarse | `js/engine/combat.js` |
| **Desbloqueo** | Q al empezar, W al nivel 3, E al 6 y R al 10. Rangos: Q/W/E hasta 5 (el rango r pide nivel 2r−1), R hasta 3 (niveles 10/14/18) | `js/lol-kits.js` (G.Kit) |
| **Subir de nivel** | cuesta un 15 % más por nivel que en PokéSurvivor (el nivel 10, ×2,35) | `js/engine/player.js` |
| **Cartas** | subir de rango una habilidad, mejorar la pasiva (3 niveles), objeto de tu campeón (uno cada 3 niveles; hasta 6), evolución, fragmentos de runa o poción | `js/engine/levelup.js` |
| **Objetos** | 40 de LoL con sus estadísticas y su efecto único (Filo del Infinito, Fuerza de Trinidad, Rabadon, Zhonya, Warmog...); sólo salen los que van con tu campeón (etiquetas) | `js/lol-items.js` |
| **Evoluciones** | habilidad a rango máximo + un objeto concreto → carta dorada con mecánica nueva (la E de Garen se hace un 50 % más grande y rompe armadura...) | `evo` en `js/lol-kits.js` |
| **Enemigos** | súbditos, monstruos de la jungla, criaturas del Vacío, dragones, Heraldo y Barón, y **campeones enemigos** (desde el minuto 3:30, cada 80-110 s; sueltan objeto) | `tools/roster.py`, `js/lol-elites.js` |

Cada habilidad usa una de las 15 formas de atacar del motor como base
(proyectil, cuerpo a cuerpo, rayo, órbita, nova, aura, bumerán, cadena, minas,
meteoros, torreta, embestida, rastro, cono, mejora) con sus números y
mecánicas añadidas: aturdir, atraer, ejecutar, curarse con el daño, romper
armadura, más daño a aislados o ralentizados, críticos, lanzamientos
repetidos, cada 3.er lanzamiento distinto, estallidos, golpe al aterrizar,
escudos, invulnerabilidad, recarga al matar y crecer (Cho'Gath).

### Pruebas

```
node lol/tools/bench.js http://localhost:8000/ <campeón> [nivel] [objetos]   # daño de cada habilidad, normal y evolucionada
TAKEN=0.3 node lol/tools/sim.js http://localhost:8000/ <campeón> [minutos]  # partida entera con un bot
```

`bench.js` pone muñecos fijos alrededor y mide cada habilidad por separado (y
saca capturas). `sim.js` juega una partida acelerada (tiempo virtual, sin
dibujar) con un bot; el bot esquiva peor que una persona, por eso `TAKEN` baja
el daño que recibe (usar el mismo valor para comparar).

## Cómo está hecho (1.ª versión)

| PokéSurvivor | RuneSurvivor | Dónde |
|---|---|---|
| 966 Pokémon | 21 campeones (5 legendarios); `id` = número de Riot (`key` de Data Dragon) | `tools/roster.py` |
| Stats del Pokémon | Los **hereda del Pokémon base** de su sprite: mismo balance | `build.py` → `lol-data.js` |
| Pokémon salvajes | `G.MONSTERS`: súbditos, Krugs, raptores, lobos, Gromp, criaturas del Vacío... con su forma de pelear fija (`beh`) | `tools/roster.py` |
| 5 jefes | Heraldo, dragones infernal/montaña/nubes, Barón Nashor, Dragón ancestral | `tools/roster.py` |
| Legendarios de la grieta | Aurelion Sol, Anivia, Volibear, Mordekaiser, Bel'Veth | `tools/roster.py` |
| Sentencia de Arceus | La Carga de la Ruina (Hecarim, número 493) | textos en `js/lol-skin.js` |
| 18 tipos | 18 **elementos** (Infernal, Océano, Hextech, Vacío, Niebla Negra...), la misma tabla | `js/lol-game.js` |
| 64 movimientos | Los mismos con nombre de habilidad de LoL (Juicio, Orbe del Engaño, Chispa Final...) | `js/lol-game.js` |
| Objetos | Warmog, Filo Infinito, Zhonya, Sanguinaria, Malla de Espinas... | `js/lol-game.js` |
| 9 regiones | 4 banners (en el prototipo, uno de cada rareza por banner) | `tools/roster.py` |
| Shiny | Aspecto de **Prestigio** (de momento, el mismo sprite con otro tono) | `build.py` |
| Pokémonedas | Esencia Azul | `js/lol-skin.js` |
| Bufos de altares, climas, zonas, arenas | Bufo rojo/azul, almas de dragón, Jungla de la Grieta, Islas de la Sombra... | `PATCHES` en `build.py` |

- **Textos.** `js/lol-skin.js` cambia lo que se ve en pantalla (Pokémon → campeón,
  shiny → Prestigio...) en español y en inglés, sin tocar cada pantalla. Para eso
  el parche de `js/core/i18n.js` pasa también el español por el traductor.
- **Parches.** `PATCHES` en `build.py` son cambios de texto exacto en el motor. Si
  PokéSurvivor cambia y uno ya no encaja, el build se para y dice cuál.
- **Sin nube.** El prototipo funciona en modo local (guardado en el navegador):
  sin Firebase, sin cooperativo en línea, sin ranking, sin donaciones.

## Sprites: cómo se hace cada campeón

1. **Elegir base.** Un Pokémon de `assets/pokemon/` con silueta parecida
   (Garen ← Gallade, Ahri ← Delphox, Yasuo ← Zoroark, Aurelion Sol ← Rayquaza...).
2. **Repintar** (automático): en `roster.py`, `rules=[(color de la base, color del campeón)]`.
   Las hojas son PNG con paleta, así que cambian todos los fotogramas y las 8 direcciones
   a la vez sin perder nada (`tools/recolor.py`). Con `--preview` se revisa el resultado.
3. **Retocar** (a mano, poco a poco): abrir `lol/dist/assets/pokemon/{id}/*.png` en un
   editor gratuito (LibreSprite, Pixelorama, Piskel) y dibujar encima lo que lo hace
   reconocible (capa, pelo, arma). Las hojas tienen la cuadrícula de Mundo Misterioso:
   columnas = fotogramas, filas = 8 direcciones. Las IA de imágenes gratuitas sirven
   para sacar la idea o el retrato, pero no mantienen la misma figura en todos los
   fotogramas y direcciones, así que el retoque final es a mano.
   *(Pendiente: que el build use una hoja retocada si existe en `lol/assets/` en vez de repintar.)*
4. Licencia: las hojas de SpriteCollab son **CC BY-NC 4.0**: se pueden modificar, sin
   uso comercial y citando a sus artistas (como ya hace `CREDITS.md`).

## Lo que falta (por fases)

1. **Ahora · prototipo jugable** ✔ 21 campeones repintados, enemigos, jefes, grietas, final del minuto 30, gacha, colección, misiones.
2. **Sprites retocados** de los 21 (usar `lol/assets/{id}/` si existe) y aspectos de Prestigio propios.
3. **Más campeones** por tandas de ~10 hasta los ~170, con 4 banners → una por región (Demacia, Noxus, Jonia, Freljord, Piltover, Zaun, Shurima, Targon, Islas de la Sombra, Ixtal, Aguasturbias, Bandle, el Vacío) en cuanto cada una tenga un campeón de cada rareza.
4. **Interfaz Hextech**: iconos propios en vez de Poké Balls (tragaperras, rarezas, menú), logo y colores.
5. **Repositorio y web propios**: Firebase nuevo (plan gratuito, sin Identity Platform), Worker de Cloudflare nuevo, dominio y nombre definitivos; activar nube, cooperativo y ranking.
6. **Legal**: revisar la política "Legal Jibber Jabber" de Riot antes de publicar en abierto (juego gratis, aviso de Riot ya incluido en Aviso legal, nada de cobrar ni donaciones mientras no esté claro).
