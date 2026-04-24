# Referencias visuales organizadas

Este directorio deja el material visual listo para ejecución del agente frontend.

## Importante
- En el material Stitch original no había archivos de imagen (`png/jpg/webp/svg`) sueltos.
- Por eso se organizaron **referencias HTML** por módulo funcional.

## Estructura
- `panel/`
- `ahora/`
- `tareas/`
- `evidencias/`
- `validacion/`
- `presupuestos/`
- `billetera/`
- `cuenta/`
- `acceso/`
- `obras_soporte/`
- `socios_soporte/`
- `canvas_soporte/`

## Uso recomendado para el agente frontend
1. Tomar `panel`, `ahora`, `tareas`, `evidencias`, `validacion`, `presupuestos`, `billetera`, `cuenta` como base principal.
2. Tratar `obras_soporte`, `socios_soporte`, `canvas_soporte` como apoyo de diseño.
3. Implementar con arquitectura responsive única, sin duplicar vistas mobile/desktop.
