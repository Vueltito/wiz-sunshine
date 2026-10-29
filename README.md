# Wiz Sunshine

Sitio de presentación de Wiz Sunshine, el estudio de software de Sol Soletti y Lucio Rojas.

Sitio estático sin build: `dist/index.html`, `dist/assets/styles.css` y `dist/assets/site.js`. Los detalles de interacción y presentación están en `refinements.css` y `refinements.js`.

La configuración de contacto y los enlaces de trabajos están en `dist/assets/site.js`.
Las imágenes y escenas ilustrativas se construyen con SVG, CSS y canvas.

El logo `dist/assets/logo-openrouter.png` fue generado con OpenRouter (`google/gemini-3-pro-image`). El avatar de Sol proviene de su GitHub público; el avatar de Mago es el archivo elegido por Valen. El pingüino y el corazón del crédito son SVG con una grilla de píxeles.

Para servirlo localmente: `python3 -m http.server 8766 --directory dist`.

La publicación y el repositorio de fuente se administran con Sites y `.openai/hosting.json`.
