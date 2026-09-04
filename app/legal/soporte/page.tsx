import type { Metadata } from "next";
import { Bullets, LegalHeader, Mail, Section } from "../legal-ui";
import { PLAN_LIMITS } from "../../../lib/mevid/plan";

export const metadata: Metadata = {
  title: "Soporte · MoVid",
  description: "Ayuda, preguntas frecuentes y contacto de MoVid.",
};

const free = PLAN_LIMITS.free;
const pro = PLAN_LIMITS.pro;

/**
 * The Support URL given to App Store Connect. Review opens it, so it has to be
 * publicly reachable and actually answer the questions people write in about —
 * a page with only an email address reads as a placeholder.
 */
export default function SupportPage() {
  return (
    <>
      <LegalHeader title="Soporte" subtitle="Ayuda y contacto de MoVid" />

      <Section title="Contacto">
        <p>
          ¿Algo no funciona o tienes una duda? Escríbenos a <Mail /> y te
          respondemos lo antes posible. Cuéntanos qué modelo de iPhone usas y qué estabas
          haciendo — ayuda muchísimo a dar con el problema.
        </p>
      </Section>

      <Section title="Cómo funciona MoVid">
        <Bullets
          items={[
            "Graba un vídeo corto desde la app o sube uno que ya tengas.",
            "Si el clip es más largo del límite de tu plan, recórtalo con el editor antes de analizar.",
            "La IA revisa el clip y selecciona los instantes más expresivos.",
            "Descarga los momentos como imágenes, sueltas o todas a la vez.",
          ]}
        />
      </Section>

      <Section title="Planes">
        <Bullets
          items={[
            <><strong>Free</strong>: {free.stars} análisis por semana, hasta {free.moments} momentos por vídeo y clips de hasta {free.videoSeconds} segundos.</>,
            <><strong>Pro</strong>: {pro.stars} análisis por semana, hasta {pro.moments} momentos por vídeo y clips de hasta {pro.videoSeconds} segundos.</>,
            "Las estrellas se recargan automáticamente al principio de cada semana.",
          ]}
        />
      </Section>

      <Section title="Preguntas frecuentes">
        <p><strong>¿Dónde se guardan mis vídeos?</strong><br />
          En tu cuenta, en privado. Nadie más puede verlos y se borran automáticamente a los 30 días.
          Descarga lo que quieras conservar.</p>

        <p><strong>¿Cómo cancelo la suscripción?</strong><br />
          Desde los Ajustes de tu iPhone → tu nombre → Suscripciones → MoVid. Si cancelas durante los
          3 días de prueba no se cobra nada.</p>

        <p><strong>He pagado pero sigo en Free.</strong><br />
          Abre la pestaña Pro y pulsa «Restaurar compras». Si no se soluciona, escríbenos indicando el
          correo de tu cuenta.</p>

        <p><strong>La app no encuentra buenos momentos.</strong><br />
          Funciona mejor con clips bien iluminados y con movimiento o expresiones claras. Un vídeo muy
          oscuro, borroso o estático le da poco material.</p>

        <p><strong>¿Cómo borro mi cuenta?</strong><br />
          En la app, pestaña Cuenta → Eliminar cuenta. Se borran tu perfil, tus vídeos y tus momentos
          de forma permanente.</p>
      </Section>

      <Section title="Documentos">
        <p>
          <a href="/legal/terminos" className="font-semibold text-[#7657dd] underline underline-offset-2 dark:text-[#c4b3ff]">Condiciones de uso</a>
          {" · "}
          <a href="/legal/privacidad" className="font-semibold text-[#7657dd] underline underline-offset-2 dark:text-[#c4b3ff]">Política de privacidad</a>
        </p>
      </Section>
    </>
  );
}
