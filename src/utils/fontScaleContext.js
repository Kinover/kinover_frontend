import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {getFontScale, setFontScale} from './storage';

const FontScaleContext = createContext({
  fontScale: 1,
  setFontScaleValue: async (_scale) => {},
  isReady: false,
});

export function FontScaleProvider({children}) {
  const [fontScale, setFontScaleState] = useState(1);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const saved = await getFontScale(); // 1 or 1.15
      setFontScaleState(saved);
      setIsReady(true);
    };
    init();
  }, []);

  const setFontScaleValue = useCallback(async (scale) => {
    const n = Number(scale);
    const clamped = Number.isNaN(n) ? 1 : Math.max(1, Math.min(n, 1.3));
    setFontScaleState(clamped);     // ✅ 앱 전체 리렌더 트리거
    await setFontScale(clamped);    // ✅ 저장
  }, []);

  return (
    <FontScaleContext.Provider value={{fontScale, setFontScaleValue, isReady}}>
      {children}
    </FontScaleContext.Provider>
  );
}

export function useFontScale() {
  return useContext(FontScaleContext);
}
