import {useState, useEffect, useRef} from 'react';

export function useDelayedLoading(isLoading, delay = 2000) {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isLoading) {
      timerRef.current = setTimeout(() => setShowSkeleton(true), delay);
    } else {
      clearTimeout(timerRef.current);
      setShowSkeleton(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [isLoading, delay]);

  return showSkeleton;
}
