// src/hooks/notification/useNotificationState.js
import {useSelector} from 'react-redux';

export const useNotificationState = () => {
  return useSelector(state => state.notification) || {
    notifications: [],
    isLoading: false,
    error: null,
    lastCheckedAt: null,
  };
};
