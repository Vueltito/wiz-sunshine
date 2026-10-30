# Wiz Sunshine

Sitio de **Wiz Sunshine**, el estudio de software de **Sol Soletti y Lucio Rojas**: sistemas de gestión, tiendas online e integraciones a medida. Diseño acreditado a **VT Security**.

**Sitio:** <https://vueltito.legios.com.ar/wiz-sunshine/>

**Repositorio:** <https://github.com/Vueltito/wiz-sunshine>

## Cómo funciona

HTML, CSS y JavaScript estáticos, sin dependencias de runtime ni paso de build. GitHub Pages publica el contenido de `dist/` después de verificarlo con GitHub Actions.

Incluye ilustraciones de Vueltito, Báltica y LADECE; detalles de proyecto en ventanas accesibles; avatares del equipo; navegación móvil; una consulta editable para copiar o descargar; y una página 404.

LADECE se presenta como **ERP integral en planificación**, no como una entrega ya terminada.

## Desarrollo local

Requisitos: **Node.js 22 o posterior** y **Python 3**. No hace falta instalar paquetes.

```sh
npm run dev
```

Abrir <http://127.0.0.1:8766/wiz-sunshine/>. El servidor respeta el mismo prefijo que Pages, para detectar errores de rutas antes de publicar. También admite `python3 scripts/serve.py --port 0` para elegir un puerto libre.

## Verificación

```sh
npm run check
npm run check:browser
```

El primer comando verifica assets, anclas, CSS, fuentes, manifest, URLs públicas y sintaxis de JavaScript. El segundo requiere Chrome o Chromium; inicia su propio servidor local y un perfil aislado de navegador, revisa escritorio y móvil, y escribe su informe y capturas en `artifacts/browser/`, que está ignorado por Git.

Para auditar la publicación con Lighthouse CLI 13.6.0:

```sh
npm run audit:mobile
npm run audit:desktop
```

La primera ejecución descarga Lighthouse mediante `npx`; no agrega dependencias al sitio. Cada comando guarda un informe HTML y otro JSON en `artifacts/lighthouse/`. Se puede usar `SITE_URL` para auditar una vista previa local. Ejecutar los modos de forma secuencial para que no compitan por CPU; los resultados varían con la máquina y la red.

Para usar otro binario, definir `CHROME_BIN`. Para comprobar una publicación existente, definir `SITE_URL` con su dirección HTTPS; el script prepara consultas de prueba dentro del navegador, sin enviarlas.

## Estructura

```text
dist/
  index.html              Página principal
  404.html                Página de dirección inexistente
  site.webmanifest        Identidad del sitio para navegadores móviles
  sitemap.xml             URL pública canónica
  robots.txt              Referencia al sitemap
  assets/
    styles.css            Diseño base
    refinements.css       Detalles visuales y adaptación móvil
    site.js               Navegación, proyectos y consultas
    refinements.js        Movimiento, progreso y detalles de proyectos
    logo-openrouter.png   Logo aprobado
    people/               Avatares aprobados de Sol y Mago
    fonts/                Fuentes locales y sus licencias
scripts/
  serve.py                Vista previa con prefijo de Pages
  check-site.py           Verificación estática
  check-browser.mjs       Verificación de navegador
site.config.json          URL pública y datos del proyecto
.github/workflows/pages.yml
```

## Contenido y contacto

- Los proyectos, sus estados, contactos y enlaces externos están en `dist/assets/site.js`.
- Los textos y la composición están en `dist/index.html`.
- El contacto definitivo de la factory sigue pendiente de definición. Por ahora el formulario **prepara una consulta editable**, que la persona puede copiar o descargar. No muestra un envío exitoso ni guarda datos en un servidor.
- Para activar un destino, completar `SITE.email` o `SITE.whatsapp` en `site.js`. La persona revisa el mensaje antes de abrir su aplicación para enviarlo.
- Los recursos y las licencias de fuentes están documentados en [NOTICE.md](NOTICE.md).

## Publicación

Los cambios de `main` disparan **Verify and deploy Pages**. Tanto los pull requests como `main` ejecutan las verificaciones estática y de navegador; el despliegue depende de que pasen y solo ocurre desde `main`.

Pages usa el dominio que ya tiene la organización Vueltito, por eso la dirección pública queda bajo `/wiz-sunshine/`. Los assets usan rutas relativas. Si cambia el dominio, actualizar `site.config.json`, canonical y `og:url` en `index.html`, sitemap, robots y los enlaces de `404.html`.

El directorio `.openai/` corresponde a la vista previa original y permanece local e ignorado; GitHub Pages es el destino principal de este repositorio.

## SEO y buscadores con IA

La página incluye canonical, título y descripción, tarjeta social, sitemap, contenido textual en HTML y datos JSON-LD de `Organization`, `WebSite`, `WebPage` y los tres servicios. La sección de preguntas frecuentes responde dudas sobre el estudio y cómo empezar. Los datos de contacto siguen sin inventarse y LADECE conserva su estado de planificación.

Se siguen las [recomendaciones de Google para funciones de IA](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) y de [datos de organización](https://developers.google.com/search/docs/appearance/structured-data/organization). Los datos estructurados coinciden con el contenido visible; no hay una puntuación AEO ni una garantía de indexación, posición o aparición en respuestas de IA.

`robots.txt` de este proyecto documenta su sitemap, pero los rastreadores aplican el archivo de la raíz del dominio. Search Console y el envío del sitemap son gestiones externas al despliegue; una auditoría local no verifica que Google haya indexado la página.

Los iconos de interfaz son SVG para que iOS no los convierta en emojis. El logo usa versiones adaptables y el fondo se sirve precalculado para evitar cálculos de imagen durante la carga.
