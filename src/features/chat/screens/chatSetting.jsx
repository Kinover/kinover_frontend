/* =========================================================
 * ✅ src/features/chat/components/ChatSettings.jsx
 * - AddChatMemberScreen에서 “채팅방 화면 route params”에 merge로 심은
 *   invitedToast / invitedCount / invitedMessage 를 읽어서 토스트 띄움
 * - 읽은 뒤에는 “채팅방 화면 params”에서 제거(중복 방지)
 * - (중요) ChatSettings는 Screen이 아닌 “패널 컴포넌트”일 수 있어
 *   useRoute/useFocusEffect 사용 시 "Couldn't find a route object" 크래시 가능
 *   → navigation.getState()로 현재 route를 직접 찾아 params 처리
 * ========================================================= */

import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Layout,
  FadeInUp,
  FadeOutUp,
} from 'react-native-reanimated';

import {useSelector, useDispatch} from 'react-redux';

import {
  fetchChatRoomUsersThunk,
  renameChatRoomForMeThunk,
  toggleChatRoomNotificationThunk,
  fetchChatRoomMediaThunk,
} from '../store/chatRoomThunk';

import LeaveChatRoomModal from '../components/leaveChatRoomModal';
import RenameChatRoomModal from '../components/renameChatRoomModal';
import ChangeKinoModal from '../components/ChangeKinoModal';
import MediaModal from '../components/mediaModal';

import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../utils/responsive';

import {
  bumpChatRoomToTop,
  updateChatRoomNameInList,
} from '../store/chatRoomSlice';

import ToastModal from '../../../components/ToastModal';
import {resetRoomMessageList} from '../store/messageSlice';
import {BACKGROUND_COLORS, COLORS} from 'styles/style';
import {FONT_MODE} from 'store/uiSlice';

/** ✅ 섹션 row 공용 버튼 */
const SectionRowButton = React.memo(function SectionRowButton({
  onPress,
  children,
  styles,
  disabled = false,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={{color: 'rgba(17,24,39,0.06)'}}
      style={({pressed}) => [
        styles.sectionRowBtn,
        pressed && !disabled && styles.sectionRowPressed,
        disabled && {opacity: 0.55},
      ]}>
      {children}
    </Pressable>
  );
});

export default function ChatSettings({
  isOpen,
  onClose,
  onLeaveChat,
  chatRoomId,
  navigation,
  isKino,
  onOpenAddMember, // ✅ 추가
}) {
  const tint_color = 'black';
  const dispatch = useDispatch();

  const fontMode = useSelector(state => state.ui.fontMode);
  const hideHeaderSubtitle = fontMode === FONT_MODE.EXTRA_LARGE;

  const fontMul = useMemo(() => {
    if (fontMode === FONT_MODE.EXTRA_LARGE) return 1.22;
    if (fontMode === FONT_MODE.LARGE) return 1.12;
    return 1.0;
  }, [fontMode]);

  const rf = useCallback(
    n => Math.round(getResponsiveFontSize(n) * fontMul),
    [fontMul],
  );

  const styles = useMemo(() => makeStyles(rf), [rf]);

  const [isChangeKinoModalVisible, setIsChangeKinoModalVisible] =
    useState(false);
  const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);

  const [newRoomName, setNewRoomName] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [isAlarmOn, setIsAlarmOn] = useState(true);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const chatRoomUsers = useSelector(state => state.chatRoom.chatRoomUsers);
  const userId = useSelector(state => state.user.userId);
  const familyMembers = useSelector(
    state => state.userFamily.familyUserList || [],
  );

  const chatRoomList = useSelector(state => state.chatRoom.chatRoomList || []);
  const rid = chatRoomId == null ? null : String(chatRoomId);
  const currentRoom = chatRoomList.find(
    room => String(room.chatRoomId) === rid,
  );
  const currentRoomName = currentRoom?.roomName ?? '';

  const COLS = 3;

  const isAllFamilyInChat =
    Array.isArray(familyMembers) &&
    familyMembers.length > 0 &&
    Array.isArray(chatRoomUsers) &&
    chatRoomUsers.length >= familyMembers.length;

  // =========================================================
  // ✅ 패널 슬라이드
  // =========================================================
  const panelW = getResponsiveWidth(310);
  const translateX = useSharedValue(panelW);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  const [internalVisible, setInternalVisible] = useState(false);
  const closeTimerRef = useRef(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  useEffect(() => {
    clearCloseTimer();

    if (isOpen) {
      setInternalVisible(true);
      translateX.value = withTiming(0, {duration: 240});
    } else {
      translateX.value = withTiming(panelW, {duration: 240});
      closeTimerRef.current = setTimeout(() => setInternalVisible(false), 240);
    }

    return () => clearCloseTimer();
  }, [isOpen, panelW, translateX]);

  useEffect(() => () => clearCloseTimer(), []);

  // =========================================================
  // ✅ 핵심: 현재 “채팅방 화면 route params” 읽기 (useRoute 금지)
  // =========================================================
  const getCurrentRouteInfo = useCallback(() => {
    // navigation이 없거나 getState 없으면 안전하게 null 처리
    const state = navigation?.getState?.();
    const routes = state?.routes || [];
    const index =
      typeof state?.index === 'number' ? state.index : routes.length - 1;
    const current = routes?.[index];

    return {
      currentRouteName: current?.name,
      currentParams: current?.params || {},
    };
  }, [navigation]);

  const clearInvitedToastParams = useCallback(() => {
    // ✅ “현재 화면(=채팅방 화면)” params 제거
    // setParams는 현재 route에 걸리므로 여기서는 가장 정확한 제거 방식
    try {
      navigation?.setParams?.({
        invitedToast: undefined,
        invitedCount: undefined,
        invitedMessage: undefined,
      });
    } catch (e) {
      // 혹시 setParams가 안 먹는 특수 구조면 merge navigate로 한번 더
      const {currentRouteName} = getCurrentRouteInfo();
      if (!currentRouteName) return;
      try {
        navigation?.navigate?.({
          name: currentRouteName,
          params: {
            invitedToast: undefined,
            invitedCount: undefined,
            invitedMessage: undefined,
          },
          merge: true,
        });
      } catch (e2) {
        null;
      }
    }
  }, [navigation, getCurrentRouteInfo]);

  // ✅ 패널이 “열릴 때” 한 번 체크해서 토스트 띄우는 구조
  useEffect(() => {
    if (!isOpen) return;

    const {currentParams} = getCurrentRouteInfo();
    const invitedToast = currentParams?.invitedToast;
    const invitedCount = currentParams?.invitedCount;
    const invitedMessage = currentParams?.invitedMessage;

    if (invitedToast) {
      const msg =
        invitedMessage ||
        (typeof invitedCount === 'number'
          ? `${invitedCount}명을 초대했어요.`
          : '멤버를 초대했어요.');

      setToastMessage(msg);
      setToastVisible(true);

      clearInvitedToastParams();

      if (chatRoomId) {
        dispatch(fetchChatRoomUsersThunk(chatRoomId));
      }
    }
  }, [
    isOpen,
    chatRoomId,
    dispatch,
    getCurrentRouteInfo,
    clearInvitedToastParams,
  ]);

  // =========================================================
  // ✅ 미디어 상태
  // =========================================================
  const [mediaType, setMediaType] = useState('ALL');
  const [mediaItems, setMediaItems] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaOpened, setMediaOpened] = useState(false);

  const MEDIA_PREVIEW_LIMIT = 9;

  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [modalMediaItems, setModalMediaItems] = useState([]);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);

  const fetchingFirstRef = useRef(false);

  const gridGap = getResponsiveWidth(6);
  const innerBoxPad = getResponsiveWidth(14);

  const gridInnerWidth = useMemo(() => {
    return panelW - getResponsiveWidth(34) * 2 - 2;
  }, [panelW]);

  const cellSize = useMemo(() => {
    const usable = gridInnerWidth - gridGap * (COLS - 1);
    return Math.max(0, Math.floor(usable / COLS));
  }, [gridInnerWidth, gridGap, COLS]);

  const pickThumbUri = item =>
    item?.thumbnailUrl ||
    item?.thumbUrl ||
    item?.imageUrl ||
    item?.videoThumbnailUrl ||
    item?.url ||
    (Array.isArray(item?.imageUrls) ? item.imageUrls[0] : null) ||
    (Array.isArray(item?.mediaUrls) ? item.mediaUrls[0] : null) ||
    null;

  const pickMediaUri = item =>
    item?.url ||
    item?.imageUrl ||
    item?.videoUrl ||
    (Array.isArray(item?.imageUrls) ? item.imageUrls[0] : null) ||
    (Array.isArray(item?.mediaUrls) ? item.mediaUrls[0] : null) ||
    null;

  const normalizeMediaType = item => {
    const t = String(item?.messageType || item?.type || '').toUpperCase();
    if (t.includes('VIDEO')) return 'VIDEO';
    if (t.includes('IMAGE') || t.includes('PHOTO')) return 'IMAGE';
    return 'FILE';
  };

  const getMediaKey = item =>
    item?.messageId ||
    item?.id ||
    item?.uuid ||
    item?.mediaId ||
    pickMediaUri(item) ||
    null;

  const fetchMediaFirst = async (nextType = mediaType) => {
    if (!chatRoomId) return;
    if (fetchingFirstRef.current) return;

    fetchingFirstRef.current = true;
    setMediaLoading(true);

    try {
      const res = await dispatch(
        fetchChatRoomMediaThunk({
          chatRoomId,
          type: nextType,
          before: null,
          limit: 30,
        }),
      ).unwrap();

      const items = Array.isArray(res?.items) ? res.items : [];
      setMediaItems(items);
    } catch (e) {
      console.warn('❌ fetchMediaFirst 실패:', e);
      setMediaItems([]);
    } finally {
      setMediaLoading(false);
      fetchingFirstRef.current = false;
    }
  };

  const onChangeMediaType = async t => {
    const upper = String(t).toUpperCase();
    setMediaType(upper);
    await fetchMediaFirst(upper);
  };

  const mediaGridData = useMemo(() => {
    if (!Array.isArray(mediaItems)) return [];
    return mediaItems.slice(0, MEDIA_PREVIEW_LIMIT);
  }, [mediaItems]);

  const showMoreButton =
    mediaOpened &&
    Array.isArray(mediaItems) &&
    mediaItems.length > MEDIA_PREVIEW_LIMIT;

  const openMediaModal = useCallback(
    (pressedItem, pressedIndexInGrid) => {
      const pressedKind = normalizeMediaType(pressedItem);
      const pressedUri = pickMediaUri(pressedItem);
      if (!pressedUri) return;
      if (pressedKind === 'FILE') return;

      const allowKind =
        mediaType === 'ALL'
          ? ['IMAGE', 'VIDEO']
          : mediaType === 'IMAGE'
          ? ['IMAGE']
          : ['VIDEO'];

      const list = (mediaItems || [])
        .map(it => {
          const kind = normalizeMediaType(it);
          const url = pickMediaUri(it);
          const thumb = pickThumbUri(it) || url;
          return {kind, url, thumb};
        })
        .filter(x => allowKind.includes(x.kind) && !!x.url);

      if (!list.length) return;

      const foundIndex = list.findIndex(
        x => String(x.url) === String(pressedUri),
      );
      const nextIndex =
        foundIndex >= 0 ? foundIndex : Math.max(0, pressedIndexInGrid || 0);

      setModalMediaItems(list);
      setModalInitialIndex(nextIndex);
      setMediaModalVisible(true);
    },
    [mediaItems, mediaType],
  );

  const closeMediaModal = useCallback(() => {
    setMediaModalVisible(false);
    setTimeout(() => {
      setModalMediaItems([]);
      setModalInitialIndex(0);
    }, 0);
  }, []);

  const goToMediaPage = useCallback(() => {
    if (!chatRoomId) return;
    onClose();
    setTimeout(() => {
      navigation.navigate('채팅방미디어모아보기화면', {
        chatRoomId,
        initialType: mediaType,
      });
    }, 220);
  }, [chatRoomId, navigation, mediaType, onClose]);

  // =========================================================
  // 기존 로직
  // =========================================================
  useEffect(() => {
    if (isOpen && chatRoomId) dispatch(fetchChatRoomUsersThunk(chatRoomId));
  }, [isOpen, chatRoomId, dispatch]);

  useEffect(() => {
    if (!currentRoom) return;
    setIsAlarmOn(!!currentRoom.notificationOn);
  }, [currentRoom]);

  useEffect(() => {
    if (!toastVisible) return;
    const timer = setTimeout(() => setToastVisible(false), 1800);
    return () => clearTimeout(timer);
  }, [toastVisible]);

  useEffect(() => {
    if (!isOpen) return;
    if (!chatRoomId) return;
    if (!mediaOpened) return;
    fetchMediaFirst(mediaType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, chatRoomId, mediaOpened]);

  const handleToggleAlarm = () => {
    const newIsOn = !isAlarmOn;
    setIsAlarmOn(newIsOn);

    dispatch(
      toggleChatRoomNotificationThunk({
        chatRoomId,
        userId,
        isOn: newIsOn,
      }),
    )
      .unwrap()
      .then(() => {
        setToastMessage(newIsOn ? '알림을 켰어요.' : '알림을 껐어요.');
        setToastVisible(true);
      })
      .catch(err => {
        console.warn('❌ 알림 설정 변경 실패:', err);
        setIsAlarmOn(!newIsOn);
        setToastMessage('알림 설정 변경에 실패했어요.\n다시 시도해 주세요.');
        setToastVisible(true);
      });
  };

  const handleRenameChatRoom = () => {
    const nextName = newRoomName.trim();
    if (!nextName) return;

    dispatch(renameChatRoomForMeThunk({chatRoomId, roomName: nextName}))
      .unwrap()
      .then(() => {
        dispatch(updateChatRoomNameInList({chatRoomId, newRoomName: nextName}));
        setIsRenameModalVisible(false);
        setNewRoomName('');
        setToastMessage('채팅방 이름을 바꿨어요.');
        setToastVisible(true);
      })
      .catch(err => {
        const msg =
          typeof err === 'string'
            ? err
            : err?.message
            ? err.message
            : JSON.stringify(err);

        setToastMessage(`이름 변경 실패: ${msg}`);
        setToastVisible(true);
      });
  };
  // 채팅방 Screen 내부 (예: header 버튼, 설정 패널에서 멤버추가 누르는 트리거 등)

  const openAddMember = () => {
    navigation.navigate('채팅방멤버추가화면', {
      chatRoomId,
      onInvited: ({count, message}) => {
        // ✅ 1) 채팅방 Screen의 route params에 토스트 트리거를 "직접" 박기 (가장 안전)
        navigation.setParams({
          invitedToast: true,
          invitedCount: count,
          invitedMessage: message,
        });

        // ✅ 2) 필요하면 여기서 바로 목록 갱신도 가능 (채팅방 users 재조회)
        // dispatch(fetchChatRoomUsersThunk(chatRoomId));
      },
    });
  };

  const handleShowMembers = () => {
    onClose();

    // ✅ AddChatMemberScreen이 “채팅방 Screen name”을 알 수 있게 현재 route.name 넘김
    const {currentRouteName} = getCurrentRouteInfo();
    const chatRoomScreenName = currentRouteName || '채팅방화면';

    openAddMember();
  };

  const handleLeaveConfirm = () => {
    onClose();
    setIsLeaveModalVisible(false);
    onLeaveChat(dispatch, navigation, chatRoomId);
  };

  const handleGoToKinoSelect = () => {
    if (!chatRoomId) return;

    dispatch(resetRoomMessageList(chatRoomId));
    dispatch(bumpChatRoomToTop(chatRoomId));

    onClose();
    setTimeout(() => navigation.navigate('키노선택화면', {chatRoomId}), 260);
  };

  const listData = useMemo(() => [], []);
  const renderEmpty = useCallback(() => null, []);

  const MediaPreviewGrid = useMemo(() => {
    if (!mediaOpened) return null;

    if (mediaLoading) {
      return (
        <View style={styles.mediaLoadingBox}>
          <ActivityIndicator />
          <Text allowFontScaling={false} style={styles.helperText}>
            불러오는 중…
          </Text>
        </View>
      );
    }

    if (mediaItems.length === 0) {
      return (
        <Text allowFontScaling={false} style={styles.helperText}>
          아직 모아볼 미디어가 없어요.
        </Text>
      );
    }

    return (
      <View style={{marginTop: getResponsiveHeight(10)}}>
        <View style={styles.gridWrapCenter}>
          <FlatList
            data={mediaGridData}
            keyExtractor={(item, index) =>
              `${String(getMediaKey(item) ?? 'noid')}_${index}`
            }
            numColumns={COLS}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
            columnWrapperStyle={{
              columnGap: gridGap,
              marginBottom: gridGap,
            }}
            renderItem={({item, index}) => {
              const thumb = pickThumbUri(item) || pickMediaUri(item);
              const kind = normalizeMediaType(item);

              return (
                <TouchableOpacity
                  style={[
                    styles.mediaCell,
                    {width: cellSize, height: cellSize},
                  ]}
                  activeOpacity={0.9}
                  onPress={() => openMediaModal(item, index)}>
                  {thumb ? (
                    <Image source={{uri: thumb}} style={styles.mediaThumb} />
                  ) : (
                    <View style={styles.mediaPlaceholder}>
                      <Text
                        allowFontScaling={false}
                        style={styles.mediaPlaceholderText}>
                        {kind === 'VIDEO' ? 'VIDEO' : 'FILE'}
                      </Text>
                    </View>
                  )}

                  {kind === 'VIDEO' && (
                    <View style={styles.videoBadge}>
                      <Text
                        allowFontScaling={false}
                        style={styles.videoBadgeText}>
                        영상
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {showMoreButton && (
          <TouchableOpacity
            style={styles.moreButton}
            onPress={goToMediaPage}
            activeOpacity={0.9}>
            <Text allowFontScaling={false} style={styles.moreButtonText}>
              더 보기
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [
    mediaOpened,
    mediaLoading,
    mediaItems,
    mediaGridData,
    cellSize,
    gridGap,
    showMoreButton,
    goToMediaPage,
    openMediaModal,
    COLS,
    styles,
  ]);

  const SectionDivider = useCallback(() => {
    return <View style={styles.sectionDivider} />;
  }, [styles]);

  const Header = useMemo(() => {
    return (
      <View>
        {!isKino && (
          <View style={styles.sectionWrap}>
            <SectionRowButton
              styles={styles}
              onPress={() => setIsRenameModalVisible(true)}>
              <View style={styles.sectionRow}>
                <View style={styles.sectionTextBox}>
                  <Text allowFontScaling={false} style={styles.sectionTitle}>
                    채팅방 이름
                  </Text>
                  {!hideHeaderSubtitle && (
                    <Text allowFontScaling={false} style={styles.sectionDesc}>
                      내 화면에서 보이는 이름을 바꿔요.
                    </Text>
                  )}
                </View>
              </View>
            </SectionRowButton>
          </View>
        )}

        {!isKino && <SectionDivider />}

        {!isKino && (
          <View style={styles.sectionWrap}>
            <SectionRowButton
              styles={styles}
              onPress={() => setShowMembers(prev => !prev)}>
              <View style={styles.sectionRow}>
                <View style={styles.sectionTextBox}>
                  <Text allowFontScaling={false} style={styles.sectionTitle}>
                    멤버 목록
                  </Text>
                  {!hideHeaderSubtitle && (
                    <Text allowFontScaling={false} style={styles.sectionDesc}>
                      함께 채팅하는 멤버를 확인해요.
                    </Text>
                  )}
                </View>

                <Image
                  source={require('../../../assets/images/down-yellow.png')}
                  style={[
                    styles.chevronDown,
                    {transform: [{rotate: showMembers ? '180deg' : '0deg'}]},
                  ]}
                  tintColor={tint_color}
                />
              </View>
            </SectionRowButton>

            {showMembers && (
              <Animated.View
                layout={Layout.duration(180)}
                entering={FadeInUp.duration(160)}
                exiting={FadeOutUp.duration(140)}
                style={{
                  overflow: 'hidden',
                  paddingHorizontal: getResponsiveWidth(20),
                }}>
                <View style={styles.memberBox}>
                  {chatRoomUsers?.map((user, idx) => (
                    <View
                      key={`${user?.userId ?? 'u'}_${idx}`}
                      style={styles.memberItem}>
                      <Image
                        source={{uri: user.image}}
                        style={styles.memberImage}
                      />
                      <Text allowFontScaling={false} style={styles.memberName}>
                        {user.name}
                      </Text>
                    </View>
                  ))}

                  {!isAllFamilyInChat && (
                    <TouchableOpacity
                      onPress={() => {
                        onClose(); // 설정창 닫고
                        onOpenAddMember?.(); // ✅ 부모(스크린)에서 이동 + 토스트 처리
                      }}
                      style={styles.inviteBtn}
                      activeOpacity={0.9}>
                      <Image
                        source={require('../../../assets/images/addMember-bt.png')}
                        style={styles.addIcon}
                      />
                      <Text allowFontScaling={false} style={styles.inviteText}>
                        새 멤버 초대
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            )}
          </View>
        )}

        {isKino ? (
          <View style={styles.sectionWrap}>
            <SectionRowButton
              styles={styles}
              onPress={() => setIsChangeKinoModalVisible(true)}>
              <View style={styles.sectionRow}>
                <View style={styles.sectionTextBox}>
                  <Text allowFontScaling={false} style={styles.sectionTitle}>
                    키노 교체하기
                  </Text>
                  {!hideHeaderSubtitle && (
                    <Text allowFontScaling={false} style={styles.sectionDesc}>
                      새로운 키노를 만나볼래요.
                    </Text>
                  )}
                </View>
              </View>
            </SectionRowButton>
          </View>
        ) : (
          <>
            <SectionDivider />

            <View style={styles.sectionWrap}>
              <SectionRowButton
                styles={styles}
                onPress={() => {
                  const next = !mediaOpened;
                  setMediaOpened(next);
                  if (next) fetchMediaFirst(mediaType);
                }}>
                <View style={styles.sectionRow}>
                  <View style={styles.sectionTextBox}>
                    <Text allowFontScaling={false} style={styles.sectionTitle}>
                      미디어
                    </Text>
                    {!hideHeaderSubtitle && (
                      <Text allowFontScaling={false} style={styles.sectionDesc}>
                        사진/영상을 한눈에 모아봐요.
                      </Text>
                    )}
                  </View>

                  <Image
                    tintColor={tint_color}
                    source={require('../../../assets/images/down-yellow.png')}
                    style={[
                      styles.chevronDown,
                      {transform: [{rotate: mediaOpened ? '180deg' : '0deg'}]},
                    ]}
                  />
                </View>
              </SectionRowButton>

              {mediaOpened && (
                <Animated.View
                  layout={Layout.duration(180)}
                  entering={FadeInUp.duration(160)}
                  exiting={FadeOutUp.duration(140)}
                  style={{
                    overflow: 'hidden',
                    paddingHorizontal: getResponsiveWidth(20),
                  }}>
                  <View
                    style={[styles.mediaBox, {paddingHorizontal: innerBoxPad}]}>
                    <View style={styles.mediaTabs}>
                      {['ALL', 'IMAGE', 'VIDEO'].map(t => {
                        const active = mediaType === t;
                        return (
                          <TouchableOpacity
                            key={t}
                            onPress={() => onChangeMediaType(t)}
                            style={[
                              styles.mediaTab,
                              active && styles.mediaTabActive,
                            ]}
                            activeOpacity={0.9}>
                            <Text
                              allowFontScaling={false}
                              style={[
                                styles.mediaTabText,
                                active && styles.mediaTabTextActive,
                              ]}>
                              {t === 'ALL'
                                ? '전체'
                                : t === 'IMAGE'
                                ? '사진'
                                : '영상'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {MediaPreviewGrid}
                  </View>
                </Animated.View>
              )}
            </View>
          </>
        )}

        <View style={{height: getResponsiveHeight(10)}} />
      </View>
    );
  }, [
    isKino,
    mediaOpened,
    mediaType,
    showMembers,
    chatRoomUsers,
    isAllFamilyInChat,
    handleShowMembers,
    MediaPreviewGrid,
    innerBoxPad,
    fetchMediaFirst,
    onChangeMediaType,
    SectionDivider,
    styles,
    hideHeaderSubtitle,
    tint_color,
  ]);

  const Footer = useMemo(
    () => <View style={{height: getResponsiveHeight(10)}} />,
    [],
  );

  if (!internalVisible) return null;

  const LEAVE_BAR_H = getResponsiveHeight(66);

  return (
    <Modal
      visible={internalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View>
        <LeaveChatRoomModal
          visible={isLeaveModalVisible}
          onClose={() => setIsLeaveModalVisible(false)}
          onConfirm={handleLeaveConfirm}
        />

        <RenameChatRoomModal
          visible={isRenameModalVisible}
          onClose={() => {
            setIsRenameModalVisible(false);
            setNewRoomName('');
          }}
          onConfirm={handleRenameChatRoom}
          newRoomName={newRoomName}
          setNewRoomName={setNewRoomName}
          currentRoomName={currentRoomName}
        />

        <ChangeKinoModal
          visible={isChangeKinoModalVisible}
          onClose={() => setIsChangeKinoModalVisible(false)}
          onConfirm={handleGoToKinoSelect}
        />

        <ToastModal
          visible={toastVisible}
          message={toastMessage}
          onClose={() => setToastVisible(false)}
        />

        <MediaModal
          visible={mediaModalVisible}
          mediaItems={modalMediaItems}
          initialIndex={modalInitialIndex}
          onClose={closeMediaModal}
        />
      </View>

      <TouchableOpacity
        style={styles.backdrop}
        onPress={onClose}
        activeOpacity={1}
      />

      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.header}>
          <View style={styles.headerTextBox}>
            <Text allowFontScaling={false} style={styles.headerTitle}>
              채팅방 설정
            </Text>

            {!hideHeaderSubtitle && (
              <Text allowFontScaling={false} style={styles.headerSubtitle}>
                이름 · 멤버 · 알림을 관리해요.
              </Text>
            )}
          </View>

          <Pressable
            onPress={handleToggleAlarm}
            android_ripple={{color: 'rgba(17,24,39,0.08)', borderless: true}}
            hitSlop={10}
            style={({pressed}) => [
              styles.alarmPressable,
              pressed && styles.alarmPressed,
            ]}>
            <View style={styles.alarmBtn}>
              <Image
                tintColor={tint_color}
                style={styles.alarmIcon}
                source={
                  isAlarmOn
                    ? require('../../../assets/images/navigator_alarm-button.png')
                    : require('../../../assets/images/navigator_alarm-button-off4.png')
                }
              />
            </View>
          </Pressable>
        </View>

        <FlatList
          data={listData}
          renderItem={() => null}
          keyExtractor={(_, idx) => `empty_${idx}`}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          contentContainerStyle={{
            paddingBottom: isKino
              ? getResponsiveHeight(24)
              : LEAVE_BAR_H + getResponsiveHeight(28),
          }}
          ListHeaderComponent={Header}
          ListFooterComponent={Footer}
        />

        {!isKino && (
          <View style={[styles.leaveStickyWrap, {height: LEAVE_BAR_H}]}>
            <View style={styles.leaveStickyInner}>
              <View style={styles.leaveDivider} />
              <TouchableOpacity
                style={styles.leaveStickyBtn}
                onPress={() => setIsLeaveModalVisible(true)}
                activeOpacity={0.9}>
                <Text allowFontScaling={false} style={styles.leaveText}>
                  채팅방 나가기
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const makeStyles = rf =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.38)',
    },

    container: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: getResponsiveWidth(310),
      height: '100%',
      backgroundColor: '#FFFFFF',
      borderLeftWidth: 1,
      borderColor: '#EEF2F7',
      paddingBottom: 0,
    },

    header: {
      paddingHorizontal: getResponsiveWidth(20),
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop:
        Platform.OS === 'android'
          ? getResponsiveHeight(34)
          : getResponsiveHeight(66),
      marginBottom: getResponsiveHeight(30),
      alignItems: 'center',
    },

    headerTextBox: {flexShrink: 1, paddingRight: getResponsiveWidth(10)},

    headerTitle: {
      fontSize: rf(19),
      fontFamily: 'Pretendard-SemiBold',
      color: COLORS.textPrimary,
      lineHeight: rf(19),
    },

    headerSubtitle: {
      marginTop: getResponsiveHeight(4),
      fontSize: rf(12),
      fontFamily: 'Pretendard-Regular',
      color: COLORS.textSecondary,
      lineHeight: rf(14),
    },

    alarmBtn: {
      width: getResponsiveIconSize(34),
      height: getResponsiveIconSize(34),
      borderRadius: getResponsiveIconSize(12),
      backgroundColor: BACKGROUND_COLORS.secondaryBg,
      alignItems: 'center',
      justifyContent: 'center',
    },

    alarmIcon: {
      width: getResponsiveIconSize(18),
      height: getResponsiveIconSize(18),
      resizeMode: 'contain',
    },

    sectionWrap: {
      paddingVertical: getResponsiveHeight(14),
    },

    sectionDivider: {
      height: 1,
      width: '93%',
      alignSelf: 'center',
      backgroundColor: '#EEF2F7',
    },

    sectionRowBtn: {
      borderRadius: getResponsiveIconSize(12),
      paddingHorizontal: getResponsiveWidth(6),
      paddingVertical: getResponsiveHeight(10),
      marginHorizontal: getResponsiveWidth(-6),
    },

    sectionRowPressed: {
      backgroundColor: 'rgba(17,24,39,0.06)',
    },

    sectionRow: {
      paddingHorizontal: getResponsiveWidth(20),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    sectionTextBox: {flex: 1, paddingRight: getResponsiveWidth(10)},

    sectionTitle: {
      fontSize: rf(14),
      fontFamily: 'Pretendard-SemiBold',
      color: COLORS.textPrimary,
      lineHeight: rf(16),
    },

    sectionDesc: {
      marginTop: getResponsiveHeight(4),
      fontSize: rf(11),
      fontFamily: 'Pretendard-Regular',
      color: COLORS.textSecondary,
      lineHeight: rf(13),
    },

    chevronDown: {
      width: getResponsiveIconSize(14),
      height: getResponsiveIconSize(14),
      resizeMode: 'contain',
      opacity: 0.85,
    },

    memberBox: {
      marginTop: getResponsiveHeight(12),
      backgroundColor: '#F9FAFB',
      borderRadius: getResponsiveIconSize(12),
      borderWidth: 1,
      borderColor: '#EEF2F7',
      paddingHorizontal: getResponsiveWidth(12),
      paddingVertical: getResponsiveHeight(10),
    },

    memberItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: getResponsiveHeight(6),
    },

    memberImage: {
      width: getResponsiveIconSize(34),
      height: getResponsiveIconSize(34),
      borderRadius: getResponsiveIconSize(17),
      marginRight: getResponsiveWidth(10),
      backgroundColor: '#FFFFFF',
    },

    memberName: {
      fontSize: rf(13.5),
      fontFamily: 'Pretendard-Medium',
      color: '#111827',
    },

    inviteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: getResponsiveHeight(6),
    },

    addIcon: {
      width: getResponsiveIconSize(34),
      height: getResponsiveIconSize(34),
      resizeMode: 'contain',
      marginRight: getResponsiveWidth(10),
    },

    inviteText: {
      fontSize: rf(13),
      color: '#F59E0B',
      fontFamily: 'Pretendard-Medium',
    },

    mediaBox: {
      marginTop: getResponsiveHeight(12),
      backgroundColor: BACKGROUND_COLORS.secondaryBg,
      paddingVertical: getResponsiveHeight(12),
      borderRadius: getResponsiveIconSize(12),
      borderWidth: 1,
      borderColor: '#EEF2F7',
    },

    mediaTabs: {
      flexDirection: 'row',
      columnGap: getResponsiveWidth(6),
    },

    mediaTab: {
      paddingVertical: getResponsiveHeight(6),
      paddingHorizontal: getResponsiveWidth(10),
      borderRadius: getResponsiveIconSize(14),
      backgroundColor: '#F3F4F6',
    },

    mediaTabActive: {backgroundColor: '#FEF3C7'},

    mediaTabText: {
      fontSize: rf(12),
      fontFamily: 'Pretendard-Medium',
      color: '#6B7280',
    },

    mediaTabTextActive: {color: '#B45309'},

    mediaLoadingBox: {
      paddingVertical: getResponsiveHeight(14),
      alignItems: 'center',
      justifyContent: 'center',
      rowGap: getResponsiveHeight(8),
    },

    helperText: {
      alignSelf: 'center',
      fontSize: rf(11.5),
      color: '#6B7280',
      fontFamily: 'Pretendard-Regular',
      paddingVertical: getResponsiveHeight(8),
    },

    gridWrapCenter: {
      width: '100%',
      alignItems: 'center',
    },

    mediaCell: {
      borderRadius: getResponsiveIconSize(10),
      overflow: 'hidden',
      backgroundColor: '#F3F4F6',
    },

    mediaThumb: {width: '100%', height: '100%', resizeMode: 'cover'},

    mediaPlaceholder: {flex: 1, alignItems: 'center', justifyContent: 'center'},

    mediaPlaceholderText: {
      fontSize: rf(11),
      color: '#6B7280',
      fontFamily: 'Pretendard-Medium',
    },

    videoBadge: {
      position: 'absolute',
      right: getResponsiveWidth(6),
      bottom: getResponsiveHeight(6),
      backgroundColor: 'rgba(0,0,0,0.55)',
      paddingHorizontal: getResponsiveWidth(6),
      paddingVertical: getResponsiveHeight(3),
      borderRadius: getResponsiveIconSize(10),
    },

    videoBadgeText: {
      fontSize: rf(10),
      color: '#FFFFFF',
      fontFamily: 'Pretendard-Medium',
    },

    moreButton: {
      marginTop: getResponsiveHeight(6),
      paddingVertical: getResponsiveHeight(10),
      borderRadius: getResponsiveIconSize(12),
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#EEF2F7',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      columnGap: getResponsiveWidth(6),
    },

    moreButtonText: {
      fontSize: rf(12.5),
      color: '#374151',
      fontFamily: 'Pretendard-Medium',
    },

    leaveStickyWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#FFFFFF',
    },

    leaveStickyInner: {
      paddingHorizontal: getResponsiveWidth(20),
      backgroundColor: '#FFFFFF',
    },

    leaveDivider: {
      height: 1,
      backgroundColor: '#EEF2F7',
      marginBottom: getResponsiveHeight(10),
    },

    leaveStickyBtn: {
      paddingVertical: getResponsiveHeight(10),
      alignItems: 'flex-start',
    },

    leaveText: {
      fontFamily: 'Pretendard-Medium',
      color: '#EF4444',
      fontSize: rf(13.5),
    },
    alarmPressable: {
      borderRadius: getResponsiveIconSize(12), // alarmBtn과 동일 라운드
    },

    alarmPressed: {
      backgroundColor: 'rgba(17,24,39,0.06)', // 섹션 hover랑 톤 맞춤
    },
  });
