import React, {useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchNotificationsThunk} from '../../redux/thunk/notificationThunk';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../utils/responsive';
import useHideTabBar from '../../hooks/common/useHideTabBar';
import {useNavigation} from '@react-navigation/native';
// import {openNotification} from '../../../utils/notification/openNotification';
import FastImage from 'react-native-fast-image';
import { setHasUnread } from '../../redux/slices/notificationSlice';
import YellowSpinner from '../../components/common/yellowSpinner';
import { openNotification } from '../../utils/notification/openNotification';


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
    if (!url || typeof url !== 'string') return '';
    // 중복된 CDN prefix 제거
    return url.replace(
      /(https:\/\/dzqa9jgkeds0b\.cloudfront\.net\/)+/g,
      'https://dzqa9jgkeds0b.cloudfront.net/',
    );
  };
  
  const formatWhen = iso => {
    if (!iso) return '';
  
    const d = new Date(iso);
  
    // 시/분 뽑기
    let hours = d.getHours(); // 0 ~ 23
    const minutes = d.getMinutes(); // 0 ~ 59
  
    // 오전/오후 판별
    const ampm = hours < 12 ? '오전' : '오후';
  
    // 12시간제로 변환
    hours = hours % 12;
    if (hours === 0) hours = 12;
  
    // 분은 항상 2자리로 표시
    const minuteStr = minutes.toString().padStart(2, '0');
  
    return `${ampm} ${hours}시 ${minuteStr}분`;
  };
  

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const sectionTitleFor = date => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (isSameDay(d, today)) return '오늘';
    if (isSameDay(d, yesterday)) return '어제';
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}.${m}.${day}`;
  };

  // 타입 → 라벨/색/문구
  const TYPE_META = {
    CHAT: {label: '채팅', color: 'black'},
    SCHEDULE: {label: '일정', color: 'black'},
    POST: {label: '게시글', color: 'black'},
    COMMENT: {label: '댓글', color: 'black'},
    DEFAULT: {label: '알림', color: 'black'},
  };
  const getTypeMeta = t => TYPE_META[t] || TYPE_META.DEFAULT;

  const buildSummary = (type, authorName, titleText) => {
    switch (type) {
      case 'CHAT':
        return `${authorName} 님이 메시지를 보냈어요.`;
      case 'SCHEDULE':
        return titleText
          ? `일정이 추가되었어요: ${titleText}`
          : `일정이 추가되었어요.`;
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
        <YellowSpinner></YellowSpinner>
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

        // ✅ 왼쪽 이미지 선택 규칙
        // CHAT/SCHEDULE → authorImage
        // POST/COMMENT → firstImageUrl
        const leftImageUrl =
          n.notificationType === 'POST' || n.notificationType === 'COMMENT'
            ? firstImage
            : authorImage;

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
                    : require('../../assets/images/default.png')
                }
                style={styles.profileImage}
              />
            </View>

            {/* 가운데: 텍스트 영역 */}
            <View style={styles.center}>
              <View style={styles.rowTop}>
                <Text style={[styles.typeBadgeText, {color: typeMeta.color}]}>
                  {title}
                </Text>
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
            {/* 👉 오른쪽 썸네일은 요청대로 제거 */}
          </TouchableOpacity>
        );
      })}

      {notifications.length === 0 && (
        <View style={{paddingVertical: getResponsiveHeight(60)}}>
          <Text style={styles.empty}>알림이 없어요.</Text>
        </View>
      )}
    </ScrollView>
  );
}

/* ======= styles ======= */
const AVATAR = getResponsiveWidth(46);

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
  loading: {
    fontSize: getResponsiveFontSize(16),
    textAlign: 'center',
    color: '#555',
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
    borderRadius: getResponsiveWidth(5), // ← 게시글 썸네일 느낌 살리려면 원형 대신 라운드 사각
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
    fontWeight:'700',
  },

  newDot: {
    fontSize: getResponsiveFontSize(10.5),
    color: '#FF8A00',
    fontFamily: 'Pretendard-SemiBold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#FFF3E0',
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
