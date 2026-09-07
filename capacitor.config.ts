import type { CapacitorConfig } from '@capacitor/cli';

const target = process.env.CAPACITOR_APP_TARGET || process.env.VITE_APP_TARGET || 'customer';
const isTechnician = target.toLowerCase() === 'technician';

const config: CapacitorConfig = {
  appId: isTechnician ? 'com.vertex.technician' : 'com.vertex.customer',
  appName: isTechnician ? 'VERTEX Technician' : 'VERTEX Customer',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
  plugins: {
    Preferences: {
      group: isTechnician ? 'VERTEXTechnicianApp' : 'VERTEXCustomerApp',
    },
    App: {},
  },
};

export default config;
