import type { Metadata } from "next";
import { Bullets, LanguageDivider, LegalHeader, Mail, Section } from "../legal-ui";

export const metadata: Metadata = {
  title: "Política de privacidad · MoVid",
  description: "Qué datos trata MoVid, con quién los comparte y cómo eliminarlos.",
};

export default function PrivacyPage() {
  return (
    <>
      <LegalHeader
        title="Política de privacidad"
        subtitle="MoVid — aplicación de análisis de vídeo con IA"
      />

      <Section title="Quién trata tus datos">
        <p>
          MoVid (&laquo;la app&raquo;) trata los datos descritos aquí como responsable del tratamiento.
          Para cualquier cuestión relacionada con privacidad, escribe a <Mail />.
        </p>
      </Section>

      <Section title="Qué datos recogemos">
        <Bullets
          items={[
            <><strong>Datos de cuenta</strong>: tu correo electrónico y, si lo indicas, tu nombre y tu foto de perfil. Si accedes con Google o con Apple, recibimos el correo y el nombre que esos servicios nos comunican.</>,
            <><strong>Contenido que subes</strong>: los vídeos que grabas o subes y los fotogramas que la app extrae de ellos.</>,
            <><strong>Datos de uso del plan</strong>: cuántos análisis has consumido en la semana en curso y si tu cuenta es Free o Pro.</>,
            <><strong>Registros técnicos</strong>: errores del servidor, sin contenido de tus vídeos.</>,
          ]}
        />
        <p>No usamos publicidad, no hacemos perfilado y no vendemos tus datos a nadie.</p>
      </Section>

      <Section title="Para qué los usamos">
        <Bullets
          items={[
            "Crear y mantener tu cuenta y permitirte iniciar sesión.",
            "Analizar tus vídeos y devolverte los mejores momentos, que es la función principal de la app.",
            "Guardar tus resultados para que puedas volver a ellos y descargarlos.",
            "Controlar el número de análisis semanales de tu plan y gestionar tu suscripción.",
          ]}
        />
      </Section>

      <Section title="Con quién los compartimos">
        <p>Solo con los proveedores necesarios para que la app funcione:</p>
        <Bullets
          items={[
            <><strong>Google Firebase</strong> (autenticación, base de datos y almacenamiento): guarda tu cuenta, tus vídeos y tus momentos.</>,
            <><strong>OpenAI</strong>: recibe los fotogramas extraídos del vídeo que estás analizando, para identificar los mejores instantes. Se envían solo en el momento del análisis.</>,
            <><strong>Vercel</strong>: alojamiento de la aplicación web que la app muestra.</>,
            <><strong>RevenueCat</strong> y <strong>Apple</strong>: gestión de la suscripción. El pago lo procesa Apple; nosotros nunca vemos los datos de tu tarjeta.</>,
          ]}
        />
      </Section>

      <Section title="Cuánto tiempo los conservamos">
        <Bullets
          items={[
            <><strong>Vídeos y momentos: 30 días.</strong> Pasado ese plazo se eliminan automáticamente, tanto desde la app como mediante una regla del propio almacenamiento.</>,
            "Datos de cuenta: mientras tu cuenta exista.",
          ]}
        />
      </Section>

      <Section title="Tus derechos">
        <p>
          Puedes acceder a tus datos, rectificarlos, eliminarlos, oponerte al tratamiento, limitarlo y
          solicitar su portabilidad.
        </p>
        <p>
          <strong>Eliminar tu cuenta:</strong> desde la propia app, en la pestaña <em>Cuenta</em> →
          <em> Eliminar cuenta</em>. Se borran de forma permanente tu perfil, tus vídeos, tus momentos y
          tus datos de plan. Es irreversible.
        </p>
        <p>
          También puedes ejercer cualquiera de estos derechos escribiendo a <Mail />, y presentar una
          reclamación ante la autoridad de control de tu país si consideras que no los hemos atendido.
        </p>
      </Section>

      <Section title="Menores">
        <p>La app no está dirigida a menores de 13 años y no recogemos datos de forma consciente de ellos.</p>
      </Section>

      <Section title="Cambios">
        <p>
          Si modificamos esta política actualizaremos la fecha de arriba. Los cambios relevantes se
          avisarán dentro de la app.
        </p>
      </Section>

      <LanguageDivider label="English" />

      <Section title="Who processes your data">
        <p>
          MoVid (&laquo;the app&raquo;) is the controller of the data described here. For any privacy
          matter, write to <Mail />.
        </p>
      </Section>

      <Section title="What we collect">
        <Bullets
          items={[
            <><strong>Account data</strong>: your email address and, if you provide them, your name and profile picture. If you sign in with Google or Apple, we receive the email and name those services pass on.</>,
            <><strong>Content you upload</strong>: the videos you record or upload and the still frames the app extracts from them.</>,
            <><strong>Plan usage</strong>: how many analyses you have used this week and whether your account is Free or Pro.</>,
            <><strong>Technical logs</strong>: server errors, with no video content in them.</>,
          ]}
        />
        <p>We run no advertising, do no profiling and sell your data to no one.</p>
      </Section>

      <Section title="Why we use it">
        <Bullets
          items={[
            "To create and maintain your account and let you sign in.",
            "To analyse your videos and return your best moments — the app's core function.",
            "To store your results so you can come back to them and download them.",
            "To enforce your plan's weekly analysis allowance and manage your subscription.",
          ]}
        />
      </Section>

      <Section title="Who we share it with">
        <p>Only the providers the app needs to work:</p>
        <Bullets
          items={[
            <><strong>Google Firebase</strong> (authentication, database, storage): holds your account, videos and moments.</>,
            <><strong>OpenAI</strong>: receives the frames extracted from the video you are analysing, in order to pick the best instants. They are sent only at the moment of analysis.</>,
            <><strong>Vercel</strong>: hosting for the web application the app displays.</>,
            <><strong>RevenueCat</strong> and <strong>Apple</strong>: subscription management. Payment is processed by Apple; we never see your card details.</>,
          ]}
        />
      </Section>

      <Section title="How long we keep it">
        <Bullets
          items={[
            <><strong>Videos and moments: 30 days.</strong> After that they are deleted automatically, both by the app and by a storage lifecycle rule.</>,
            "Account data: for as long as your account exists.",
          ]}
        />
      </Section>

      <Section title="Your rights">
        <p>
          You may access, correct, delete, object to the processing of, restrict, and request the
          portability of your data.
        </p>
        <p>
          <strong>Deleting your account:</strong> inside the app, under <em>Account</em> →
          <em> Delete account</em>. Your profile, videos, moments and plan data are permanently erased.
          This cannot be undone.
        </p>
        <p>
          You can also exercise any of these rights by writing to <Mail />, and lodge a complaint with
          your country&apos;s supervisory authority if you believe we have not honoured them.
        </p>
      </Section>

      <Section title="Children">
        <p>The app is not directed at children under 13 and we do not knowingly collect their data.</p>
      </Section>

      <Section title="Changes">
        <p>
          If we change this policy we will update the date above. Material changes will be announced in
          the app.
        </p>
      </Section>
    </>
  );
}
