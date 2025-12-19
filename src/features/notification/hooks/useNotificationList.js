// src/features/notification/hooks/useNotificationList.js
import {useNotificationState} from './useNotification';
import {useLastCheckedDate} from './useLastCheckedDate';
import {useNotificationRows} from './useNotificationRows';
import {useNotificationPress} from './useNotificationPress';

export const useNotificationList = () => {
  const {notifications = [], isLoading, error, lastCheckedAt} =
    useNotificationState();

  const lastChecked = useLastCheckedDate(lastCheckedAt);
  const rows = useNotificationRows(notifications, lastChecked);

  const {handlePress} = useNotificationPress();

  return {isLoading, error, rows, handlePress};
};
