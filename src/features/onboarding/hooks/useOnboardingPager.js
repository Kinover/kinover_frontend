// src/features/onboarding/hooks/useOnboardingPager.js
import {useState, useCallback} from 'react';

/**
 * 버벅임 핵심 원인 제거:
 * - onScroll(초당 수십번)에서 setState 하지 않는다
 * - 스크롤이 "멈춘 뒤"에만 currentPage를 갱신한다
 */
export function useOnboardingPager(screenWidth) {
  const [currentPage, setCurrentPage] = useState(0);

  const handleMomentumEnd = useCallback(
    event => {
      const offsetX = event?.nativeEvent?.contentOffset?.x ?? 0;
      const index = Math.round(offsetX / screenWidth);

 // 불필요한 setState 방지
      setCurrentPage(prev => (prev === index ? prev : index));
    },
    [screenWidth],
  );

  return {currentPage, handleMomentumEnd};
}
