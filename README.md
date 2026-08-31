# MeVid

Aplicación móvil que analiza un vídeo corto (máximo 15 segundos) y selecciona
automáticamente los 5 mejores momentos, listos para descargar o compartir.

---

## 1. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS 3.4 |
| Animación | framer-motion |
| Iconos | lucide-react |
| Apps nativas | Capacitor 8 (iOS + Android) |
| Autenticación | Firebase Auth vía `@capacitor-firebase/authentication` |
| Base de datos | Cloud Firestore |
| Ficheros | Firebase Cloud Storage |
| IA | OpenAI (visión), en una API route de servidor |

El proyecto es **una web app envuelta en Capacitor**, no React Native. El mismo
código corre en el navegador y dentro del WebView nativo.

---

## 2. Estructura del proyecto

```
app/
  page.tsx                  Orquestador: estado global de la UI y el flujo
  layout.tsx                Providers (Auth, Plan) y script anti-parpadeo de tema
  api/analyze/route.ts      Endpoint de análisis con IA (servidor)
  components/
    auth/                   Login, registro, recuperar contraseña, gate
    mevid/                  Pantallas y componentes de la app
hooks/
  use-auth.tsx              Sesión de Firebase
  use-plan.tsx              Plan y estrellas del usuario
  use-generations.tsx       Historial de vídeos generados
  use-is-mobile.ts          Detección de móvil (bloquea escritorio)
  use-theme-pref.ts         Tema claro/oscuro/automático
  use-locale-pref.ts        Idioma es/en/automático
lib/
  firebase/                 config, auth, firestore, storage, generations
  mevid/                    copy (textos), tipos, vídeo, planes, motion, device
  server/log.ts             Log de errores de servidor
scripts/
  apply-google-plist.mjs    Registra el URL scheme de Google Sign-In en iOS
firestore.rules             Reglas de seguridad de Firestore
storage.rules               Reglas de seguridad de Storage
storage.lifecycle.json      Regla de caducidad a 30 días del bucket
```

---

## 3. Cómo funciona la aplicación

### Puerta de entrada

1. **Bloqueo de escritorio.** `useIsMobile` combina user-agent, ancho de
   viewport y tipo de puntero. En escritorio se muestra `DesktopGate` y nada más.
2. **Bloqueo de sesión.** `AuthGate` exige haber iniciado sesión. Métodos
   disponibles: email/contraseña, Google y Apple.

   El botón de Apple **se oculta en Android**, donde pedir un Apple ID no tiene
   sentido. Se mantiene en iOS y en el resto de plataformas: en iOS además es
   obligatorio, porque la directriz 4.8 de la App Store exige ofrecer "Iniciar
   sesión con Apple" cuando se ofrece cualquier otro acceso de terceros. La
   detección está en `lib/mevid/platform.ts` y funciona tanto en la app nativa
   (vía Capacitor) como en navegador (vía user-agent).

### Flujo principal

1. **Inicio** — el usuario graba con la cámara integrada o sube un vídeo. Al
   subir se valida que sea vídeo y que no pase de 15 segundos.
2. **Revisión** — previsualización del clip antes de gastar una estrella.
3. **Análisis** — se comprueba que queden estrellas y entonces:
   - Se extraen 16 fotogramas de muestra en el navegador con `<canvas>`.
   - Se envían a `POST /api/analyze`, que se los pasa a OpenAI pidiendo 5
     momentos en JSON.
   - Con los tiempos devueltos, el navegador vuelve a abrir el vídeo y captura
     un JPEG a resolución completa por momento. Las imágenes son fotogramas
     reales del vídeo, no arte generado. Ver **Selección de fotograma** abajo.
   - Si todo ha ido bien, **ahora** se cobra la estrella.
4. **Resultado** — se muestra al instante desde ficheros locales, mientras la
   subida a Firebase ocurre en segundo plano.
5. **Momentos** — biblioteca con todo lo generado en los últimos 30 días.

### Selección de fotograma

La calidad de las imágenes finales se reparte entre dos capas, a propósito:
**el modelo elige el momento, los píxeles eligen el fotograma.**

1. **El modelo** recibe 16 muestras (una cada ~0,9s en un vídeo de 15s) y marca
   5 momentos con un `peakTime`. El prompt le pide explícitamente caras nítidas
   y completas con los ojos abiertos, el punto álgido del movimiento (el salto
   en el aire, no el impulso ni la caída) y encuadres completos; y le prohíbe
   el desenfoque de movimiento, los sujetos cortados por el borde y los
   fotogramas casi negros o quemados.

2. **El navegador** no captura a ciegas ese instante. Recorre todo el
   `[start, end]` elegido puntuando 9 fotogramas candidatos y se queda con el
   mejor. La métrica es la **varianza del laplaciano**, el detector de
   desenfoque estándar, atenuada por la exposición para descartar también
   fotogramas negros o quemados, y ponderada por cercanía al `peakTime`
   (`PEAK_BIAS`) para no alejarse del instante elegido salvo que la ganancia de
   nitidez lo justifique.

   La puntuación se hace sobre un lienzo de **480px** de ancho, no menos: el
   desenfoque es pérdida de detalle de alta frecuencia, y a tamaño miniatura un
   fotograma algo blando y uno nítido se reducen casi a lo mismo. Medido sobre
   contenido sintético, la separación entre nítido y ligeramente borroso pasa de
   **1,8x puntuando a 192px a 7,7x puntuando a 480px**.

Esto importa porque el modelo solo ve un muestreo del vídeo: el instante exacto
que nombra es casi siempre un fotograma que nadie miró, y en cualquier escena
con movimiento ese fotograma sale borroso a menudo.

Cada candidato cuesta un salto y una decodificación, así que subir
`REFINE_CANDIDATES` mejora la nitidez a cambio de tiempo de proceso en el móvil.

### Recuperar contraseña

Antes de enviar el correo se fija el código de idioma
(`FirebaseAuthentication.setLanguageCode`) con el idioma activo de la app, así
que Firebase usa su plantilla en español o en inglés según corresponda. Ese
mismo idioma se aplica a la página que abre el enlace.

La pantalla de éxito **no afirma que el correo se haya enviado**, porque la app
no puede saberlo: el proyecto tiene activada la *protección de enumeración de
correo*, y con ella Firebase responde con éxito exista la cuenta o no. Decir
"te lo hemos enviado" sería adivinar. También avisa de que las cuentas de
Google/Apple no tienen contraseña que restablecer.

> **Entregabilidad.** El remitente por defecto es
> `noreply@movid-76127.firebaseapp.com`, un dominio compartido que Gmail marca
> como spam con frecuencia — y Gmail **desactiva los enlaces** de los mensajes
> en spam, que es lo que hace que el enlace parezca roto. El arreglo real es
> configurar un dominio propio en Authentication → Templates → personalizar
> dominio, con sus registros DNS.

### Foto de perfil

La imagen elegida en la galería **se reduce en el móvil antes de subirla**
(`lib/mevid/image.ts`): se escala hasta que su lado más largo mide 512 px y se
recodifica a JPEG. Una foto de 12 MP acaba pesando unos 50 KB.

**No se recorta.** El avatar circular ya recorta al centro al pintarse
(`object-cover`), así que recortar aquí se vería igual hoy pero tiraría los
bordes para siempre.

Se hace así en lugar de subir el original porque el avatar se muestra a ~44 px:
guardar el archivo de cámara serían unas cincuenta veces más bytes de los que
alguien llega a ver, pagados en cada carga y por cada persona que lo vea. Y de
paso, cualquier foto de la galería vale, sin que el peso sea una lotería.

El decodificado respeta la orientación EXIF; sin eso las fotos verticales del
móvil se guardarían tumbadas. El límite de 5 MB de `storage.rules` se queda como
red de seguridad: lo que se sube nunca se le acerca.

### Cámara integrada

Grabar abre una cámara a pantalla completa dentro de la app
(`CameraRecorder`), no la app de cámara del sistema: vista previa en directo,
cambio entre cámara frontal y trasera, botón de grabación con anillo de
progreso y cuenta atrás. **Se corta sola al llegar a los 15 segundos**, así que
no se puede grabar de más para que luego la app lo rechace.

Usa `getUserMedia` + `MediaRecorder`. El códec se elige en tiempo de ejecución
(`lib/mevid/recorder.ts`) porque Safari graba MP4 y Chrome WebM.

> **Requiere contexto seguro.** `getUserMedia` solo existe bajo https, localhost
> o un esquema nativo. La configuración de desarrollo de Capacitor apunta a
> `http://<ip-local>:3000`, que **no** lo es, así que en el dispositivo la
> cámara integrada no estará disponible hasta servir por https. Cuando no lo
> está, la app cae automáticamente a la cámara del sistema vía
> `<input capture>` — el límite de 15s pasa entonces a validarse después de
> grabar, como antes.

La duración se toma del reloj mientras se graba, no del fichero: los ficheros de
`MediaRecorder` a menudo no llevan duración en sus metadatos. Por eso
`lib/mevid/video.ts` incluye además un rodeo para resolver duraciones
`Infinity` antes de extraer fotogramas.

### Cuando el análisis falla

Si no hay `OPENAI_API_KEY`, si la petición a OpenAI falla o si la respuesta no es
un JSON válido con 5 momentos, `/api/analyze` devuelve un error HTTP (400, 502 o
503 según el caso) y la app muestra el mensaje "se ha producido un error, vuelve
a intentarlo más tarde". El usuario vuelve a la pantalla de revisión con su clip
intacto, así que reintentar es un toque.

**No se cobra ninguna estrella si el análisis falla.** La estrella se cobra
justo después de que el análisis tenga éxito, no antes.

### Otros detalles

- **Idiomas**: español e inglés. Todos los textos viven en `lib/mevid/copy.ts`.
  La preferencia (`es` / `en` / automático) se guarda en `localStorage`.
- **Tema**: claro, oscuro o automático. `layout.tsx` inyecta un script que
  aplica el tema antes del primer pintado para evitar el parpadeo blanco.
- **Háptica**: vibración sutil al tocar, vía `@capacitor/haptics`.

---

## 4. Planes y estrellas

Una **estrella** equivale a una generación de vídeo.

| Plan | Estrellas por semana |
|---|---|
| Free | 3 |
| Pro | 7 |

- Las semanas empiezan el **lunes a las 00:00 UTC**, iguales para todos.
- La recarga es automática: al abrir la app, si el periodo guardado ya pasó, el
  contador se pone a cero.
- Al quedarse sin estrellas aparece un modal distinto según el plan: los free ven
  una invitación a pasarse a Pro, los pro ven la fecha de recarga.
- A un usuario Pro se le oculta la pestaña Pro y la tarjeta de "Mejorar a Pro".

**Usuarios fundadores**: las cuentas que ya existían cuando se lanzaron los
planes son Pro. La lista de UIDs está en `lib/mevid/plan.ts` y, sobre todo, en
`firestore.rules`, que es quien lo hace cumplir. Es andamiaje temporal: cuando
haya facturación real, se quitan las dos.

---

## 5. Modelo de datos

### Firestore

```
users/{uid}
  email       string     Anclado por reglas al email del token (no falsificable)
  plan        string     "free" | "pro"  — el cliente NUNCA puede escribirlo
  starsUsed   number     Consumidas en el periodo actual
  periodStart timestamp  Lunes 00:00 UTC del periodo en curso

users/{uid}/generations/{generationId}
  createdAt   timestamp
  expiresAt   timestamp  createdAt + 30 días
  duration    number     Segundos del clip
  videoUrl    string     URL de descarga del vídeo
  highlights  array      [{ start, end, peakTime, title, image }]
```

### Storage

```
users/{uid}/avatar                        Foto de perfil. Permanente. Lectura pública.
generations/{uid}/{generationId}/video    Clip original. Privado.
generations/{uid}/{generationId}/moment-N.jpg   Los 5 momentos. Privado.
```

Las generaciones **no** cuelgan de `users/{uid}/` a propósito: la regla de ciclo
de vida del bucket solo puede filtrar por prefijo, así que si estuvieran juntas,
la caducidad a 30 días se llevaría también las fotos de perfil por delante.

### Retención a 30 días

Dos mecanismos complementarios:

1. **En la app** — al abrir, se barren las generaciones caducadas del usuario
   (documentos y ficheros). Cubre a quien usa la app.
2. **En el bucket** — regla de ciclo de vida (`storage.lifecycle.json`): borrar
   objetos con más de 30 días y prefijo `generations/`. Cubre las cuentas
   abandonadas, donde el barrido de la app no llega a ejecutarse nunca.

---

## 6. Seguridad

Las reglas son la única frontera de confianza: **el cliente no se valida a sí
mismo**. `firestore.rules` garantiza que un usuario no pueda:

- Cambiar su propio `plan` (ni al crear el documento ni después).
- Gastar más estrellas de las que le da su plan.
- Adelantar la recarga semanal. Un periodo nuevo debe ser 7 días posterior al
  anterior **y** no estar en el futuro según la hora del servidor, así que
  cambiar el reloj del móvil no sirve de nada.
- Escribir el email de otra persona: se compara con `request.auth.token.email`.

`storage.rules` limita cada usuario a su propia carpeta, con tope de tamaño
(5 MB para avatares, 100 MB para vídeos) y comprobación de tipo de contenido.

> Nota: las URLs de descarga de Firebase Storage llevan un token y **saltan las
> reglas** por diseño. Quien tenga la URL puede ver el fichero. Las URLs de
> vídeos privados solo se guardan en el documento Firestore de su dueño.

### Desplegar las reglas

```bash
npx firebase-tools deploy --only firestore:rules,storage
```

---

## 7. Configuración

Copia `.env.example` a `.env.local` y rellena:

| Variable | Obligatoria | Descripción |
|---|---|---|
| `OPENAI_API_KEY` | Sí | Sin ella el análisis devuelve error y la app no funciona. |
| `OPENAI_MODEL` | No | Modelo con visión. Por defecto `gpt-5.6-luna`. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Sí | |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Sí | |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Sí | |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Sí | |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sí | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Sí | |

Las `NEXT_PUBLIC_*` son claves públicas de Firebase: es normal y seguro que
lleguen al cliente. `OPENAI_API_KEY` **sí es secreta** y solo se usa en el
servidor, dentro de la API route.

---

## 8. Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm start        # sirve el build
```

La app bloquea el escritorio, así que para verla usa el móvil o el modo
responsive del navegador (⌘⇧M en Chrome).

### Apps nativas (Capacitor)

```bash
npx cap sync
npx cap open ios      # o android
```

`capacitor.config.ts` apunta `server.url` a una **IP de red local** para
desarrollo. Antes de publicar hay que cambiarla por la URL de producción
(https) y quitar `cleartext: true`.

Para Google Sign-In en iOS, tras descargar `GoogleService-Info.plist` de Firebase:

```bash
node scripts/apply-google-plist.mjs
```

---

## 9. Limitaciones conocidas

- **Firebase en las builds nativas está incompleto.** El repositorio no incluye
  `google-services.json` ni `GoogleService-Info.plist`. Además, con
  `skipNativeAuth: false` el login ocurre en la capa nativa, de modo que el SDK
  de JavaScript queda sin autenticar: en una build nativa las escrituras a
  Firestore y Storage (estrellas, avatar, historial) fallarían. **Hoy funciona
  en navegador y en el WebView apuntando al servidor web.** Falta puentear la
  sesión nativa hacia el SDK de JS.
- **El cobro de la estrella ocurre en el cliente.** Como se cobra después de un
  análisis correcto, alguien que refresque a mitad del análisis puede consumir
  llamadas a OpenAI sin gastar estrella (no obtiene resultado a cambio). La
  solución definitiva es mover la comprobación y el cobro al servidor, dentro de
  la API route, verificando el token de Firebase.
- **La lista de usuarios fundadores está escrita a mano** en las reglas y en
  `lib/mevid/plan.ts`. Es temporal, hasta que haya facturación.
