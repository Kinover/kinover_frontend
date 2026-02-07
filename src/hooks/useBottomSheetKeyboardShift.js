// src/hooks/useBottomSheetKeyboardShift.js
import {useEffect, useRef, useCallback} from 'react';
import {Animated, Keyboard, Platform} from 'react-native';

const SAFE_GAP_DEFAULT = 12;

export function useBottomSheetKeyboardShift({
  windowH,
  modalRef,
  footerPx = 0, // 실측된 footer 높이(px)
  safeGap = SAFE_GAP_DEFAULT,
}) {
  const shiftAnim = useRef(new Animated.Value(0)).current;
  const keyboardHeightRef = useRef(0);
  const tapToResetRef = useRef(false);

  useEffect(() => {
    const onShow = e => {
      keyboardHeightRef.current = e?.endCoordinates?.height || 0;
      modalRef?.current?.snapToIndex?.(1);
    };

    const onHide = () => {
      keyboardHeightRef.current = 0;

      Animated.timing(shiftAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }).start(() => {
        tapToResetRef.current = false;
      });

      modalRef?.current?.snapToIndex?.(0);
    };

    const subShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      onShow,
    );
    const subHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      onHide,
    );

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [modalRef, shiftAnim]);

  const ensureVisible = useCallback(
    inputRef => {
      if (tapToResetRef.current) return;
      const kbH = keyboardHeightRef.current || 0;

      requestAnimationFrame(() => {
        if (tapToResetRef.current) return;

        const node = inputRef?.current;
        if (!node || typeof node.measureInWindow !== 'function') return;

        node.measureInWindow((x, y, w, h) => {
          if (tapToResetRef.current) return;

          const inputBottomY = y + h;
          const baseLimit = kbH ? windowH - kbH : windowH;
          const limitY = baseLimit - safeGap - Math.max(footerPx || 0, 0);

          if (inputBottomY <= limitY) {
            Animated.timing(shiftAnim, {
              toValue: 0,
              duration: 140,
              useNativeDriver: true,
            }).start();
            return;
          }

          const diff = inputBottomY - limitY;

          Animated.timing(shiftAnim, {
            toValue: -diff,
            duration: 180,
            useNativeDriver: true,
          }).start();
        });
      });
    },
    [footerPx, safeGap, shiftAnim, windowH],
  );

  const dismissKeyboardAndReset = useCallback(() => {
    tapToResetRef.current = true;
    Keyboard.dismiss();

    Animated.timing(shiftAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      tapToResetRef.current = false;
    });

    modalRef?.current?.snapToIndex?.(0);
  }, [modalRef, shiftAnim]);

  return {
    shiftAnim,
    ensureVisible,
    dismissKeyboardAndReset,
    keyboardHeightRef,
    tapToResetRef,
  };
}
