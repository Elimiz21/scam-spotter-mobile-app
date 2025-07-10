import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.7bf225d2a56b4cd4bccd8bb02c5d4c42',
  appName: 'scam-spotter-mobile-app',
  webDir: 'dist',
  server: {
    url: 'https://7bf225d2-a56b-4cd4-bccd-8bb02c5d4c42.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  bundledWebRuntime: false
};

export default config;