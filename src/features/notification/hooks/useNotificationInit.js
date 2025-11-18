// src/hooks/notification/useNotificationInit.js
import {useEffect} from 'react';
import {useDispatch} from 'react-redux';
import { fetchNotificationsThunk } from '../store/notificationThunk';
import { setHasUnread } from '../store/notificationSlice';

export const useNotificationInit = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchNotificationsThunk());
    dispatch(setHasUnread(false));
  }, [dispatch]);
};
