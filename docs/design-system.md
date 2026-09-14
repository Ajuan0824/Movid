# MoVid · Field notes

Rediseño iniciado en `nuevo-diseño-14sep` desde `main`, integrado por el propietario en `develop` y terminado allí.

## Revisar el diseño

```sh
npm ci
npm run dev:design
```

Abrir http://localhost:3000/design. El selector superior permite revisar inicio, biblioteca, resultados, recorte, análisis, cuenta, Pro y autenticación. El menú de idioma también cambia el aspecto claro/oscuro.

Esta galería solo existe en desarrollo; en producción devuelve 404. Sus datos son ficticios. El vídeo de 30 segundos de `public/design/sample.mp4` es una fotografía existente codificada como vídeo para probar el reproductor y el recorte. Las acciones de cuenta, descarga y compra se interceptan; no es una demostración del análisis real. El lanzador proporciona identificadores de Firebase inválidos y no debe usarse para probar autenticación.

Para la aplicación real: configurar las variables de `.env.example` en `.env.local` y ejecutar `npm run dev`. No se incluyen claves ni credenciales.

## Criterios visuales y estructura

- Papel marfil, tinta verde, lima para acciones y coral para grabación. Variables semánticas en `app/globals.css`, con equivalentes oscuros.
- DM Sans para lectura, Space Grotesk para navegación/títulos y Fraunces para acentos editoriales.
- `app/components/ui`: contenedor de pantalla, encabezados, panel modal y avisos reutilizables.
- `app/components/mevid`: vistas de producto. `app/components/auth`: formularios de acceso. Textos bilingües centralizados en `lib/mevid/copy.ts`.
- El procesamiento, los límites de planes, Firebase y RevenueCat conservan sus flujos existentes.

## Altura y accesibilidad

El marco usa `100dvh` y áreas seguras. La navegación inferior ocupa espacio real en el layout y no se superpone al contenido. La biblioteca muestra cuatro vídeos por página; los resultados muestran una foto completa y una tira horizontal. Cuenta abre formularios en paneles en lugar de desplegarlos en la página.

No se bloquea el desplazamiento del contenido si el teclado, una pantalla excepcionalmente pequeña o texto ampliado lo necesita. Los documentos legales y los paneles largos mantienen desplazamiento. Ocultar información para forzar una altura no es el objetivo.

Los paneles usan `dialog.showModal()`: fondo inerte, foco contenido, Escape y restauración del foco. El recorte admite flechas, Shift+flechas y Home/End. Los avisos tienen roles de estado/alerta. Animaciones de transformación respetan movimiento reducido; carrusel y animaciones CSS también lo contemplan.

## Validación

Revisión visual y mediciones del contenido en 375×667, 390×844 y 430×932, en inglés/claro y español/oscuro. Se comprobaron navegación, selección de fotos, paginación, reproducción desde la marca temporal, recorte por teclado y cierre/restauración del foco de paneles.

Se ejecutan TypeScript, ESLint y compilación de producción. La compilación local usa identificadores ficticios para satisfacer la inicialización de Firebase que ya existía; no valida servicios externos.

Pendiente de comprobación con credenciales y dispositivos reales: grabación iOS/Android, selector/compartición del sistema, acceso social, guardado en Firebase y compra/restauración nativa. No se realizaron pagos ni se modificaron cuentas durante las pruebas.

## Dependencias

Next se actualizó de 15.5.23 a 15.5.24 para eliminar los avisos críticos detectados, sin cambiar de versión mayor. También se actualizó `@xmldom/xmldom` a 0.9.12 dentro de su rango compatible. El audit sigue señalando dependencias transitivas de Next y de la herramienta de compilación iOS (PostCSS, sharp y uuid/xcode); requieren una revisión de compatibilidad separada. No se aplicó `npm audit fix --force`.
