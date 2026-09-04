import type { Metadata } from "next";
import { Bullets, LanguageDivider, LegalHeader, Mail, Section } from "../legal-ui";
import { PLAN_LIMITS } from "../../../lib/mevid/plan";

export const metadata: Metadata = {
  title: "Condiciones de uso · MoVid",
  description: "Condiciones del servicio MoVid, incluida la suscripción Pro.",
};

const free = PLAN_LIMITS.free;
const pro = PLAN_LIMITS.pro;

export default function TermsPage() {
  return (
    <>
      <LegalHeader
        title="Condiciones de uso"
        subtitle="MoVid — aplicación de análisis de vídeo con IA"
      />

      <Section title="El servicio">
        <p>
          MoVid analiza un vídeo corto con inteligencia artificial y selecciona los instantes más
          destacados, que puedes descargar como imágenes. Al usar la app aceptas estas condiciones.
        </p>
      </Section>

      <Section title="Tu cuenta">
        <Bullets
          items={[
            "Necesitas una cuenta para usar la app. Eres responsable de mantener tus credenciales seguras.",
            "Debes tener al menos 13 años.",
            "Puedes eliminar tu cuenta en cualquier momento desde Cuenta → Eliminar cuenta. El borrado es permanente.",
          ]}
        />
      </Section>

      <Section title="Tu contenido">
        <Bullets
          items={[
            "Los vídeos que subes siguen siendo tuyos. No reclamamos ningún derecho sobre ellos.",
            "Nos concedes únicamente el permiso técnico necesario para almacenarlos y procesarlos con el fin de darte el resultado del análisis.",
            "Te comprometes a subir solo material sobre el que tengas derechos y que no sea ilegal ni vulnere derechos de terceros.",
            "Los vídeos y sus momentos se eliminan automáticamente a los 30 días.",
          ]}
        />
      </Section>

      <Section title="Planes y suscripción Pro">
        <Bullets
          items={[
            <>El plan <strong>Free</strong> incluye {free.stars} análisis por semana, hasta {free.moments} momentos por vídeo y clips de hasta {free.videoSeconds} segundos.</>,
            <>El plan <strong>Pro</strong> incluye {pro.stars} análisis por semana, hasta {pro.moments} momentos por vídeo y clips de hasta {pro.videoSeconds} segundos.</>,
            <><strong>Precio:</strong> 3,99 €/mes, con un periodo de prueba gratuito de 3 días. El precio definitivo, en tu moneda, se muestra siempre en la pantalla de compra antes de confirmar.</>,
            <><strong>Renovación automática:</strong> la suscripción se renueva cada mes salvo que la canceles al menos 24 horas antes del final del periodo en curso. El cargo se hace en tu cuenta de Apple.</>,
            <><strong>Cancelar:</strong> desde Ajustes de tu iPhone → tu nombre → Suscripciones. Si cancelas durante la prueba gratuita no se cobra nada.</>,
            "El pago lo gestiona Apple. Las devoluciones se rigen por las condiciones de Apple Media Services.",
          ]}
        />
      </Section>

      <Section title="Uso aceptable">
        <p>No puedes usar la app para:</p>
        <Bullets
          items={[
            "subir contenido ilegal, violento, sexual con menores, o que infrinja derechos de terceros;",
            "intentar acceder a cuentas o datos de otras personas;",
            "eludir los límites de tu plan o interferir en el funcionamiento del servicio.",
          ]}
        />
        <p>Podemos suspender una cuenta que incumpla estas condiciones.</p>
      </Section>

      <Section title="Limitación de responsabilidad">
        <p>
          La app se ofrece &laquo;tal cual&raquo;. El análisis lo realiza un modelo de inteligencia
          artificial y su selección de momentos es orientativa: no garantizamos un resultado concreto ni
          que el servicio esté siempre disponible o libre de errores. No respondemos de la pérdida de
          vídeos, que en todo caso se eliminan a los 30 días — guarda una copia de lo que te importe.
        </p>
      </Section>

      <Section title="Cambios">
        <p>
          Podemos actualizar estas condiciones. Si el cambio es relevante lo avisaremos en la app.
          Seguir usándola después implica aceptar la versión actualizada.
        </p>
      </Section>

      <Section title="Contacto">
        <p>Para cualquier duda sobre estas condiciones: <Mail />.</p>
      </Section>

      <LanguageDivider label="English" />

      <Section title="The service">
        <p>
          MoVid analyses a short video with AI and picks out its most striking instants, which you can
          download as images. By using the app you accept these terms.
        </p>
      </Section>

      <Section title="Your account">
        <Bullets
          items={[
            "An account is required. You are responsible for keeping your credentials safe.",
            "You must be at least 13 years old.",
            "You can delete your account at any time under Account → Delete account. Deletion is permanent.",
          ]}
        />
      </Section>

      <Section title="Your content">
        <Bullets
          items={[
            "The videos you upload remain yours. We claim no rights over them.",
            "You grant us only the technical permission needed to store and process them in order to return your analysis.",
            "You agree to upload only material you have the rights to, that is lawful and does not infringe anyone else's rights.",
            "Videos and their moments are deleted automatically after 30 days.",
          ]}
        />
      </Section>

      <Section title="Plans and the Pro subscription">
        <Bullets
          items={[
            <>The <strong>Free</strong> plan includes {free.stars} analyses a week, up to {free.moments} moments per video and clips of up to {free.videoSeconds} seconds.</>,
            <>The <strong>Pro</strong> plan includes {pro.stars} analyses a week, up to {pro.moments} moments per video and clips of up to {pro.videoSeconds} seconds.</>,
            <><strong>Price:</strong> €3.99/month, with a 3-day free trial. The final price in your currency is always shown on the purchase screen before you confirm.</>,
            <><strong>Auto-renewal:</strong> the subscription renews monthly unless cancelled at least 24 hours before the end of the current period. It is charged to your Apple account.</>,
            <><strong>Cancelling:</strong> in your iPhone Settings → your name → Subscriptions. Cancelling during the free trial costs nothing.</>,
            "Payment is handled by Apple. Refunds follow the Apple Media Services terms.",
          ]}
        />
      </Section>

      <Section title="Acceptable use">
        <p>You may not use the app to:</p>
        <Bullets
          items={[
            "upload unlawful or violent content, sexual content involving minors, or anything infringing third-party rights;",
            "attempt to access other people's accounts or data;",
            "circumvent your plan's limits or interfere with the running of the service.",
          ]}
        />
        <p>We may suspend an account that breaks these terms.</p>
      </Section>

      <Section title="Limitation of liability">
        <p>
          The app is provided &laquo;as is&raquo;. The analysis is produced by an AI model and its choice
          of moments is indicative only: we do not guarantee any particular result, nor that the service
          will always be available or error-free. We are not liable for lost videos, which are deleted
          after 30 days in any case — keep your own copy of anything that matters.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We may update these terms. Material changes will be announced in the app. Continuing to use it
          afterwards means accepting the updated version.
        </p>
      </Section>

      <Section title="Contact">
        <p>Any questions about these terms: <Mail />.</p>
      </Section>
    </>
  );
}
