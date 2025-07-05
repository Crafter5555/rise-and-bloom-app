
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovable.riseandbloom',
  appName: 'rise-and-bloom-app',
  webDir: 'dist',
  server: {
    url: 'https://3e42957d-7854-4034-9eed-3197e25f27e3.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
