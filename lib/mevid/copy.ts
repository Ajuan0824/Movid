import type { Locale } from "./types";

export type AppCopy = {
  language: { label: string; english: string; spanish: string };
  hero: { eyebrow: string; title: string; titleAccent: string; description: string; maxLength: string; record: string; upload: string; private: string; aiReady: string };
  review: { eyebrow: string; title: string; description: string; retry: string; analyse: string };
  analysis: { eyebrow: string; title: string; steps: string[] };
  results: { eyebrow: string; title: string; newVideo: string; moments: string; tipStart: string; tipEnd: string; selectHint: string; download: string; downloadEmpty: string; downloadOne: string; topFive: string; moment: string };
  tabs: { home: string; momentos: string; pro: string; cuenta: string; nav: string };
  momentsEmpty: { title: string; description: string; cta: string };
  pro: {
    eyebrow: string; title: string; freeLabel: string; proLabel: string; popular: string; perMonth: string;
    freeFeatures: string[]; proFeatures: string[];
    monthly: string; yearly: string; monthlySub: string; yearlySub: string; discount: string;
    ctaMonthly: string; ctaYearly: string; trial: string; comingSoon: string;
  };
  account: { eyebrow: string; title: string; plan: string; upgrade: string; upgradeSub: string };
  footer: { left: string; right: string };
  errors: { notVideo: string; tooLong: string; unreadable: string };
  desktopGate: { title: string; description: string };
  auth: {
    login: { eyebrow: string; title: string; description: string; emailLabel: string; passwordLabel: string; forgot: string; submit: string; noAccount: string; createAccount: string; orDivider: string; google: string; apple: string };
    register: { eyebrow: string; title: string; description: string; emailLabel: string; passwordLabel: string; confirmLabel: string; submit: string; haveAccount: string; signIn: string; termsText: string; strengthWeak: string; strengthGood: string; strengthStrong: string };
    forgot: { eyebrow: string; title: string; description: string; emailLabel: string; submit: string; back: string; sent: string };
    errors: { invalidEmail: string; userNotFound: string; wrongPassword: string; emailInUse: string; weakPassword: string; tooManyRequests: string; networkError: string; cancelled: string; unknown: string; passwordMismatch: string; required: string; termsRequired: string };
    account: { signedInAs: string; signOut: string; profile: string };
    profile: {
      title: string; description: string; close: string;
      nameLabel: string; saveName: string; nameSaved: string;
      passwordTitle: string; passwordDescription: string; currentPasswordLabel: string; newPasswordLabel: string; confirmPasswordLabel: string; changePassword: string; passwordSaved: string; noPasswordProvider: string;
    };
  };
};

const dictionary: Record<Locale, AppCopy> = {
  en: {
    language: { label: "Language", english: "English", spanish: "Spanish" },
    hero: {
      eyebrow: "YOUR MOMENT EDITOR",
      title: "Capture a moment.",
      titleAccent: "Keep the best part.",
      description: "Record or upload up to 15 seconds and let AI find your 5 most shareable moments.",
      maxLength: "15 SECONDS MAX.",
      record: "Start recording",
      upload: "Upload a video",
      private: "No sign-up · Deleted when your session ends",
      aiReady: "AI READY",
    },
    review: {
      eyebrow: "VIDEO READY",
      title: "Your moment is here.",
      description: "Now let’s find the parts worth replaying.",
      retry: "Record again",
      analyse: "Find my moments",
    },
    analysis: {
      eyebrow: "ANALYSIS IN PROGRESS",
      title: "Your video has a story to tell.",
      steps: ["Reading pace and composition", "Finding energy shifts", "Spotting memorable peaks", "Refining your selection"],
    },
    results: {
      eyebrow: "5 MOMENTS FOUND",
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
    momentsEmpty: {
      title: "No moments yet",
      description: "Record or upload a video from Home and AI will find your best moments.",
      cta: "Go to Home",
    },
    pro: {
      eyebrow: "MEVID PRO",
      title: "More quality, no limits.",
      freeLabel: "Free",
      proLabel: "Pro",
      popular: "POPULAR",
      perMonth: "/mo",
      freeFeatures: ["Up to 5 moments per video", "Standard JPEG downloads", "No account limits"],
      proFeatures: ["Priority AI analysis", "Higher-resolution exports", "Early access to new features"],
      monthly: "Monthly",
      yearly: "Yearly",
      monthlySub: "€6.99 billed every month",
      yearlySub: "€49 a year · €4.08/mo",
      discount: "-42%",
      ctaMonthly: "Start trial · €6.99/mo",
      ctaYearly: "Start trial · €49/yr",
      trial: "7 days free · cancel anytime",
      comingSoon: "Pro is coming soon — thanks for your interest!",
    },
    account: {
      eyebrow: "YOUR ACCOUNT",
      title: "Account",
      plan: "FREE",
      upgrade: "Upgrade to Pro",
      upgradeSub: "Priority analysis and higher-resolution exports",
    },
    footer: { left: "MADE FOR MOMENTS WORTH REPLAYING", right: "PRIVATE BY DESIGN" },
    errors: {
      notVideo: "Choose a video file to continue.",
      tooLong: "This clip is longer than 15 seconds. Trim it and try again.",
      unreadable: "We couldn’t read that video. Please try another file.",
    },
    desktopGate: {
      title: "Open this on your phone",
      description: "MeVid is designed for mobile — please visit this page from your phone’s browser to record and analyse your video.",
    },
    auth: {
      login: {
        eyebrow: "WELCOME BACK",
        title: "Sign in to MeVid.",
        description: "Your moments, saved and ready when you are.",
        emailLabel: "Email",
        passwordLabel: "Password",
        forgot: "Forgot password?",
        submit: "Sign in",
        noAccount: "New to MeVid?",
        createAccount: "Create an account",
        orDivider: "or continue with",
        google: "Continue with Google",
        apple: "Sign in with Apple",
      },
      register: {
        eyebrow: "CREATE ACCOUNT",
        title: "Join MeVid.",
        description: "One quick step before you start capturing moments.",
        emailLabel: "Email",
        passwordLabel: "Password",
        confirmLabel: "Confirm password",
        submit: "Create account",
        haveAccount: "Already have an account?",
        signIn: "Sign in",
        termsText: "I accept MeVid’s terms and privacy policy.",
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
        sent: "Check your inbox — we’ve sent a password reset link.",
      },
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
      account: { signedInAs: "Signed in as", signOut: "Sign out", profile: "Profile" },
      profile: {
        title: "Your profile",
        description: "Update how you appear across MeVid.",
        close: "Close",
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
    language: { label: "Idioma", english: "Inglés", spanish: "Español" },
    hero: {
      eyebrow: "TU EDITOR DE MOMENTOS",
      title: "Graba un momento.",
      titleAccent: "Quédate con lo mejor.",
      description: "Graba o sube hasta 15 segundos y deja que la IA encuentre tus 5 instantes más compartibles.",
      maxLength: "15 SEGUNDOS MÁX.",
      record: "Grabar ahora",
      upload: "Subir un vídeo",
      private: "Sin registro · Se borra al cerrar la sesión",
      aiReady: "IA LISTA",
    },
    review: {
      eyebrow: "VÍDEO LISTO",
      title: "Tu momento está aquí.",
      description: "Ahora vamos a encontrar las partes que merece la pena repetir.",
      retry: "Grabar de nuevo",
      analyse: "Encontrar mis momentos",
    },
    analysis: {
      eyebrow: "ANÁLISIS EN CURSO",
      title: "Tu vídeo tiene una historia que contar.",
      steps: ["Leyendo ritmo y composición", "Detectando cambios de energía", "Encontrando los picos memorables", "Afinando tu selección"],
    },
    results: {
      eyebrow: "5 MOMENTOS ENCONTRADOS",
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
    momentsEmpty: {
      title: "Aún no hay momentos",
      description: "Graba o sube un vídeo desde Inicio y la IA encontrará tus mejores momentos.",
      cta: "Ir a Inicio",
    },
    pro: {
      eyebrow: "MEVID PRO",
      title: "Más calidad, sin límites.",
      freeLabel: "Free",
      proLabel: "Pro",
      popular: "POPULAR",
      perMonth: "/mes",
      freeFeatures: ["Hasta 5 momentos por vídeo", "Descargas JPEG estándar", "Sin límites de cuenta"],
      proFeatures: ["Análisis de IA prioritario", "Exportación en mayor resolución", "Acceso anticipado a nuevas funciones"],
      monthly: "Mensual",
      yearly: "Anual",
      monthlySub: "6,99 € facturados cada mes",
      yearlySub: "49 € al año · 4,08 €/mes",
      discount: "-42%",
      ctaMonthly: "Empezar prueba · 6,99 €/mes",
      ctaYearly: "Empezar prueba · 49 €/año",
      trial: "7 días gratis · cancela cuando quieras",
      comingSoon: "Pro llega pronto — ¡gracias por tu interés!",
    },
    account: {
      eyebrow: "TU CUENTA",
      title: "Cuenta",
      plan: "FREE",
      upgrade: "Mejorar a Pro",
      upgradeSub: "Análisis prioritario y exportación en mayor resolución",
    },
    footer: { left: "HECHO PARA MOMENTOS QUE MERECEN REPETIRSE", right: "PRIVATE BY DESIGN" },
    errors: {
      notVideo: "Elige un archivo de vídeo para continuar.",
      tooLong: "Este clip dura más de 15 segundos. Recórtalo y vuelve a intentarlo.",
      unreadable: "No hemos podido leer ese vídeo. Prueba con otro archivo.",
    },
    desktopGate: {
      title: "Abrí esto desde tu teléfono",
      description: "MeVid está pensado para móvil — abrí esta página desde el navegador de tu teléfono para grabar y analizar tu vídeo.",
    },
    auth: {
      login: {
        eyebrow: "BIENVENIDO DE NUEVO",
        title: "Inicia sesión en MeVid.",
        description: "Tus momentos, guardados y listos cuando tú lo estés.",
        emailLabel: "Correo electrónico",
        passwordLabel: "Contraseña",
        forgot: "¿Olvidaste tu contraseña?",
        submit: "Iniciar sesión",
        noAccount: "¿Nuevo en MeVid?",
        createAccount: "Crear una cuenta",
        orDivider: "o continúa con",
        google: "Continuar con Google",
        apple: "Continuar con Apple",
      },
      register: {
        eyebrow: "CREAR CUENTA",
        title: "Únete a MeVid.",
        description: "Un paso rápido antes de empezar a capturar momentos.",
        emailLabel: "Correo electrónico",
        passwordLabel: "Contraseña",
        confirmLabel: "Confirmar contraseña",
        submit: "Crear cuenta",
        haveAccount: "¿Ya tienes una cuenta?",
        signIn: "Inicia sesión",
        termsText: "Acepto las condiciones y la política de privacidad de MeVid.",
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
        sent: "Revisa tu correo — te hemos enviado un enlace para restablecer tu contraseña.",
      },
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
      account: { signedInAs: "Sesión iniciada como", signOut: "Cerrar sesión", profile: "Perfil" },
      profile: {
        title: "Tu perfil",
        description: "Actualiza cómo apareces en MeVid.",
        close: "Cerrar",
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
