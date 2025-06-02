import React, {useEffect} from 'react';
import {View, Text} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchNotificationsThunk} from '../redux/thunk/notificationThunk';

export default function NotificationScreen() {
  const dispatch = useDispatch();
  const {notifications, isLoading, error} = useSelector(
    state => state.notification,
  );

  useEffect(() => {
    dispatch(fetchNotificationsThunk());
  }, []);

  if (isLoading) return <Text>불러오는 중...</Text>;
  if (error) return <Text>오류 발생: {error}</Text>;

  return (
    <View>
      {notifications.map((n, i) => (
        <View key={i}>
          <Text>{n.authorName}</Text>
          <Text>{n.contentPreview}</Text>
          <Text>{n.createdAt}</Text>
        </View>
      ))}
    </View>
  );
}
