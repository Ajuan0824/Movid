import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mevid.app',
  appName: 'MeVid',
  webDir: 'public',
  server: {
    // Para pruebas en red local, apuntá a la IP local del servidor Next.js
    // (debe ser la IP LAN de la PC que corre `npm run dev`/`npm start`, no localhost,
    // ya que localhost dentro del WebView del teléfono se referiría al propio teléfono).
    // Cuando el usuario despliegue en Vercel, cambiar esta URL por la de producción
    // (https, y sacar cleartext: true ya que no hará falta tráfico sin cifrar).
    url: 'http://192.168.1.50:3000',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic'
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['apple.com', 'google.com']
    }
  }
};

export default config;
