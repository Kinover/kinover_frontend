// src/hooks/notification/useLastCheckedDate.js
import {useMemo} from 'react';

export const useLastCheckedDate = lastCheckedAt => {
  return useMemo(
    () => (lastCheckedAt ? new Date(lastCheckedAt) : null),
    [lastCheckedAt],
  );
};
