import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export type ConnectionType = 'wifi' | 'cellular' | 'none' | 'unknown';

export interface NetworkStatus {
  isOnline: boolean;
  connectionType: ConnectionType;
  isSlowConnection: boolean;
  isFastConnection: boolean;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    isSlowConnection: false,
    isFastConnection: false,
  });

  useEffect(() => {
    const updateNetworkStatus = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const status = await Network.getStatus();

          const connectionType = status.connectionType as ConnectionType;
          const isSlowConnection = connectionType === 'cellular' || connectionType === 'none';
          const isFastConnection = connectionType === 'wifi';

          setNetworkStatus({
            isOnline: status.connected,
            connectionType,
            isSlowConnection,
            isFastConnection,
          });
        } catch (error) {
          console.error('Failed to get network status:', error);
        }
      } else {
        setNetworkStatus({
          isOnline: navigator.onLine,
          connectionType: 'unknown',
          isSlowConnection: false,
          isFastConnection: false,
        });
      }
    };

    updateNetworkStatus();

    if (Capacitor.isNativePlatform()) {
      const listener = Network.addListener('networkStatusChange', (status) => {
        const connectionType = status.connectionType as ConnectionType;
        const isSlowConnection = connectionType === 'cellular' || connectionType === 'none';
        const isFastConnection = connectionType === 'wifi';

        setNetworkStatus({
          isOnline: status.connected,
          connectionType,
          isSlowConnection,
          isFastConnection,
        });
      });

      return () => {
        listener.then((l) => l.remove());
      };
    } else {
      const handleOnline = () => updateNetworkStatus();
      const handleOffline = () => updateNetworkStatus();

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return networkStatus;
};
