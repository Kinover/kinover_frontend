/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchNotificationsThunk} from '../store/notificationThunk';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
import useHideTabBar from 'hooks/useHideTabBar';
import {useNavigation} from '@react-navigation/native';
import FastImage from '@d11/react-native-fast-image';
import {setHasUnread} from '../store/notificationSlice';
import YellowSpinner from 'components/YellowSpinner';
import {openNotification} from '../utils/openNotification';

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const sectionTitleFor = date => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(d, today)) {
    return '오늘';
  }
  if (isSameDay(d, yesterday)) {
    return '어제';
  }
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}.${m}.${day}`;
};

export default function NotificationScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const {
    notifications = [],
    isLoading,
    error,
    lastCheckedAt,
  } = useSelector(state => state.notification);

  useHideTabBar();

  useEffect(() => {
    dispatch(fetchNotificationsThunk());
    dispatch(setHasUnread(false));
  }, [dispatch]);

  // ========= 유틸 =========
  const sanitizeUrl = url => {
    if (!url || typeof url !== 'string') {
      return '';
    }
    // 중복된 CDN prefix 제거
    return url.replace(
      /(https:\/\/dzqa9jgkeds0b\.cloudfront\.net\/)+/g,
      'https://dzqa9jgkeds0b.cloudfront.net/',
    );
  };

  const formatWhen = iso => {
    if (!iso) {
      return '';
    }

    const d = new Date(iso);

    let hours = d.getHours();
    const minutes = d.getMinutes();

    const ampm = hours < 12 ? '오전' : '오후';

    hours = hours % 12;
    if (hours === 0) {
      hours = 12;
    }

    const minuteStr = minutes.toString().padStart(2, '0');

    return `${ampm} ${hours}시 ${minuteStr}분`;
  };

  // 타입 → 라벨/색/문구
  const TYPE_META = {
    CHAT: {label: '채팅', color: '#111827'},
    SCHEDULE: {label: '일정', color: '#111827'},
    POST: {label: '게시글', color: '#111827'},
    COMMENT: {label: '댓글', color: '#111827'},
    DEFAULT: {label: '알림', color: '#111827'},
  };
  const getTypeMeta = t => TYPE_META[t] || TYPE_META.DEFAULT;

  const buildSummary = (type, authorName, titleText) => {
    switch (type) {
      case 'CHAT':
        return `${authorName} 님이 메시지를 보냈어요.`;
      case 'SCHEDULE':
        return titleText
          ? `일정이 추가되었어요: ${titleText}`
          : '일정이 추가되었어요.';
      case 'POST':
        return `${authorName} 님이 게시글을 추가했어요.`;
      case 'COMMENT':
        return `${authorName} 님이 댓글을 추가했어요.`;
      default:
        return `${authorName} 님이 알림을 보냈어요.`;
    }
  };

  const lastChecked = useMemo(
    () => (lastCheckedAt ? new Date(lastCheckedAt) : null),
    [lastCheckedAt],
  );

  // 날짜 내림차순 정렬 후 섹션화
  const sectioned = useMemo(() => {
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    const result = [];
    let curKey = null;
    sorted.forEach(n => {
      const key = sectionTitleFor(n.createdAt);
      if (key !== curKey) {
        result.push({type: 'section', key});
        curKey = key;
      }
      result.push({type: 'item', data: n});
    });
    return result;
  }, [notifications]);

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

  const handlePress = n => {
    openNotification(n, navigation);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.inner}
      showsVerticalScrollIndicator={false}>
      {sectioned.map((row, idx) => {
        if (row.type === 'section') {
          return (
            <Text key={`sec-${row.key}-${idx}`} style={styles.sectionTitle}>
              {row.key}
            </Text>
          );
        }

        const n = row.data;
        const authorImage = sanitizeUrl(n.authorImage);
        const firstImage = sanitizeUrl(n.firstImageUrl);
        const when = formatWhen(n.createdAt);
        const typeMeta = getTypeMeta(n.notificationType);
        const title = n.categoryTitle || typeMeta.label;
        const summary = buildSummary(
          n.notificationType,
          n.authorName,
          n.categoryTitle,
        );
        const preview = (n.contentPreview || '').trim();
        const isNew =
          lastChecked && n.createdAt
            ? new Date(n.createdAt).getTime() > lastChecked.getTime()
            : false;

        const isPostType =
          n.notificationType === 'POST' || n.notificationType === 'COMMENT';

        // 왼쪽 이미지 선택 규칙
        const leftImageUrl = isPostType ? firstImage : authorImage;

        return (
          <TouchableOpacity
            key={`n-${idx}`}
            activeOpacity={0.8}
            onPress={() => handlePress(n)}
            style={[styles.card, isNew && styles.cardNew]}>
            {/* 왼쪽: 타입에 따른 대표 이미지 */}
            <View style={styles.avatarWrap}>
              <FastImage
                source={
                  leftImageUrl
                    ? {uri: leftImageUrl}
                    : require('../../../assets/images/default.png')
                }
                style={[
                  styles.profileImage,
                  isPostType && styles.profileImagePost,
                ]}
              />
            </View>

            {/* 가운데: 텍스트 영역 */}
            <View style={styles.center}>
              <View style={styles.rowTop}>
                <View style={styles.typeBadge}>
                  <Text
                    style={[
                      styles.typeBadgeText,
                      {color: typeMeta.color},
                    ]}>
                    {title}
                  </Text>
                </View>
                {isNew && <View style={styles.newDot} />}
                <Text style={styles.when}>{when}</Text>
              </View>

              <Text numberOfLines={1} style={styles.summary}>
                {summary}
              </Text>

              {!!preview && (
                <Text numberOfLines={2} style={styles.content}>
                  {preview}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {notifications.length === 0 && (
        <View style={styles.emptyWrap}>
          <Text style={styles.empty}>알림이 없어요.</Text>
        </View>
      )}
    </ScrollView>
  );
}

/* ======= styles ======= */
const AVATAR = getResponsiveWidth(44);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // 전체 배경 살짝 톤 다운
  },
  inner: {
    paddingHorizontal: getResponsiveWidth(18),
    paddingTop: getResponsiveHeight(8),
    paddingBottom: getResponsiveHeight(20),
  },

  sectionTitle: {
    marginTop: getResponsiveHeight(18),
    marginBottom: getResponsiveHeight(6),
    fontSize: getResponsiveFontSize(11.5),
    color: '#9CA3AF',
    fontFamily: 'Pretendard-Medium',
  },

  error: {
    fontSize: getResponsiveFontSize(16),
    color: 'red',
    textAlign: 'center',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(12),
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: getResponsiveHeight(8),
    // 카드 느낌 살짝
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    gap: getResponsiveWidth(12),
  },
  cardNew: {
    borderWidth: 1,
    borderColor: '#FFE3A3',
    backgroundColor: '#FFF9EC',
  },

  avatarWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2, // 기본은 동그랗게 (사람)
    backgroundColor: '#E5E7EB',
  },
  profileImagePost: {
    borderRadius: getResponsiveWidth(6), // 게시글/댓글은 썸네일 느낌
  },

  center: {
    flex: 1,
    justifyContent: 'center',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(4),
  },

  typeBadge: {
    paddingHorizontal: getResponsiveWidth(8),
    paddingVertical: getResponsiveHeight(3),
    borderRadius: 999,
    backgroundColor: '#F3F4FF',
    marginRight: getResponsiveWidth(6),
  },
  typeBadgeText: {
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-SemiBold',
  },

  newDot: {
    width: getResponsiveWidth(7),
    height: getResponsiveWidth(7),
    borderRadius: 999,
    backgroundColor: '#F97316',
    marginRight: getResponsiveWidth(6),
  },

  when: {
    marginLeft: 'auto',
    fontSize: getResponsiveFontSize(11.5),
    color: '#9CA3AF',
    fontFamily: 'Pretendard-Regular',
  },

  summary: {
    fontSize: getResponsiveFontSize(13.5),
    color: '#111827',
    fontFamily: 'Pretendard-Medium',
  },
  content: {
    marginTop: getResponsiveHeight(2),
    fontSize: getResponsiveFontSize(12.5),
    color: '#4B5563',
    fontFamily: 'Pretendard-Regular',
    lineHeight: getResponsiveHeight(18),
  },

  emptyWrap: {
    paddingVertical: getResponsiveHeight(60),
    alignItems: 'center',
  },
  empty: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
  },
});
