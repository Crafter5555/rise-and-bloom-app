import { useMobile } from './useMobile';

export const useAppAssets = () => {
  const { isNative } = useMobile();

  const getAppIcon = (size: number = 512) => {
    // Return the appropriate app icon based on size
    if (size >= 1024) return '/src/assets/app-icon-1024.png';
    if (size >= 512) return '/src/assets/app-icon-512.png';
    return '/src/assets/app-icon-192.png';
  };

  const getSplashScreen = () => {
    return '/src/assets/splash-screen.png';
  };

  return {
    getAppIcon,
    getSplashScreen,
    isNative
  };
};