import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotificationsThunk } from '../../../redux/thunk/notificationThunk';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';

export default function NotificationScreen() {
  const dispatch = useDispatch();
  const { notifications, isLoading, error } = useSelector(
    state => state.notification,
  );

  useEffect(() => {
    dispatch(fetchNotificationsThunk());
  }, []);

  if (isLoading) return <Text style={styles.loading}>불러오는 중...</Text>;
  if (error) return <Text style={styles.error}>오류 발생: {error}</Text>;

  return (
    <ScrollView style={styles.container}>
      {notifications.map((n, i) => (
        <View key={i} style={styles.notificationCard}>
          <Text style={styles.author}>{n.authorName}</Text>
          <Text style={styles.content}>{n.contentPreview}</Text>
          <Text style={styles.date}>{n.createdAt}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: getResponsiveWidth(20),
    paddingTop: getResponsiveHeight(20),
    backgroundColor: '#fff',
  },
  loading: {
    fontSize: getResponsiveFontSize(16),
    textAlign: 'center',
    marginTop: getResponsiveHeight(20),
  },
  error: {
    fontSize: getResponsiveFontSize(16),
    color: 'red',
    textAlign: 'center',
    marginTop: getResponsiveHeight(20),
  },
  notificationCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: getResponsiveHeight(15),
  },
  author: {
    fontSize: getResponsiveFontSize(15),
    fontWeight: '600',
    marginBottom: getResponsiveHeight(4),
  },
  content: {
    fontSize: getResponsiveFontSize(14),
    color: '#333',
    marginBottom: getResponsiveHeight(3),
  },
  date: {
    fontSize: getResponsiveFontSize(12),
    color: '#999',
  },
});
