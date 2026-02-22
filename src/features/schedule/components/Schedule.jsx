import React, {useMemo, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
} from 'react-native';

import {
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveHeight,
} from 'utils/responsive';

import {useScheduleListByDate} from '../hooks/useScheduleListByDate';
import {useFormattedScheduleDate} from '../hooks/useFormattedScheduleDate';
import {COLORS, DEFAULT_STYLE, EMPTY_STYLE} from 'styles/style';

import DropShadow from 'react-native-drop-shadow';
import BirthdayConfettiModal from './BirthdayConfettiModal';

const COLOR = {
  BLUE_BG: 'rgba(59, 130, 246, 0.14)',
  BLUE_PILL: 'rgba(59, 130, 246, 0.10)',
  BLUE_TEXT: '#1D4ED8',

  YELLOW_BG: 'rgba(255, 200, 77, 0.25)',
  YELLOW_PILL: 'rgba(255, 200, 77, 0.18)',
  YELLOW_TEXT: '#8A5A00',

  GRAY_BG: 'rgba(17, 24, 39, 0.08)',
  GRAY_PILL: 'rgba(17, 24, 39, 0.05)',
  GRAY_TEXT: '#374151',
};

const TYPE = {
  INDIVIDUAL: 'INDIVIDUAL',
  FAMILY: 'FAMILY',
  ANNIVERSARY: 'ANNIVERSARY',
};

const AVATAR_SIZE = getResponsiveWidth(36);
const AVATAR_OVERLAP = getResponsiveWidth(-10);
const MAX_VISIBLE_AVATARS = 2; // 3명 이상부터 +1, +2… 로 표시

/** 겹쳐진 아바타: 왼쪽부터 1번째, 2번째… 순서로 겹치고, 3명 이상이면 +N을 오른쪽에 */
function StackedAvatar({participants = [], size = AVATAR_SIZE}) {
  const list =
    participants.length > 0 ? participants : [{id: '_', name: '가족', imageUri: null}];
  const visible = list.slice(0, MAX_VISIBLE_AVATARS);
  const rest = list.length - MAX_VISIBLE_AVATARS;

  return (
    <View style={styles.stackedAvatarWrap}>
      {visible.map((p, i) => (
        <View
          key={p.id || i}
          style={[
            styles.stackedAvatarCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: i === 0 ? 0 : AVATAR_OVERLAP,
              borderWidth: 1.5,
              borderColor: '#FFFFFF',
              zIndex: visible.length - i,
            },
          ]}>
          {p.imageUri ? (
            <Image
              source={{uri: String(p.imageUri)}}
              style={[
                styles.stackedAvatarImage,
                {width: size, height: size, borderRadius: size / 2},
              ]}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.stackedAvatarFallback,
                {width: size, height: size, borderRadius: size / 2},
              ]}>
              <Text
                allowFontScaling={false}
                style={[styles.stackedAvatarInitial, {fontSize: size * 0.4}]}>
                {String(p.name || '가족').slice(0, 1)}
              </Text>
            </View>
          )}
        </View>
      ))}
      {rest > 0 && (
        <View
          style={[
            styles.stackedAvatarPlus,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: AVATAR_OVERLAP,
              zIndex: 0,
            },
          ]}>
          <Text
            allowFontScaling={false}
            style={[styles.stackedAvatarPlusText, {fontSize: size * 0.35}]}>
            +{rest}
          </Text>
        </View>
      )}
    </View>
  );
}

/* =========================================================
 * 카드 컴포넌트: 눌렀을 때 살짝 작아지는 효과
 * ========================================================= */
function ScheduleCard({children, onPress}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 28,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 28,
      bounciness: 6,
    }).start();
  };

  return (
    <DropShadow style={[styles.cardShadowBox, styles.roundPillShadow]}>
      <Animated.View style={{transform: [{scale}]}}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={[styles.cardWrap, styles.roundPillWrap]}>
          {children}
        </TouchableOpacity>
      </Animated.View>
    </DropShadow>
  );
}

function Schedule({
  selectedDate,
  onOpenSheet,
  refreshTrigger,
  birthdayNames = [],
  familyId: familyIdProp,
  familyUserList = [],
  currentUserId,
}) {
  const hookResult =
    useScheduleListByDate(selectedDate, refreshTrigger, familyIdProp) || {};

  const individual = hookResult.individual ?? hookResult.personal ?? [];
  const family = hookResult.family ?? hookResult.shared ?? [];
  const anniversary = hookResult.anniversary ?? [];
  const scheduleList = hookResult.scheduleList ?? [];

  const formattedDate = useFormattedScheduleDate(selectedDate);

  const hasBirthday = Array.isArray(birthdayNames) && birthdayNames.length > 0;

  const displayNames =
    birthdayNames.length > 2
      ? `${birthdayNames.slice(0, 2).join(', ')} 외 ${
          birthdayNames.length - 2
        }명`
      : birthdayNames.join(', ');

  const [birthdayModalVisible, setBirthdayModalVisible] = useState(false);

  const openBirthdayModal = useCallback(() => {
    if (!hasBirthday) return;
    setBirthdayModalVisible(true);
  }, [hasBirthday]);

  const closeBirthdayModal = useCallback(() => {
    setBirthdayModalVisible(false);
  }, []);

  const namesText = useMemo(() => {
    if (!hasBirthday) return '';
    return `${displayNames} 🎉`;
  }, [hasBirthday, displayNames]);

  // ✅ type 판별 로직
  const getCardPreset = item => {
    const raw =
      item?.type ??
      item?.scheduleType ??
      item?.kind ??
      item?.category ??
      item?.eventType ??
      null;

    const t = String(raw || '').toUpperCase();

    const isAnniv =
      item?.isAnniversary === true ||
      t === TYPE.ANNIVERSARY ||
      t.includes('ANNIV') ||
      t.includes('ANNIVERSARY') ||
      String(raw || '')
        .toLowerCase()
        .includes('기념');

    const isFamily =
      !isAnniv &&
      (t === TYPE.FAMILY ||
        t.includes('FAMILY') ||
        item?.isShared === true ||
        item?.shared === true ||
        String(raw || '')
          .toLowerCase()
          .includes('공동'));

    if (isAnniv) {
      return {
        type: TYPE.ANNIVERSARY,
        pillText: '기념일',
        icon: '🎂',
        iconBg: COLOR.YELLOW_BG,
        pillBg: COLOR.YELLOW_PILL,
        pillTextColor: COLOR.YELLOW_TEXT,
      };
    }

    if (isFamily) {
      return {
        type: TYPE.FAMILY,
        pillText: '가족',
        icon: '🫶🏻',
        iconBg: COLOR.BLUE_BG,
        pillBg: COLOR.BLUE_PILL,
        pillTextColor: COLOR.BLUE_TEXT,
      };
    }

    return {
      type: TYPE.INDIVIDUAL,
      pillText: '개별',
      icon: '',
      iconBg: COLOR.GRAY_BG,
      pillBg: COLOR.GRAY_PILL,
      pillTextColor: COLOR.GRAY_TEXT,
    };
  };

  /** 개별 일정 참여자 목록 (프로필 사진·이름). 앱 사용자가 있으면 맨 앞에 배치 */
  const getIndividualParticipants = useCallback(
    item => {
      const ids = Array.isArray(item?.participantIds)
        ? item.participantIds
        : item?.userId != null
          ? [item.userId]
          : [];
      const names = Array.isArray(item?.participantNames)
        ? item.participantNames.filter(Boolean)
        : [];
      const list = [];
      ids.forEach((id, i) => {
        const user = familyUserList?.find(
          u =>
            String(u?.userId) === String(id) || String(u?.id) === String(id),
        );
        const name =
          user?.name ?? user?.nickname ?? names[i] ?? item?.userName ?? '가족';
        const imageUri =
          user?.image ?? user?.profileImage ?? user?.profileImageUrl ?? null;
        list.push({id: String(id), name, imageUri});
      });
      if (list.length === 0 && (item?.userName || names[0])) {
        list.push({
          id: 'single',
          name: item?.userName || names[0],
          imageUri: null,
        });
      }
      const me =
        currentUserId != null && currentUserId !== ''
          ? String(currentUserId)
          : null;
      if (me && list.length >= 1) {
        const meIndex = list.findIndex(
          p => String(p.id) === String(me) || p.id === currentUserId,
        );
        if (meIndex > 0) {
          const [meItem] = list.splice(meIndex, 1);
          list.unshift(meItem);
        }
      }
      return list;
    },
    [familyUserList, currentUserId],
  );

  const getMemberLabel = useCallback(
    item => {
      const totalFamilyCount = familyUserList?.length ?? 0;
      const names = Array.isArray(item?.participantNames)
        ? item.participantNames.filter(Boolean)
        : [];

      if (names.length === 1) return names[0];
      if (names.length > 1) {
        if (totalFamilyCount > 0 && names.length >= totalFamilyCount)
          return '가족';
        if (names.length === 2) return `${names[0]}, ${names[1]}`;
        return `${names[0]} 외 ${names.length - 1}명`;
      }
      if (item?.userName) return item.userName;

      const ids = Array.isArray(item?.participantIds)
        ? item.participantIds
        : item?.userId != null
          ? [item.userId]
          : [];
      if (ids.length > 0 && familyUserList?.length) {
        const resolved = ids
          .map(id => {
            const u = familyUserList.find(
              x =>
                String(x?.userId) === String(id) ||
                String(x?.id) === String(id),
            );
            return u?.name ?? u?.nickname ?? null;
          })
          .filter(Boolean);
        if (resolved.length === 1) return resolved[0];
        if (resolved.length > 1) {
          if (ids.length >= totalFamilyCount) return '가족';
          if (resolved.length === 2) return `${resolved[0]}, ${resolved[1]}`;
          return `${resolved[0]} 외 ${resolved.length - 1}명`;
        }
      }

      return '가족';
    },
    [familyUserList],
  );

  const mergedForRender = useMemo(() => {
    return [...anniversary, ...family, ...individual];
  }, [anniversary, family, individual]);

  return (
    <View style={styles.container}>
      <Text allowFontScaling={false} style={styles.dateText}>
        {formattedDate}
      </Text>

      {hasBirthday && (
        <DropShadow style={[styles.cardShadowBox, styles.roundPillShadow]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={openBirthdayModal}
            style={[styles.cardWrap, styles.roundPillWrap]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardLeft}>
                <View
                  style={[
                    styles.iconCircle,
                    {backgroundColor: COLOR.YELLOW_BG},
                  ]}>
                  <Text allowFontScaling={false} style={styles.iconText}>
                    🎂
                  </Text>
                </View>

                <View style={styles.texts}>
                  <Text allowFontScaling={false} style={styles.subtitle}>
                    {displayNames}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={styles.title}
                    numberOfLines={1}>
                    {displayNames}님의 생일이에요
                  </Text>
                </View>
              </View>

              <View style={[styles.pill, {backgroundColor: COLOR.YELLOW_PILL}]}>
                <Text
                  allowFontScaling={false}
                  style={[styles.pillText, {color: COLOR.YELLOW_TEXT}]}>
                  기념일
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </DropShadow>
      )}

      <BirthdayConfettiModal
        visible={birthdayModalVisible}
        onClose={closeBirthdayModal}
        title="생일 축하해요! 🎂"
        subText="오늘은 축하를 듬뿍 받아야 하는 날이에요"
        namesText={namesText}
      />

      <View style={styles.timelineWrapper}>
        <View style={styles.scheduleCards}>
          {mergedForRender.map(item => {
            const preset = getCardPreset(item);
            const ownerLabel =
              preset.type === TYPE.ANNIVERSARY ? '가족' : getMemberLabel(item);

            return (
              <ScheduleCard
                key={item.scheduleId ?? `${preset.type}-${item.title}`}
                // ✅ FIX: 카드에서 판별한 type을 강제로 전달
                onPress={() =>
                  onOpenSheet({
                    ...item,
                    __forcedKind: preset.type,
                  })
                }>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardLeft}>
                    {preset.type === TYPE.ANNIVERSARY ? (
                      <View
                        style={[
                          styles.iconCircle,
                          {backgroundColor: preset.iconBg},
                        ]}>
                        <Text
                          allowFontScaling={false}
                          style={styles.iconText}>
                          {preset.icon}
                        </Text>
                      </View>
                    ) : (
                      <StackedAvatar
                        participants={getIndividualParticipants(item)}
                      />
                    )}

                    <View style={styles.texts}>
                      <Text allowFontScaling={false} style={styles.subtitle}>
                        {ownerLabel}
                      </Text>
                      <Text allowFontScaling={false} style={styles.title}>
                        {item.title || '제목 없음'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.pill, {backgroundColor: preset.pillBg}]}>
                    <Text
                      allowFontScaling={false}
                      style={[styles.pillText, {color: preset.pillTextColor}]}>
                      {preset.pillText}
                    </Text>
                  </View>
                </View>
              </ScheduleCard>
            );
          })}

          {scheduleList.length === 0 && (
            <Text allowFontScaling={false} style={styles.emptyText}>
              {'일정이 비어 있어요.\n새로운 일정을 추가해볼까요?'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

export default React.memo(Schedule);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: getResponsiveWidth(0),
    paddingBottom: getResponsiveHeight(200),
  },
  dateText: {
    color: COLORS.textPrimary,
    fontSize: DEFAULT_STYLE().sectionTitle.fontSize - 1.5,
    fontFamily: DEFAULT_STYLE().sectionTitle.fontFamily,
    marginTop: getResponsiveHeight(15),
    marginBottom: getResponsiveHeight(16),
    alignSelf: 'flex-start',
  },
  timelineWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  scheduleCards: {
    flex: 1,
    width: '100%',
  },
  cardShadowBox: {
    width: '100%',
    borderRadius: 0,
    backgroundColor: 'transparent',
    marginBottom: getResponsiveHeight(10),
  },
  roundPillShadow: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardWrap: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingVertical: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(14),
    overflow: 'hidden',
  },
  roundPillWrap: {
    minHeight: getResponsiveHeight(58),
    justifyContent: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: getResponsiveWidth(10),
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
    flex: 1,
    minWidth: 0,
  },
  stackedAvatarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackedAvatarCircle: {
    overflow: 'hidden',
    backgroundColor: COLOR.GRAY_BG,
  },
  stackedAvatarImage: {
    backgroundColor: '#f3f4f6',
  },
  stackedAvatarFallback: {
    backgroundColor: COLOR.GRAY_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackedAvatarInitial: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLOR.GRAY_TEXT,
  },
  stackedAvatarPlus: {
    backgroundColor: COLOR.GRAY_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackedAvatarPlusText: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLOR.GRAY_TEXT,
  },
  iconCircle: {
    width: getResponsiveWidth(36),
    height: getResponsiveWidth(36),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: getResponsiveFontSize(16),
    lineHeight: getResponsiveFontSize(25),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
  },
  texts: {
    flexDirection: 'column',
    gap: getResponsiveHeight(2),
    flex: 1,
    minWidth: 0,
  },
  subtitle: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(12),
    color: '#6B7280',
  },
  title: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(14.5),
    color: '#111827',
    lineHeight: getResponsiveFontSize(20),
    paddingTop: 2,
  },
  pill: {
    paddingVertical: getResponsiveHeight(5),
    paddingHorizontal: getResponsiveWidth(10),
    borderRadius: 999,
    backgroundColor: 'rgba(17,24,39,0.05)',
    flexShrink: 0,
  },
  pillText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(10.5),
    color: '#111827',
    letterSpacing: 0.4,
  },
  emptyText: {
    marginTop: getResponsiveHeight(60),
    fontSize: EMPTY_STYLE().emptyFontSize,
    fontFamily: EMPTY_STYLE().emptyFontFamily,
    color: EMPTY_STYLE().emptyColor,
    alignSelf: 'center',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});
