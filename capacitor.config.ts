import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.develzy.anwarulhidayah',
  appName: 'e-AnwarulHidayah',
  webDir: 'public',
  server: {
    url: 'https://anwarulhidayah.develzy.my.id/',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#064e3b",
      androidScaleType: "CENTER_CROP",
      showSpinner: false
    }
  }
};

export default config;
