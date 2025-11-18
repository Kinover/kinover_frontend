// 예: src/hooks/onboarding/useOnboardingPager.js

import {useState, useCallback} from 'react';

export function useOnboardingPager(screenWidth) {
  const [currentPage, setCurrentPage] = useState(0);

  const handleScroll = useCallback(
    event => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / screenWidth);
      setCurrentPage(index);
    },
    [screenWidth],
  );

  return {currentPage, handleScroll};
}
