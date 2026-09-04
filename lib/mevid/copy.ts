import type { Locale } from "./types";

export type AppCopy = {
  language: { label: string; english: string; spanish: string; system: string };
  appearance: { label: string; system: string; light: string; dark: string };
  hero: { title: string; titleAccent: string; description: string; maxLength: string; record: string; upload: string; aiReady: string };
  review: { eyebrow: string; title: string; description: string; retry: string; analyse: string; trimTitle: string; trimHint: string; preview: string; trimStartHandle: string; trimEndHandle: string };
  analysis: { eyebrow: string; title: string; steps: string[] };
  results: { eyebrow: string; title: string; newVideo: string; moments: string; tipStart: string; tipEnd: string; selectHint: string; download: string; downloadEmpty: string; downloadOne: string; topFive: string; moment: string };
  tabs: { home: string; momentos: string; pro: string; cuenta: string; nav: string };
  camera: { flip: string; start: string; stop: string; maxHint: string; permissionDenied: string };
  momentsEmpty: { title: string; description: string; cta: string };
  library: {
    eyebrow: string; title: string; description: string;
    open: string; back: string; delete: string; deleteConfirm: string;
    saving: string; momentsCount: string; today: string; yesterday: string; daysAgo: string;
    expiresIn: string; expiresToday: string;
  };
  pro: {
    eyebrow: string; title: string; subtitle: string;
    freeLabel: string; proLabel: string; perMonth: string;
    /** Row labels for the Free-vs-Pro table; the numbers come from PLAN_LIMITS. */
    compare: { videos: string; moments: string; length: string };
    /** Extra selling points under the table. */
    perks: string[];
    /** Launch-offer block: struck-through list price, discount ribbon, billing line. */
    wasPrice: string; discount: string; launchOffer: string; billedMonthly: string;
    cta: string; trial: string; legal: string; noOffering: string;
    restore: string; restoring: string; activating: string;
    errorGeneric: string; restoredOk: string; restoreNothing: string; unavailable: string;
  };
  account: { eyebrow: string; title: string; plan: string; upgrade: string; upgradeSub: string };
  plans: { free: string; pro: string };
  stars: {
    remaining: string; spent: string; headerSummary: string;
    emptyFreeTitle: string; emptyFreeBody: string; emptyFreeCta: string;
    emptyProTitle: string; emptyProBody: string;
    refillsOn: string; dismiss: string;
    loadError: string; retry: string;
  };
  errors: {
    notVideo: string; tooLong: string; unreadable: string;
    analysisFailed: string; analysisUnavailable: string; analysisVideoUnreadable: string;
    planUnavailable: string; downloadFailed: string;
  };
  desktopGate: { title: string; description: string };
  auth: {
    login: { eyebrow: string; title: string; description: string; emailLabel: string; passwordLabel: string; forgot: string; submit: string; noAccount: string; createAccount: string; orDivider: string; google: string; apple: string };
    register: { eyebrow: string; title: string; description: string; emailLabel: string; passwordLabel: string; confirmLabel: string; submit: string; haveAccount: string; signIn: string; termsText: string; strengthWeak: string; strengthGood: string; strengthStrong: string };
    forgot: { eyebrow: string; title: string; description: string; emailLabel: string; submit: string; back: string; sent: string; sentSocialHint: string };
    /** Label on the back chip that returns to the sign-in screen. */
    backToLogin: string;
    errors: { invalidEmail: string; userNotFound: string; wrongPassword: string; emailInUse: string; weakPassword: string; tooManyRequests: string; networkError: string; cancelled: string; unknown: string; passwordMismatch: string; required: string; termsRequired: string };
    account: { signedInAs: string; signOut: string; profile: string; settings: string };
    profile: {
      title: string; description: string; close: string;
      changePhoto: string; photoUpdated: string; photoTooLarge: string; photoInvalidType: string; photoUnreadable: string;
      nameTitle: string; nameLabel: string; saveName: string; nameSaved: string;
      passwordTitle: string; passwordDescription: string; currentPasswordLabel: string; newPasswordLabel: string; confirmPasswordLabel: string; changePassword: string; passwordSaved: string; noPasswordProvider: string;
    };
  };
};

const dictionary: Record<Locale, AppCopy> = {
  en: {
    language: { label: "Language", english: "English", spanish: "Spanish", system: "Automatic" },
    appearance: { label: "Appearance", system: "Automatic", light: "Light", dark: "Dark" },
    hero: {
      title: "Capture a moment.",
      titleAccent: "Keep the best part.",
      description: "Record 15 seconds or upload a longer clip and trim it — AI finds your 5 most shareable moments.",
      maxLength: "15 SECONDS MAX.",
      record: "Start recording",
      upload: "Upload a video",
      aiReady: "AI READY",
    },
    review: {
      eyebrow: "VIDEO READY",
      title: "Your moment is here.",
      description: "Now let’s find the parts worth replaying.",
      retry: "Record again",
      analyse: "Find my moments",
      trimTitle: "Trim to your best moment.",
      trimHint: "Drag the edges to pick up to {max} seconds.",
      preview: "Play preview",
      trimStartHandle: "Move start of selection",
      trimEndHandle: "Move end of selection",
    },
    analysis: {
      eyebrow: "ANALYSIS IN PROGRESS",
      title: "Your video has a story to tell.",
      steps: ["Reading pace and composition", "Finding energy shifts", "Spotting memorable peaks", "Refining your selection"],
    },
    results: {
      eyebrow: "MOMENTS FOUND",
      title: "Here’s what you shouldn’t miss.",
      newVideo: "New video",
      moments: "Your best moments",
      tipStart: "Tip:",
      tipEnd: "use these timestamps as a guide for your next edit.",
      selectHint: "Check the moments you want, then download the real frames as JPEG.",
      download: "Download selected",
      downloadEmpty: "Select at least one moment",
      downloadOne: "Download this photo",
      topFive: "TOP 5",
      moment: "MOMENT",
    },
    tabs: { home: "Home", momentos: "Moments", pro: "Pro", cuenta: "Account", nav: "Main navigation" },
    camera: {
      flip: "Flip camera",
      start: "Start recording",
      stop: "Stop recording",
      maxHint: "{max}s max",
      permissionDenied: "We can’t reach your camera. Check that MoVid has camera and microphone permission, then try again.",
    },
    momentsEmpty: {
      title: "No moments yet",
      description: "Record or upload a video from Home and AI will find your best moments.",
      cta: "Go to Home",
    },
    library: {
      eyebrow: "LAST 30 DAYS",
      title: "Your moments",
      description: "Everything you've created in the last 30 days. Older videos are deleted automatically.",
      open: "Open",
      back: "All moments",
      delete: "Delete",
      deleteConfirm: "Delete this video and its moments?",
      saving: "Saving…",
      momentsCount: "{count} moments",
      today: "Today",
      yesterday: "Yesterday",
      daysAgo: "{days} days ago",
      expiresIn: "{days} days left",
      expiresToday: "Expires today",
    },
    pro: {
      eyebrow: "MoVid PRO",
      title: "Five times the moments.",
      subtitle: "More videos a week, more moments per video, and twice the footage for the AI to hunt through.",
      freeLabel: "Free",
      proLabel: "Pro",
      perMonth: "/mo",
      compare: { videos: "Videos a week", moments: "Moments per video", length: "Clip length" },
      perks: ["Denser AI sampling on longer clips", "Everything in Free, nothing removed", "Cancel anytime from your Apple ID"],
      wasPrice: "€6.99",
      discount: "-43%",
      launchOffer: "LAUNCH OFFER",
      billedMonthly: "billed monthly, cancel anytime",
      cta: "Start 3 days free",
      trial: "3 days free, then {price}/mo",
      legal: "Renews automatically unless cancelled at least 24 h before the period ends. Manage it from your Apple ID settings.",
      restore: "Restore purchases",
      restoring: "Restoring…",
      activating: "Activating MoVid Pro…",
      errorGeneric: "The purchase couldn't be completed. Please try again.",
      restoredOk: "Your subscription is back.",
      restoreNothing: "No previous purchases found for this Apple ID.",
      unavailable: "Subscriptions are only available in the MoVid iOS app.",
      noOffering: "Pro isn’t on sale just yet — check back in a moment.",
    },
    account: {
      eyebrow: "YOUR ACCOUNT",
      title: "Account",
      plan: "FREE",
      upgrade: "Upgrade to Pro",
      upgradeSub: "{pro} videos a week, {moments} moments each, {seconds}s clips",
    },
    plans: { free: "FREE", pro: "PRO" },
    stars: {
      remaining: "{left} of {total} stars left this week",
      spent: "No stars left this week",
      headerSummary: "{left}/{total} · {used} used",
      emptyFreeTitle: "You’re out of stars",
      emptyFreeBody: "Free accounts get {total} videos a week. Go Pro for {pro} a week and keep creating.",
      emptyFreeCta: "See Pro",
      emptyProTitle: "You’ve used all your stars",
      emptyProBody: "You’ve used your {total} videos for this week. They refill automatically.",
      refillsOn: "Back on {date}",
      dismiss: "Got it",
      loadError: "Couldn’t load your stars",
      retry: "Retry",
    },
    errors: {
      notVideo: "Choose a video file to continue.",
      tooLong: "That video is over 10 minutes long. Pick a shorter one.",
      unreadable: "We couldn’t read that video. Please try another file.",
      analysisFailed: "Something went wrong analysing your video. Please try again later — no star was used.",
      analysisUnavailable: "AI analysis isn’t available right now (the server has no OpenAI key configured). No star was used.",
      planUnavailable: "We couldn’t check your weekly stars. Check your connection and try again — no star was used.",
      analysisVideoUnreadable: "We couldn’t read the frames of that recording. Try recording again — no star was used.",
      downloadFailed: "We couldn’t save those photos. Please try again.",
    },
    desktopGate: {
      title: "Open this on your phone",
      description: "MoVid is designed for mobile — please visit this page from your phone’s browser to record and analyse your video.",
    },
    auth: {
      login: {
        eyebrow: "WELCOME BACK",
        title: "Sign in to MoVid.",
        description: "Your moments, saved and ready when you are.",
        emailLabel: "Email",
        passwordLabel: "Password",
        forgot: "Forgot password?",
        submit: "Sign in",
        noAccount: "New to MoVid?",
        createAccount: "Create an account",
        orDivider: "or continue with",
        google: "Continue with Google",
        apple: "Sign in with Apple",
      },
      register: {
        eyebrow: "CREATE ACCOUNT",
        title: "Join MoVid.",
        description: "One quick step and you’re in.",
        emailLabel: "Email",
        passwordLabel: "Password",
        confirmLabel: "Confirm password",
        submit: "Create account",
        haveAccount: "Already have an account?",
        signIn: "Sign in",
        termsText: "I accept MoVid’s terms and privacy policy.",
        strengthWeak: "WEAK",
        strengthGood: "GOOD",
        strengthStrong: "STRONG",
      },
      forgot: {
        eyebrow: "RESET PASSWORD",
        title: "Let’s get you back in.",
        description: "Enter your email and we’ll send you a reset link.",
        emailLabel: "Email",
        submit: "Send reset link",
        back: "Back to sign in",
        sent: "If that address has a MoVid account with a password, the reset link is on its way. Check your spam folder too.",
        sentSocialHint: "Signed up with Google or Apple? There’s no password to reset — go back and use that button instead.",
      },
      backToLogin: "Back to sign in",
      errors: {
        invalidEmail: "That email address doesn’t look right.",
        userNotFound: "We couldn’t find an account with that email.",
        wrongPassword: "That password doesn’t match.",
        emailInUse: "An account already exists with that email.",
        weakPassword: "Use at least 6 characters for your password.",
        tooManyRequests: "Too many attempts. Please wait a moment and try again.",
        networkError: "Network issue — check your connection and try again.",
        cancelled: "Sign-in was cancelled.",
        unknown: "Something went wrong. Please try again.",
        passwordMismatch: "Passwords don’t match.",
        required: "This field is required.",
        termsRequired: "Accept the terms to continue.",
      },
      account: { signedInAs: "Signed in as", signOut: "Sign out", profile: "Profile", settings: "Settings" },
      profile: {
        title: "Your profile",
        description: "Update how you appear across MoVid.",
        close: "Close",
        changePhoto: "Change photo",
        photoUpdated: "Photo updated.",
        photoTooLarge: "That image is too large to open. Choose one under 30 MB.",
        photoInvalidType: "Choose an image file (JPG, PNG, WEBP...).",
        photoUnreadable: "We couldn’t open that image. Try another one.",
        nameTitle: "Name",
        nameLabel: "Display name",
        saveName: "Save name",
        nameSaved: "Profile updated.",
        passwordTitle: "Password",
        passwordDescription: "Confirm your current password to set a new one.",
        currentPasswordLabel: "Current password",
        newPasswordLabel: "New password",
        confirmPasswordLabel: "Confirm new password",
        changePassword: "Update password",
        passwordSaved: "Password updated.",
        noPasswordProvider: "You signed in with Google or Apple, so there’s no password to change here.",
      },
    },
  },
  es: {
    language: { label: "Idioma", english: "Inglés", spanish: "Español", system: "Automático" },
    appearance: { label: "Apariencia", system: "Automático", light: "Claro", dark: "Oscuro" },
    hero: {
      title: "Graba un momento.",
      titleAccent: "Quédate con lo mejor.",
      description: "Graba 15 segundos o sube un clip más largo y recórtalo — la IA encuentra tus 5 instantes más compartibles.",
      maxLength: "15 SEGUNDOS MÁX.",
      record: "Grabar ahora",
      upload: "Subir un vídeo",
      aiReady: "IA LISTA",
    },
    review: {
      eyebrow: "VÍDEO LISTO",
      title: "Tu momento está aquí.",
      description: "Ahora vamos a encontrar las partes que merece la pena repetir.",
      retry: "Grabar de nuevo",
      analyse: "Encontrar mis momentos",
      trimTitle: "Recorta hasta tu mejor momento.",
      trimHint: "Arrastra los extremos para elegir hasta {max} segundos.",
      preview: "Reproducir vista previa",
      trimStartHandle: "Mover inicio de la selección",
      trimEndHandle: "Mover fin de la selección",
    },
    analysis: {
      eyebrow: "ANÁLISIS EN CURSO",
      title: "Tu vídeo tiene una historia que contar.",
      steps: ["Leyendo ritmo y composición", "Detectando cambios de energía", "Encontrando los picos memorables", "Afinando tu selección"],
    },
    results: {
      eyebrow: "MOMENTOS ENCONTRADOS",
      title: "Esto es lo que no te puedes perder.",
      newVideo: "Nuevo vídeo",
      moments: "Tus mejores momentos",
      tipStart: "Tip:",
      tipEnd: "usa estos tiempos como guía para tu próxima edición.",
      selectHint: "Marca los momentos que quieras y descarga los fotogramas reales en JPEG.",
      download: "Descargar selección",
      downloadEmpty: "Selecciona al menos un momento",
      downloadOne: "Descargar esta foto",
      topFive: "TOP 5",
      moment: "MOMENTO",
    },
    tabs: { home: "Inicio", momentos: "Momentos", pro: "Pro", cuenta: "Cuenta", nav: "Navegación principal" },
    camera: {
      flip: "Cambiar cámara",
      start: "Empezar a grabar",
      stop: "Parar de grabar",
      maxHint: "{max}s máx.",
      permissionDenied: "No podemos acceder a tu cámara. Comprueba que MoVid tiene permiso de cámara y micrófono, y vuelve a intentarlo.",
    },
    momentsEmpty: {
      title: "Aún no hay momentos",
      description: "Graba o sube un vídeo desde Inicio y la IA encontrará tus mejores momentos.",
      cta: "Ir a Inicio",
    },
    library: {
      eyebrow: "ÚLTIMOS 30 DÍAS",
      title: "Tus momentos",
      description: "Todo lo que has creado en los últimos 30 días. Los vídeos más antiguos se borran automáticamente.",
      open: "Abrir",
      back: "Todos los momentos",
      delete: "Eliminar",
      deleteConfirm: "¿Eliminar este vídeo y sus momentos?",
      saving: "Guardando…",
      momentsCount: "{count} momentos",
      today: "Hoy",
      yesterday: "Ayer",
      daysAgo: "Hace {days} días",
      expiresIn: "Quedan {days} días",
      expiresToday: "Caduca hoy",
    },
    pro: {
      eyebrow: "MoVid PRO",
      title: "Cinco veces más momentos.",
      subtitle: "Más vídeos por semana, más momentos por vídeo y el doble de metraje para que la IA rebusque.",
      freeLabel: "Free",
      proLabel: "Pro",
      perMonth: "/mes",
      compare: { videos: "Vídeos por semana", moments: "Momentos por vídeo", length: "Duración del clip" },
      perks: ["La IA muestrea más fotogramas en clips largos", "Todo lo del plan Free, sin quitar nada", "Cancela cuando quieras desde tu Apple ID"],
      wasPrice: "6,99 €",
      discount: "-43%",
      launchOffer: "OFERTA DE LANZAMIENTO",
      billedMonthly: "facturado cada mes, cancela cuando quieras",
      cta: "Empezar 3 días gratis",
      trial: "3 días gratis y luego {price}/mes",
      legal: "Se renueva automáticamente salvo que la canceles al menos 24 h antes de que acabe el periodo. Puedes gestionarla desde los ajustes de tu Apple ID.",
      restore: "Restaurar compras",
      restoring: "Restaurando…",
      activating: "Activando MoVid Pro…",
      errorGeneric: "No se pudo completar la compra. Inténtalo de nuevo.",
      restoredOk: "Tu suscripción está de vuelta.",
      restoreNothing: "No hay compras previas con este Apple ID.",
      unavailable: "Las suscripciones solo están disponibles en la app de MoVid para iOS.",
      noOffering: "Pro todavía no está a la venta — vuelve a intentarlo en un momento.",
    },
    account: {
      eyebrow: "TU CUENTA",
      title: "Cuenta",
      plan: "FREE",
      upgrade: "Mejorar a Pro",
      upgradeSub: "{pro} vídeos por semana, {moments} momentos y clips de {seconds}s",
    },
    plans: { free: "FREE", pro: "PRO" },
    stars: {
      remaining: "Te quedan {left} de {total} estrellas esta semana",
      spent: "Sin estrellas esta semana",
      headerSummary: "{left}/{total} · {used} usadas",
      emptyFreeTitle: "Te has quedado sin estrellas",
      emptyFreeBody: "Las cuentas free tienen {total} vídeos por semana. Pasa a Pro para tener {pro} y seguir creando.",
      emptyFreeCta: "Ver Pro",
      emptyProTitle: "Has agotado tus estrellas",
      emptyProBody: "Ya has usado tus {total} vídeos de esta semana. Se recargan automáticamente.",
      refillsOn: "Vuelven el {date}",
      dismiss: "Entendido",
      loadError: "No pudimos cargar tus estrellas",
      retry: "Reintentar",
    },
    errors: {
      notVideo: "Elige un archivo de vídeo para continuar.",
      tooLong: "Ese vídeo dura más de 10 minutos. Elige uno más corto.",
      unreadable: "No hemos podido leer ese vídeo. Prueba con otro archivo.",
      analysisFailed: "Se ha producido un error al analizar tu vídeo. Vuelve a intentarlo más tarde — no se ha gastado ninguna estrella.",
      analysisUnavailable: "El análisis con IA no está disponible ahora mismo (el servidor no tiene configurada la clave de OpenAI). No se ha gastado ninguna estrella.",
      analysisVideoUnreadable: "No hemos podido leer los fotogramas de esa grabación. Prueba a grabar de nuevo — no se ha gastado ninguna estrella.",
      planUnavailable: "No pudimos comprobar tus estrellas semanales. Revisa tu conexión y vuelve a intentarlo — no se ha gastado ninguna estrella.",
      downloadFailed: "No hemos podido guardar esas fotos. Vuelve a intentarlo.",
    },
    desktopGate: {
      title: "Abrí esto desde tu teléfono",
      description: "MoVid está pensado para móvil — abrí esta página desde el navegador de tu teléfono para grabar y analizar tu vídeo.",
    },
    auth: {
      login: {
        eyebrow: "BIENVENIDO DE NUEVO",
        title: "Inicia sesión en MoVid.",
        description: "Tus momentos, guardados y listos cuando tú lo estés.",
        emailLabel: "Correo electrónico",
        passwordLabel: "Contraseña",
        forgot: "¿Olvidaste tu contraseña?",
        submit: "Iniciar sesión",
        noAccount: "¿Nuevo en MoVid?",
        createAccount: "Crear una cuenta",
        orDivider: "o continúa con",
        google: "Continuar con Google",
        apple: "Continuar con Apple",
      },
      register: {
        eyebrow: "CREAR CUENTA",
        title: "Únete a MoVid.",
        description: "Un paso rápido y ya estamos.",
        emailLabel: "Correo electrónico",
        passwordLabel: "Contraseña",
        confirmLabel: "Confirmar contraseña",
        submit: "Crear cuenta",
        haveAccount: "¿Ya tienes una cuenta?",
        signIn: "Inicia sesión",
        termsText: "Acepto las condiciones y la política de privacidad de MoVid.",
        strengthWeak: "DÉBIL",
        strengthGood: "BIEN",
        strengthStrong: "FUERTE",
      },
      forgot: {
        eyebrow: "RECUPERAR CONTRASEÑA",
        title: "Vamos a recuperar tu acceso.",
        description: "Escribe tu correo y te enviaremos un enlace para restablecerla.",
        emailLabel: "Correo electrónico",
        submit: "Enviar enlace",
        back: "Volver a iniciar sesión",
        sent: "Si esa dirección tiene una cuenta de MoVid con contraseña, el enlace va de camino. Mira también en la carpeta de spam.",
        sentSocialHint: "¿Te registraste con Google o Apple? Entonces no hay contraseña que restablecer — vuelve atrás y entra con ese botón.",
      },
      backToLogin: "Volver a iniciar sesión",
      errors: {
        invalidEmail: "Ese correo electrónico no parece válido.",
        userNotFound: "No encontramos ninguna cuenta con ese correo.",
        wrongPassword: "Esa contraseña no coincide.",
        emailInUse: "Ya existe una cuenta con ese correo.",
        weakPassword: "Usa al menos 6 caracteres para tu contraseña.",
        tooManyRequests: "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
        networkError: "Problema de red — revisa tu conexión e inténtalo de nuevo.",
        cancelled: "Se canceló el inicio de sesión.",
        unknown: "Algo salió mal. Inténtalo de nuevo.",
        passwordMismatch: "Las contraseñas no coinciden.",
        required: "Este campo es obligatorio.",
        termsRequired: "Acepta las condiciones para continuar.",
      },
      account: { signedInAs: "Sesión iniciada como", signOut: "Cerrar sesión", profile: "Perfil", settings: "Ajustes" },
      profile: {
        title: "Tu perfil",
        description: "Actualiza cómo apareces en MoVid.",
        close: "Cerrar",
        changePhoto: "Cambiar foto",
        photoUpdated: "Foto actualizada.",
        photoTooLarge: "Esa imagen pesa demasiado para abrirla. Elige una de menos de 30 MB.",
        photoInvalidType: "Elige un archivo de imagen (JPG, PNG, WEBP...).",
        photoUnreadable: "No hemos podido abrir esa imagen. Prueba con otra.",
        nameTitle: "Nombre",
        nameLabel: "Nombre visible",
        saveName: "Guardar nombre",
        nameSaved: "Perfil actualizado.",
        passwordTitle: "Contraseña",
        passwordDescription: "Confirma tu contraseña actual para establecer una nueva.",
        currentPasswordLabel: "Contraseña actual",
        newPasswordLabel: "Nueva contraseña",
        confirmPasswordLabel: "Confirmar nueva contraseña",
        changePassword: "Actualizar contraseña",
        passwordSaved: "Contraseña actualizada.",
        noPasswordProvider: "Iniciaste sesión con Google o Apple, así que aquí no hay contraseña que cambiar.",
      },
    },
  },
};

export function getCopy(locale: Locale) {
  return dictionary[locale];
}
