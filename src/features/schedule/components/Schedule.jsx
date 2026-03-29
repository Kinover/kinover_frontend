import React, {useMemo, useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  ScrollView,
  InteractionManager,
  Platform,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';

import AppText from 'components/AppText';
import {getResponsiveWidth, getResponsiveHeight, getResponsiveFontSize} from 'utils/responsive';

import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';

import {useCalendarLayout} from '../hooks/useCalendarLayout';
import {useScheduleListByDate} from '../hooks/useScheduleListByDate';
import {useFormattedScheduleDate} from '../hooks/useFormattedScheduleDate';
import {scheduleItemMatchesViewFilter} from '../utils/scheduleFilterHelpers';
import {
  SCHEDULE_CARD_SHADOW,
  getScheduleShadowBoxBaseStyle,
} from '../constants/scheduleDropShadow';
import {COLORS, DEFAULT_STYLE, EMPTY_STYLE} from 'styles/style';

import FastImage from '@d11/react-native-fast-image';
import DropShadow from 'react-native-drop-shadow';
import BirthdayConfettiModal from './BirthdayConfettiModal';
import CustomModal from 'components/modal/CustomModal';
import {fetchChatRoomListThunk} from 'features/chat/store/chatRoomThunk';
import {sendMessageWsThunk} from 'features/chat/store/messageThunk';
import {toCdnUrl} from 'utils/mediaUrl';

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

const AVATAR_SIZE = getResponsiveWidth(32);
const AVATAR_OVERLAP = getResponsiveWidth(-10);
/** Calendar.jsx `RADIUS` / 일정 카드와 동일 — 달력 블록과 시각적으로 한 세트 */
const SCHEDULE_SURFACE_RADIUS = 14;

/** 가족 멤버 객체에서 프로필 URL 추출 후 CloudFront 등 절대 URL로 통일 (키만 오는 경우 Android FastImage 로드 실패 방지) */
function resolveMemberProfileUri(user) {
  if (!user) return null;
  const raw =
    user.image ??
    user.profileImage ??
    user.profileImageUrl ??
    user.avatarUrl ??
    user.avatar ??
    null;
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s || s === 'null' || s === 'undefined') return null;
  return toCdnUrl(s);
}

/**
 * react-native-drop-shadow는 iOS·Android 모두 자식을 비트맵으로 그려서,
 * FastImage(원격 프로필)가 로드되기 전 스냅샷이 고정되면 회색만 보일 수 있음.
 * → 일정 카드는 DropShadow 대신 View + iOS는 shadow*, Android는 elevation.
 */
function ScheduleCardShadow({styles, children}) {
  return (
    <View
      style={[
        styles.cardDropShadow,
        Platform.OS === 'android' && styles.cardDropShadowAndroid,
      ]}>
      {children}
    </View>
  );
}

/**
 * 겹쳐진 아바타: 최대 2슬롯.
 * 1~2명: 얼굴 그대로, 3명 이상: 1번만 얼굴 + 2번 슬롯에 +N(나머지 인원 수)
 */
function StackedAvatar({participants = [], size = AVATAR_SIZE, styles}) {
  const list =
    participants.length > 0
      ? participants
      : [{id: '_', name: '가족', imageUri: null}];

  const renderFace = (p, i, zIndex) => (
    <View
      key={p.id ?? `avatar-${i}`}
      collapsable={false}
      style={[
        styles.stackedAvatarCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          marginLeft: i === 0 ? 0 : AVATAR_OVERLAP,
          borderWidth: 1.5,
          borderColor: '#FFFFFF',
          zIndex,
        },
      ]}>
      {p.imageUri ? (
        <View
          collapsable={false}
          style={[
            styles.stackedAvatarImageWrap,
            {width: size, height: size, borderRadius: size / 2},
          ]}>
          {Platform.OS === 'android' ? (
            <Image
              source={{uri: String(p.imageUri)}}
              style={[
                styles.stackedAvatarImage,
                StyleSheet.absoluteFillObject,
                {borderRadius: size / 2},
              ]}
              resizeMode="cover"
            />
          ) : (
            <FastImage
              source={{
                uri: String(p.imageUri),
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.immutable,
              }}
              style={[
                styles.stackedAvatarImage,
                StyleSheet.absoluteFillObject,
                {borderRadius: size / 2},
              ]}
              resizeMode={FastImage.resizeMode.cover}
            />
          )}
        </View>
      ) : (
        <View
          style={[
            styles.stackedAvatarFallback,
            {width: size, height: size, borderRadius: size / 2},
          ]}>
          <AppText
            allowFontScaling={false}
            style={[styles.stackedAvatarInitial, {fontSize: size * 0.4}]}>
            {String(p.name || '가족').slice(0, 1)}
          </AppText>
        </View>
      )}
    </View>
  );

  if (list.length <= 2) {
    return (
      <View style={styles.stackedAvatarWrap}>
        {list.map((p, i) => renderFace(p, i, list.length - i))}
      </View>
    );
  }

  const moreCount = list.length - 1;

  return (
    <View style={styles.stackedAvatarWrap}>
      {renderFace(list[0], 0, 2)}
      <View
        style={[
          styles.stackedAvatarPlus,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            marginLeft: AVATAR_OVERLAP,
            borderWidth: 1.5,
            borderColor: '#FFFFFF',
            zIndex: 0,
          },
        ]}>
        <AppText
          allowFontScaling={false}
          style={[styles.stackedAvatarPlusText, {fontSize: size * 0.35}]}>
          +{moreCount}
        </AppText>
      </View>
    </View>
  );
}

/* =========================================================
 * 카드 컴포넌트: 눌렀을 때 살짝 작아지는 효과
 * ========================================================= */
function ScheduleCard({children, onPress, styles}) {
  const scale = useRef(new Animated.Value(1)).current;

  /**
   * transform 스케일은 항상 JS 드라이버로 통일.
   * - Android: useNativeDriver(true) + Image/FastImage 조합에서 그리기 이슈가 있어 false 유지.
   * - iOS/Android 공통: pressIn/pressOut·재진입 시 native/JS 드라이버가 섞이면
   *   "moved to native earlier" 런타임 오류가 나므로 true로 두지 않음.
   */
  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: false,
      speed: 28,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: false,
      speed: 28,
      bounciness: 6,
    }).start();
  };

  return (
    <ScheduleCardShadow styles={styles}>
      <Animated.View collapsable={false} style={{transform: [{scale}]}}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={[styles.cardWrap, styles.roundPillWrap]}>
          <View style={styles.cardAccentStrip} />
          <View style={styles.cardBody}>{children}</View>
        </TouchableOpacity>
      </Animated.View>
    </ScheduleCardShadow>
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
  viewFilterUserIds = [],
}) {
  const styles = useScaledStyleSheet(rf => ({

  container: {
    flex: 1,
    paddingHorizontal: getResponsiveWidth(0),
    paddingBottom: getResponsiveHeight(200),
  },
  /** 달력 카드 하단 ~ 날짜 행 사이 */
  calendarDividerWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: getResponsiveHeight(10),
    marginBottom: getResponsiveHeight(10),
  },
  calendarDividerLine: {
    height: StyleSheet.hairlineWidth,
    minHeight: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.1)',
  },
  /** 달력 블록과 가로 정렬 — 자식 DropShadow에 cardWidth 적용 */
  dateRow: {
    marginTop: 0,
    marginBottom: 0,
    width: '100%',
    alignItems: 'center',
  },
  /** CalendarToggle `shadowBox` + `SCHEDULE_CARD_SHADOW` + `width: cardWidth` 와 동일 */
  dateDropShadow: {
    ...getScheduleShadowBoxBaseStyle(),
    ...SCHEDULE_CARD_SHADOW,
  },
  dateSurface: {
    width: '100%',
    borderRadius: SCHEDULE_SURFACE_RADIUS,
    backgroundColor: '#FFFFFF',
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(14),
    overflow: 'hidden',
  },
  dateInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: getResponsiveWidth(6),
  },
  dateTextYmd: {
    color: COLORS.textPrimary,
    fontSize: DEFAULT_STYLE().sectionTitle.fontSize,
    fontFamily: DEFAULT_STYLE().sectionTitle.fontFamily,
    letterSpacing: -0.2,
    lineHeight: rf(24),
  },
  dateTextSep: {
    fontSize: rf(15),
    fontFamily: 'Pretendard-Medium',
    color: COLORS.textTertiary,
    lineHeight: rf(24),
  },
  dateTextDow: {
    fontSize: rf(15),
    fontFamily: 'Pretendard-Medium',
    color: COLORS.textSecondary,
    letterSpacing: -0.1,
    lineHeight: rf(22),
  },
  timelineWrapper: {
    position: 'relative',
    flexDirection: 'column',
    alignItems: 'stretch',
    width: '100%',
  },
  scheduleCards: {
    width: '100%',
  },
  /** CalendarToggle `shadowBox` + SCHEDULE_CARD_SHADOW와 동일 (iOS shadow*) */
  cardDropShadow: {
    ...getScheduleShadowBoxBaseStyle(),
    width: '100%',
    ...SCHEDULE_CARD_SHADOW,
  },
  /** Android: DropShadow 미사용 시 네이티브 elevation (비트맵 레스터화 없음) */
  cardDropShadowAndroid: {
    elevation: 4,
  },
  /**
   * 왼쪽 띠는 borderLeft 대신 별도 View — Android에서 DropShadow 비트맵과 겹칠 때 회색으로 깨지는 현상 방지
   */
  cardWrap: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.06)',
  },
  cardAccentStrip: {
    width: getResponsiveWidth(3.5),
    backgroundColor: 'rgba(255, 200, 77, 0.55)',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    paddingVertical: getResponsiveHeight(9),
    paddingHorizontal: getResponsiveWidth(14),
  },
  roundPillWrap: {
    minHeight: getResponsiveHeight(48),
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
  stackedAvatarImageWrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: getResponsiveWidth(32),
    height: getResponsiveWidth(32),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: rf(16),
    lineHeight: rf(25),
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
    fontSize: rf(12.5),
    lineHeight: rf(16),
    color: '#6B7280',
  },
  title: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: rf(15),
    color: '#111827',
    lineHeight: rf(20),
    paddingTop: 0,
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
    fontSize: rf(10.5),
    color: '#111827',
    letterSpacing: 0.4,
  },
  roomPickerModalBox: {
    width: getResponsiveWidth(332),
    maxWidth: '92%',
  },
  roomPickerContent: {
    minHeight: getResponsiveHeight(140),
    maxHeight: getResponsiveHeight(300),
  },
  roomPickerList: {
    width: '100%',
  },
  roomPickerListContent: {
    gap: getResponsiveHeight(8),
    paddingBottom: getResponsiveHeight(4),
  },
  roomPickerItem: {
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    borderRadius: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(12),
    backgroundColor: '#FFFFFF',
  },
  roomPickerItemSelected: {
    borderColor: '#FFC84D',
    backgroundColor: '#FFF8E6',
  },
  roomPickerItemDisabled: {
    opacity: 0.6,
  },
  roomPickerTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: rf(13.5),
    color: '#111827',
    marginBottom: getResponsiveHeight(4),
  },
  roomPickerTitleSelected: {
    color: '#7A4E00',
  },
  roomPickerPreview: {
    fontFamily: 'Pretendard-Regular',
    fontSize: rf(12),
    color: '#6B7280',
  },
  roomPickerEmptyText: {
    paddingVertical: getResponsiveHeight(12),
    fontFamily: 'Pretendard-Regular',
    fontSize: rf(13),
    color: '#6B7280',
    textAlign: 'center',
  },
  roomPickerConfirmDisabled: {
    opacity: 0.45,
  },
  emptyText: {
    marginTop: getResponsiveHeight(36),
    paddingHorizontal: getResponsiveWidth(20),
    fontSize: EMPTY_STYLE().emptyFontSize,
    fontFamily: EMPTY_STYLE().emptyFontFamily,
    color: EMPTY_STYLE().emptyColor,
    lineHeight: rf(22),
    alignSelf: 'center',
    textAlign: 'center',
    textAlignVertical: 'center',
  },

  }));

  const {cardWidth} = useCalendarLayout();
  const dispatch = useDispatch();
  const fallbackFamilyId = useSelector(
    state => state?.family?.familyId ?? state?.user?.familyId ?? null,
  );
  const fallbackUserId = useSelector(state => state?.user?.userId ?? null);
  const chatRoomList = useSelector(state =>
    Array.isArray(state?.chatRoom?.chatRoomList)
      ? state.chatRoom.chatRoomList
      : [],
  );
  const chatRoomLoading = useSelector(state => !!state?.chatRoom?.loading);
  const effectiveFamilyId = familyIdProp ?? fallbackFamilyId;
  const effectiveUserId = currentUserId ?? fallbackUserId;

  const hookResult =
    useScheduleListByDate(selectedDate, refreshTrigger, familyIdProp) || {};

  const individual = hookResult.individual ?? hookResult.personal ?? [];
  const family = hookResult.family ?? hookResult.shared ?? [];
  const anniversary = hookResult.anniversary ?? [];

  const {ymd: dateYmd, dowShort: dateDow} =
    useFormattedScheduleDate(selectedDate);

  const hasBirthday = Array.isArray(birthdayNames) && birthdayNames.length > 0;

  const displayNames =
    birthdayNames.length > 2
      ? `${birthdayNames.slice(0, 2).join(', ')} 외 ${
          birthdayNames.length - 2
        }명`
      : birthdayNames.join(', ');

  const [birthdayModalVisible, setBirthdayModalVisible] = useState(false);
  const [chatRoomPickerVisible, setChatRoomPickerVisible] = useState(false);
  const [selectedChatRoomId, setSelectedChatRoomId] = useState(null);
  const [birthdayMessageDraft, setBirthdayMessageDraft] = useState('');
  const [sendingBirthdayMessage, setSendingBirthdayMessage] = useState(false);
  const openPickerTimerRef = useRef(null);

  const openBirthdayModal = useCallback(() => {
    if (!hasBirthday) return;
    setBirthdayModalVisible(true);
  }, [hasBirthday]);

  const closeBirthdayModal = useCallback(() => {
    setBirthdayModalVisible(false);
  }, []);

  const closeChatRoomPicker = useCallback(() => {
    if (sendingBirthdayMessage) return;
    setChatRoomPickerVisible(false);
    setSelectedChatRoomId(null);
  }, [sendingBirthdayMessage]);

  useEffect(() => {
    return () => {
      if (openPickerTimerRef.current) {
        clearTimeout(openPickerTimerRef.current);
        openPickerTimerRef.current = null;
      }
    };
  }, []);

  const namesText = useMemo(() => {
    if (!hasBirthday) return '';
    return `${displayNames} 🎉`;
  }, [hasBirthday, displayNames]);

  const chatRoomItems = useMemo(
    () =>
      (chatRoomList || [])
        .filter(room => room?.chatRoomId != null)
        .map(room => ({
          id: String(room.chatRoomId),
          title: String(room.roomName || '이름 없는 채팅방'),
          preview: String(room.latestMessageContent || ''),
        })),
    [chatRoomList],
  );

  const handleBirthdaySendPress = useCallback(
    async messageText => {
      const nextMessage = String(messageText || '').trim();
      if (!nextMessage) return;

      setBirthdayMessageDraft(nextMessage);
      setBirthdayModalVisible(false);
      setSelectedChatRoomId(null);
      if (openPickerTimerRef.current) clearTimeout(openPickerTimerRef.current);
      InteractionManager.runAfterInteractions(() => {
        openPickerTimerRef.current = setTimeout(() => {
          setChatRoomPickerVisible(true);
          openPickerTimerRef.current = null;
        }, 240);
      });

      if (!effectiveFamilyId || effectiveUserId == null) return;
      await dispatch(
        fetchChatRoomListThunk(effectiveFamilyId, effectiveUserId),
      );
    },
    [effectiveFamilyId, effectiveUserId, dispatch],
  );

  const handlePickChatRoomAndSend = useCallback(
    async roomId => {
      if (!roomId) return;
      if (sendingBirthdayMessage) return;
      if (effectiveUserId == null) {
        Alert.alert('전송 실패', '사용자 정보를 확인할 수 없어요.');
        return;
      }

      setSelectedChatRoomId(String(roomId));
      setSendingBirthdayMessage(true);

      try {
        const res = await dispatch(
          sendMessageWsThunk(
            {
              content: birthdayMessageDraft,
              messageType: 'text',
            },
            String(roomId),
            effectiveUserId,
          ),
        );

        if (res?.ok) {
          setChatRoomPickerVisible(false);
          setSelectedChatRoomId(null);
          Alert.alert('전송 완료', '선택한 채팅방에 축하 메시지를 보냈어요.');
          return;
        }

        Alert.alert(
          '전송 실패',
          '메시지를 보내지 못했어요. 잠시 후 다시 시도해주세요.',
        );
      } catch (e) {
        Alert.alert('전송 실패', e?.message || '메시지를 보내지 못했어요.');
      } finally {
        setSendingBirthdayMessage(false);
      }
    },
    [birthdayMessageDraft, effectiveUserId, dispatch, sendingBirthdayMessage],
  );

  const handlePickChatRoomOnly = useCallback(
    roomId => {
      if (!roomId) return;
      if (sendingBirthdayMessage) return;
      setSelectedChatRoomId(String(roomId));
    },
    [sendingBirthdayMessage],
  );

  const handleConfirmPickedChatRoomSend = useCallback(() => {
    if (sendingBirthdayMessage) return;
    if (!selectedChatRoomId) {
      Alert.alert('채팅방 선택', '먼저 보낼 채팅방을 선택해주세요.');
      return;
    }
    handlePickChatRoomAndSend(selectedChatRoomId);
  }, [sendingBirthdayMessage, selectedChatRoomId, handlePickChatRoomAndSend]);

  useEffect(() => {
    if (!chatRoomPickerVisible) return;
    if (chatRoomItems.length > 0) return;
    if (!effectiveFamilyId || effectiveUserId == null) return;

    dispatch(fetchChatRoomListThunk(effectiveFamilyId, effectiveUserId));
  }, [
    chatRoomPickerVisible,
    chatRoomItems.length,
    effectiveFamilyId,
    effectiveUserId,
    dispatch,
  ]);

  // type 판별 로직
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

  /** 개인 일정 참여자 목록 (프로필 사진·이름). 앱 사용자가 있으면 맨 앞에 배치 */
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
          u => String(u?.userId) === String(id) || String(u?.id) === String(id),
        );
        const name =
          user?.name ?? user?.nickname ?? names[i] ?? item?.userName ?? '가족';
        const imageUri = resolveMemberProfileUri(user);
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
    const merged = [...anniversary, ...family, ...individual];
    if (!viewFilterUserIds?.length) return merged;
    return merged.filter(item =>
      scheduleItemMatchesViewFilter(item, viewFilterUserIds),
    );
  }, [anniversary, family, individual, viewFilterUserIds]);

  const unfilteredCount =
    anniversary.length + family.length + individual.length;

  return (
    <View style={styles.container}>
      {!!dateYmd && (
        <>
          <View style={styles.calendarDividerWrap}>
            <View style={[styles.calendarDividerLine, {width: cardWidth}]} />
          </View>
          <View style={styles.dateRow}>
            <DropShadow
              style={[styles.dateDropShadow, {width: cardWidth}]}>
              <View style={styles.dateSurface}>
                <View style={styles.dateInner}>
                  <AppText allowFontScaling={false} style={styles.dateTextYmd}>
                    {dateYmd}
                  </AppText>
                  {!!dateDow && (
                    <>
                      <AppText
                        allowFontScaling={false}
                        style={styles.dateTextSep}>
                        ·
                      </AppText>
                      <AppText
                        allowFontScaling={false}
                        style={styles.dateTextDow}>
                        {dateDow}요일
                      </AppText>
                    </>
                  )}
                </View>
              </View>
            </DropShadow>
          </View>
        </>
      )}

      {hasBirthday && (
        <ScheduleCardShadow styles={styles}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={openBirthdayModal}
            style={[styles.cardWrap, styles.roundPillWrap]}>
            <View style={styles.cardAccentStrip} />
            <View style={styles.cardBody}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardLeft}>
                  <View
                    style={[
                      styles.iconCircle,
                      {backgroundColor: COLOR.YELLOW_BG},
                    ]}>
                    <AppText allowFontScaling={false} style={styles.iconText}>
                      🎂
                    </AppText>
                  </View>

                  <View style={styles.texts}>
                    <AppText allowFontScaling={false} style={styles.subtitle}>
                      {displayNames}
                    </AppText>
                    <AppText
                      allowFontScaling={false}
                      style={styles.title}
                      numberOfLines={1}>
                      {displayNames}님의 생일이에요
                    </AppText>
                  </View>
                </View>

                <View style={[styles.pill, {backgroundColor: COLOR.YELLOW_PILL}]}>
                  <AppText
                    allowFontScaling={false}
                    style={[styles.pillText, {color: COLOR.YELLOW_TEXT}]}>
                    기념일
                  </AppText>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </ScheduleCardShadow>
      )}

      <BirthdayConfettiModal
        visible={birthdayModalVisible}
        onClose={closeBirthdayModal}
        onSendMessage={handleBirthdaySendPress}
        sendingMessage={sendingBirthdayMessage}
        title="생일 축하해요! 🎂"
        subText="오늘은 축하를 듬뿍 받아야 하는 날이에요"
        namesText={namesText}
      />

      <CustomModal
        visible={chatRoomPickerVisible}
        onClose={closeChatRoomPicker}
        onConfirm={handleConfirmPickedChatRoomSend}
        closeOnBackdropPress={false}
        closeText="취소"
        confirmText={sendingBirthdayMessage ? '전송 중...' : '보내기'}
        title="보낼 채팅방 선택"
        subText="채팅방을 고른 뒤 보내기 버튼을 눌러 전송해주세요."
        modalBoxStyle={styles.roomPickerModalBox}
        contentStyle={styles.roomPickerContent}
        confirmButtonStyle={
          !selectedChatRoomId || sendingBirthdayMessage
            ? styles.roomPickerConfirmDisabled
            : null
        }>
        {chatRoomLoading && chatRoomItems.length === 0 ? (
          <AppText allowFontScaling={false} style={styles.roomPickerEmptyText}>
            채팅방 목록을 불러오는 중이에요...
          </AppText>
        ) : chatRoomItems.length === 0 ? (
          <AppText allowFontScaling={false} style={styles.roomPickerEmptyText}>
            보낼 수 있는 채팅방이 없어요.
          </AppText>
        ) : (
          <ScrollView
            style={styles.roomPickerList}
            contentContainerStyle={styles.roomPickerListContent}
            showsVerticalScrollIndicator={false}>
            {chatRoomItems.map(room => {
              const selected = selectedChatRoomId === room.id;
              return (
                <TouchableOpacity
                  key={room.id}
                  activeOpacity={0.88}
                  disabled={sendingBirthdayMessage}
                  onPress={() => handlePickChatRoomOnly(room.id)}
                  style={[
                    styles.roomPickerItem,
                    selected && styles.roomPickerItemSelected,
                    sendingBirthdayMessage && styles.roomPickerItemDisabled,
                  ]}>
                  <AppText
                    allowFontScaling={false}
                    style={[
                      styles.roomPickerTitle,
                      selected && styles.roomPickerTitleSelected,
                    ]}
                    numberOfLines={1}>
                    {room.title}
                  </AppText>
                  <AppText
                    allowFontScaling={false}
                    style={styles.roomPickerPreview}
                    numberOfLines={1}>
                    {room.preview || '최근 메시지가 없어요.'}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </CustomModal>

      <View style={styles.timelineWrapper}>
        <View style={styles.scheduleCards}>
          {mergedForRender.map(item => {
            const preset = getCardPreset(item);
            const ownerLabel =
              preset.type === TYPE.ANNIVERSARY ? '가족' : getMemberLabel(item);

            return (
              <ScheduleCard
                styles={styles}
                key={item.scheduleId ?? `${preset.type}-${item.title}`}
                // FIX: 카드에서 판별한 type을 강제로 전달
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
                        <AppText allowFontScaling={false} style={styles.iconText}>
                          {preset.icon}
                        </AppText>
                      </View>
                    ) : (
                      <StackedAvatar
                        styles={styles}
                        participants={getIndividualParticipants(item)}
                      />
                    )}

                    <View style={styles.texts}>
                      <AppText allowFontScaling={false} style={styles.subtitle}>
                        {ownerLabel}
                      </AppText>
                      <AppText allowFontScaling={false} style={styles.title}>
                        {item.title || '제목 없음'}
                      </AppText>
                    </View>
                  </View>

                  <View style={[styles.pill, {backgroundColor: preset.pillBg}]}>
                    <AppText
                      allowFontScaling={false}
                      style={[styles.pillText, {color: preset.pillTextColor}]}>
                      {preset.pillText}
                    </AppText>
                  </View>
                </View>
              </ScheduleCard>
            );
          })}

          {mergedForRender.length === 0 && (
            <AppText allowFontScaling={false} style={styles.emptyText}>
              {unfilteredCount === 0
                ? '일정이 비어 있어요.\n새로운 일정을 추가해볼까요?'
                : '선택한 사람과 관련된 일정이 없어요.'}
            </AppText>
          )}
        </View>
      </View>
    </View>
  );
}

export default React.memo(Schedule);


