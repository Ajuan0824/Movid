import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mevid.app',
  appName: 'MoVid',
  webDir: 'public',
  server: {
    // Por defecto la app (simulador y dispositivo) carga la web de producción.
    // Para desarrollo con live-reload, arrancar `npm run dev` y sincronizar con:
    //   CAP_SERVER_URL=http://localhost:3000 npx cap sync ios
    // Para un iPhone físico en la misma WiFi usar la IP LAN del Mac:
    //   CAP_SERVER_URL=http://192.168.68.54:3000 npx cap sync ios
    url: process.env.CAP_SERVER_URL ?? 'https://movid-iota.vercel.app',
    // cleartext solo hace falta para las URLs http de desarrollo.
    cleartext: (process.env.CAP_SERVER_URL ?? '').startsWith('http://')
  },
  ios: {
    // 'never': el WebView va a pantalla completa por debajo de la barra de
    // estado y del indicador de inicio. El espaciado de las zonas seguras lo
    // pone el CSS con env(safe-area-inset-*) (viewport-fit=cover +
    // StatusBar.setOverlaysWebView). Con 'automatic' el inset se aplicaba dos
    // veces y dejaba un hueco arriba.
    contentInset: 'never'
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['apple.com', 'google.com']
    }
  }
};

export default config;
