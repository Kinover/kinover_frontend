// src/hooks/notification/useNotificationPress.js
import {useCallback} from 'react';
import {useNavigation} from '@react-navigation/native';
import { openNotification } from '../utils/openNotification';

export const useNotificationPress = () => {
  const navigation = useNavigation();

  const handlePress = useCallback(
    notification => {
      openNotification(notification, navigation);
    },
    [navigation],
  );

  return {handlePress};
};
