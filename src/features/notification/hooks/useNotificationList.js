// src/hooks/notification/useNotificationList.js
import { useNotificationState } from './useNotification';
import {useNotificationInit} from './useNotificationInit';
import {useLastCheckedDate} from './useLastCheckedDate';
import {useNotificationRows} from './useNotificationRows';
import {useNotificationPress} from './useNotificationPress';

export const useNotificationList = () => {
  // 1) 상태 읽기
  const {notifications = [], isLoading, error, lastCheckedAt} =
    useNotificationState();

  // 2) 첫 진입 시 fetch + unread 플래그 초기화
  useNotificationInit();

  // 3) lastCheckedAt → Date 메모
  const lastChecked = useLastCheckedDate(lastCheckedAt);

  // 4) 화면에서 바로 쓸 수 있게 rows로 가공
  const rows = useNotificationRows(notifications, lastChecked);

  // 5) 알림 클릭 핸들러
  const {handlePress} = useNotificationPress();

  return {
    isLoading,
    error,
    rows,
    handlePress,
  };
};
