import { useEffect, useState } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

interface KeyboardInfo {
  isOpen: boolean;
  height: number;
}

export const useKeyboardAware = (adjustContent = true) => {
  const [keyboardInfo, setKeyboardInfo] = useState<KeyboardInfo>({
    isOpen: false,
    height: 0,
  });

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listeners: (() => void)[] = [];

    const setupKeyboardListeners = async () => {
      const showListener = await Keyboard.addListener('keyboardWillShow', (info) => {
        setKeyboardInfo({
          isOpen: true,
          height: info.keyboardHeight,
        });

        if (adjustContent) {
          document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);

          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && activeElement.scrollIntoView) {
            setTimeout(() => {
              activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }
        }
      });

      const hideListener = await Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardInfo({
          isOpen: false,
          height: 0,
        });

        if (adjustContent) {
          document.body.style.setProperty('--keyboard-height', '0px');
        }
      });

      listeners = [
        () => showListener.remove(),
        () => hideListener.remove(),
      ];
    };

    setupKeyboardListeners();

    return () => {
      listeners.forEach((remove) => remove());
    };
  }, [adjustContent]);

  const dismissKeyboard = async () => {
    if (Capacitor.isNativePlatform()) {
      await Keyboard.hide();
    }
  };

  return {
    ...keyboardInfo,
    dismissKeyboard,
  };
};
