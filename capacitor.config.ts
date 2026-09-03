import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mevid.app',
  appName: 'Movid',
  webDir: 'public',
  server: {
    // El simulador de iOS comparte la red del Mac, así que `localhost` apunta al
    // `npm run dev` que corre en el propio Mac. Para un iPhone físico en la misma
    // red WiFi hay que usar la IP LAN del Mac (ej. CAP_SERVER_URL=http://192.168.68.54:3000).
    // Al desplegar en Vercel: poner aquí la URL de producción (https) y quitar cleartext.
    url: process.env.CAP_SERVER_URL ?? 'http://localhost:3000',
    cleartext: true
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
