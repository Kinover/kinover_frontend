import React, {useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, Image} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchNotificationsThunk} from '../../../redux/thunk/notificationThunk';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';
import useHideTabBar from '../../../hooks/useHideTabBar';

export default function NotificationScreen() {
  const dispatch = useDispatch();
  const {notifications, isLoading, error} = useSelector(
    state => state.notification,
  );

  useHideTabBar();

  useEffect(() => {
    dispatch(fetchNotificationsThunk());
  }, [dispatch]);

  const getContentText = (type, authorName) => {
    switch (type) {
      case 'POST':
        return `${authorName} 님이 게시글을 추가했어요.`;
      case 'COMMENT':
        return `${authorName} 님이 댓글을 추가했어요.`;
      default:
        return `${authorName} 님이 알림을 보냈어요.`;
    }
  };

  const sanitizeUrl = url => {
    // 중복된 CDN prefix 제거
    return url.replace(
      /(https:\/\/dzqa9jgkeds0b\.cloudfront\.net\/)+/g,
      'https://dzqa9jgkeds0b.cloudfront.net/',
    );
  };

  if (isLoading) return <Text style={styles.loading}>불러오는 중...</Text>;
  if (error) return <Text style={styles.error}>오류 발생: {error}</Text>;

  return (
    <ScrollView style={styles.container}>
      {notifications.map((n, i) => (
        <View key={i} style={styles.card}>
          <Image
            source={{uri: sanitizeUrl(n.authorImage)}}
            style={styles.profileImage}
          />
          <View style={styles.textContainer}>
            <Text style={styles.category}>{n.categoryTitle}</Text>
            <Text style={styles.content}>
              {getContentText(n.notificationType, n.authorName)}
            </Text>
          </View>
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(16),
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  profileImage: {
    width: getResponsiveWidth(45),
    height: getResponsiveWidth(45),
    borderRadius: getResponsiveWidth(22.5),
    marginRight: getResponsiveWidth(15),
    backgroundColor: '#ddd',
  },
  textContainer: {
    flex: 1,
  },
  category: {
    fontSize: getResponsiveFontSize(12),
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Pretendard-Light',
  },
  content: {
    fontSize: getResponsiveFontSize(14),
    color: '#111',
    fontFamily: 'Pretendard-Regular',
  },
});
