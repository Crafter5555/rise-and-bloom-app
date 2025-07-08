import { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Keyboard } from "@capacitor/keyboard";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

export const useMobileOptimizations = () => {
  useEffect(() => {
    const setupMobileOptimizations = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        // Configure status bar
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: "#3B82F6" });

        // Handle keyboard events for better UX
        const keyboardWillShow = await Keyboard.addListener('keyboardWillShow', (info) => {
          document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
        });

        const keyboardWillHide = await Keyboard.addListener('keyboardWillHide', () => {
          document.body.style.setProperty('--keyboard-height', '0px');
        });

        return () => {
          keyboardWillShow.remove();
          keyboardWillHide.remove();
        };
      } catch (error) {
        console.error('Error setting up mobile optimizations:', error);
      }
    };

    setupMobileOptimizations();
  }, []);

  // Haptic feedback utility
  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style });
      } catch (error) {
        console.error('Haptic feedback failed:', error);
      }
    }
  };

  // Enhanced touch handling for better mobile UX
  const handleMobileClick = (callback: () => void, haptic = true) => {
    return async () => {
      if (haptic) {
        await triggerHaptic();
      }
      callback();
    };
  };

  return {
    triggerHaptic,
    handleMobileClick
  };
};