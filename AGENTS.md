# Wiz Sunshine

Sitio de presentación de Sol Soletti y Lucio Rojas, con crédito de diseño de VT Security.

- Sitio estático, sin dependencias de runtime ni paso de build. `dist/` es lo que publica GitHub Pages.
- GitHub Pages es el destino principal. La configuración pública vive en `site.config.json`.
- Usar rutas relativas para assets: el sitio vive bajo `/wiz-sunshine/`.
- Mantener la identidad aprobada: logo de OpenRouter, avatar de Sol, imagen elegida para Mago e ilustraciones de Vueltito, Báltica y LADECE.
- LADECE se presenta como un ERP integral en planificación; no atribuir funcionalidades entregadas a un proyecto futuro.
- Los datos de contacto y los enlaces de proyectos están en `dist/assets/site.js`. El formulario prepara una consulta; su destino definitivo sigue pendiente de definición.
- No incorporar credenciales, documentos privados, datos reales de clientes o datos de prueba a la publicación.
- Para verificar: `npm run check` y, con Chrome disponible, `npm run check:browser`. Revisar móvil, menú, modales, formulario, foco, tamaño táctil y movimiento reducido.
- Los cambios de `main` se verifican y despliegan mediante `.github/workflows/pages.yml`.
