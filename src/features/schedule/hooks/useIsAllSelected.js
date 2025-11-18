// src/hooks/schedule/useIsAllSelected.js
import {useMemo} from 'react';

export const useIsAllSelected = selectedUserId => {
  return useMemo(() => !selectedUserId, [selectedUserId]);
};
