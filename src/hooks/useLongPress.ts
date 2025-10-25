import { useRef, useCallback } from 'react';
import { useMobile } from './useMobile';
import { ImpactStyle } from '@capacitor/haptics';

interface LongPressOptions {
  delay?: number;
  shouldPreventDefault?: boolean;
  onStart?: () => void;
  onCancel?: () => void;
  hapticFeedback?: boolean;
}

export const useLongPress = (
  onLongPress: () => void,
  options: LongPressOptions = {}
) => {
  const {
    delay = 500,
    shouldPreventDefault = true,
    onStart,
    onCancel,
    hapticFeedback = true,
  } = options;

  const { hapticFeedback: triggerHaptic } = useMobile();
  const timeout = useRef<NodeJS.Timeout>();
  const target = useRef<EventTarget>();

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      if (shouldPreventDefault) {
        event.preventDefault();
      }

      onStart?.();
      target.current = event.target;

      timeout.current = setTimeout(async () => {
        if (hapticFeedback) {
          await triggerHaptic(ImpactStyle.Medium);
        }
        onLongPress();
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault, onStart, hapticFeedback, triggerHaptic]
  );

  const clear = useCallback(
    (event?: React.TouchEvent | React.MouseEvent, shouldTriggerCancel = true) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }

      if (shouldTriggerCancel && event?.target === target.current) {
        onCancel?.();
      }

      target.current = undefined;
    },
    [onCancel]
  );

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchStart: start,
    onTouchEnd: clear,
  };
};
