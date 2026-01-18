// src/hooks/notification/useNotificationPress.js
import {useCallback} from 'react';
import {openNotification} from '../utils/openNotification';

export const useNotificationPress = () => {
  const handlePress = useCallback(notification => {
    // ✅ 알림함에서 눌렀을 때: 히스토리 제거(reset)
    openNotification(notification, {mode: 'reset'});
  }, []);

  return {handlePress};
};
