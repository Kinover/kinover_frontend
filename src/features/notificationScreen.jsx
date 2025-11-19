/* eslint-disable react-native/no-inline-styles */
// NotificationScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import FastImage from 'react-native-fast-image2';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../utils/responsive';
import useHideTabBar from '../hooks/useHideTabBar';
import YellowSpinner from '../components/YellowSpinner';
import { useNotificationList } from './notification/hooks/useNotificationList';


const AVATAR = getResponsiveWidth(46);

export default function NotificationScreen() {
  useHideTabBar();
  const {isLoading, error, rows, handlePress} = useNotificationList();

  if (isLoading) {
    return (
      <View style={[styles.container, {justifyContent: 'center'}]}>
        <YellowSpinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, {justifyContent: 'center'}]}>
        <Text style={styles.error}>오류 발생: {error}</Text>
      </View>
    );
  }

  const hasNotifications = rows.some(r => r.type === 'item');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {rows.map(row => {
        if (row.type === 'section') {
          return (
            <Text key={`sec-${row.key}`} style={styles.sectionTitle}>
              {row.title}
            </Text>
          );
        }

        return (
          <TouchableOpacity
            key={`n-${row.key}`}
            activeOpacity={0.8}
            onPress={() => handlePress(row.notification)}
            style={[styles.card, row.isNew && styles.cardNew]}>
            {/* 왼쪽 이미지 */}
            <View style={styles.avatarWrap}>
              <FastImage
                source={
                  row.leftImageUrl
                    ? {uri: row.leftImageUrl}
                    : require('../../assets/images/default.png')
                }
                style={styles.profileImage}
              />
            </View>

            {/* 가운데 텍스트 영역 */}
            <View style={styles.center}>
              <View style={styles.rowTop}>
                <Text
                  style={[
                    styles.typeBadgeText,
                    {color: row.typeColor || 'black'},
                  ]}>
                  {row.title}
                </Text>
                <Text style={styles.when}>{row.when}</Text>
              </View>

              <Text numberOfLines={1} style={styles.summary}>
                {row.summary}
              </Text>

              {!!row.preview && (
                <Text numberOfLines={2} style={styles.content}>
                  {row.preview}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {!hasNotifications && (
        <View style={{paddingVertical: getResponsiveHeight(60)}}>
          <Text style={styles.empty}>알림이 없어요.</Text>
        </View>
      )}
    </ScrollView>
  );
}

/* ======= styles ======= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    marginTop: getResponsiveHeight(14),
    marginBottom: getResponsiveHeight(4),
    fontSize: getResponsiveFontSize(12.5),
    color: '#8D8D8D',
    fontFamily: 'Pretendard-Medium',
    paddingHorizontal: getResponsiveHeight(20),
  },
  error: {
    fontSize: getResponsiveFontSize(16),
    color: 'red',
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(15),
    paddingHorizontal: getResponsiveHeight(24.5),
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFEFEF',
    gap: getResponsiveWidth(12),
  },
  cardNew: {
    backgroundColor: '#FFF9EC',
  },
  avatarWrap: {
    position: 'relative',
  },
  profileImage: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: getResponsiveWidth(5),
    backgroundColor: '#EAEAEA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(8),
    marginBottom: getResponsiveHeight(4),
  },
  typeBadgeText: {
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: '700',
  },
  when: {
    marginLeft: 'auto',
    fontSize: getResponsiveFontSize(12),
    color: '#9A9A9A',
    fontFamily: 'Pretendard-Regular',
  },
  summary: {
    fontSize: getResponsiveFontSize(13.5),
    color: '#1A1A1A',
    fontFamily: 'Pretendard-Medium',
  },
  content: {
    marginTop: getResponsiveHeight(2),
    fontSize: getResponsiveFontSize(13),
    color: '#444',
    fontFamily: 'Pretendard-Regular',
    lineHeight: getResponsiveHeight(18),
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    fontSize: getResponsiveFontSize(14),
  },
});
