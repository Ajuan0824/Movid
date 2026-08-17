import type { Locale } from "./types";

export type AppCopy = {
  language: { label: string; english: string; spanish: string };
  hero: { eyebrow: string; title: string; titleAccent: string; description: string; maxLength: string; record: string; upload: string; private: string };
  recording: { cancel: string; active: string; stop: string; helper: string };
  review: { eyebrow: string; title: string; description: string; retry: string; analyse: string };
  analysis: { eyebrow: string; title: string; steps: string[] };
  results: { eyebrow: string; title: string; newVideo: string; moments: string; tipStart: string; tipEnd: string; export: string; visualsGenerated: string; visualsPlaceholder: string; topFive: string; moment: string };
  footer: { left: string; right: string };
  errors: { unsupported: string; camera: string; notVideo: string; tooLong: string; unreadable: string };
  desktopGate: { title: string; description: string };
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
    },
    recording: { cancel: "Cancel", active: "RECORDING", stop: "Stop recording", helper: "Tap the button to finish early. It will stop automatically at 15 seconds." },
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
      export: "Export selection",
      visualsGenerated: "AI-generated visual cards for every moment.",
      visualsPlaceholder: "Add an API key to generate AI visual cards.",
      topFive: "TOP 5",
      moment: "MOMENT",
    },
    footer: { left: "MADE FOR MOMENTS WORTH REPLAYING", right: "PRIVATE BY DESIGN" },
    errors: {
      unsupported: "Your browser can’t record from the camera. Try uploading a video instead.",
      camera: "We couldn’t open your camera.",
      notVideo: "Choose a video file to continue.",
      tooLong: "This clip is longer than 15 seconds. Trim it and try again.",
      unreadable: "We couldn’t read that video. Please try another file.",
    },
    desktopGate: {
      title: "Open this on your phone",
      description: "MeVid is designed for mobile — please visit this page from your phone’s browser to record and analyse your video.",
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
    },
    recording: { cancel: "Cancelar", active: "GRABANDO", stop: "Detener grabación", helper: "Toca el botón para terminar antes. Se detendrá automáticamente a los 15 s." },
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
      export: "Exportar selección",
      visualsGenerated: "Tarjetas visuales generadas con IA para cada momento.",
      visualsPlaceholder: "Añade una clave de API para generar las tarjetas con IA.",
      topFive: "TOP 5",
      moment: "MOMENTO",
    },
    footer: { left: "HECHO PARA MOMENTOS QUE MERECEN REPETIRSE", right: "PRIVATE BY DESIGN" },
    errors: {
      unsupported: "Tu navegador no permite grabar desde cámara. Prueba a subir un vídeo.",
      camera: "No hemos podido abrir tu cámara.",
      notVideo: "Elige un archivo de vídeo para continuar.",
      tooLong: "Este clip dura más de 15 segundos. Recórtalo y vuelve a intentarlo.",
      unreadable: "No hemos podido leer ese vídeo. Prueba con otro archivo.",
    },
    desktopGate: {
      title: "Abrí esto desde tu teléfono",
      description: "MeVid está pensado para móvil — abrí esta página desde el navegador de tu teléfono para grabar y analizar tu vídeo.",
    },
  },
};

export function getCopy(locale: Locale) {
  return dictionary[locale];
}
