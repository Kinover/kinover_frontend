// src/features/chat/components/ChatSettings.jsx
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
} from 'react-native';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import {useSelector, useDispatch} from 'react-redux';

import DropShadow from 'react-native-drop-shadow';

import {
  fetchChatRoomUsersThunk,
  renameChatRoomThunk,
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

export default function ChatSettings({
  isOpen,
  onClose,
  onLeaveChat,
  chatRoomId,
  navigation,
  isKino,
}) {
  const dispatch = useDispatch();

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
  const familyId = useSelector(state => state.family.familyId);
  const userId = useSelector(state => state.user.userId);
  const familyMembers = useSelector(
    state => state.userFamily.familyUserList || [],
  );

  const chatRoomList = useSelector(state => state.chatRoom.chatRoomList || []);
  const rid = chatRoomId == null ? null : String(chatRoomId);
  const currentRoom = chatRoomList.find(
    room => String(room.chatRoomId) === rid,
  );

  // ✅ 3열 고정
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
  // ✅ 미디어 상태 (프리뷰 3x3만)
  // =========================================================
  const [mediaType, setMediaType] = useState('ALL'); // ALL | IMAGE | VIDEO
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

  // ✅ numColumns=3로 강제 3열
  const gridInnerWidth = useMemo(() => {
    return panelW - getResponsiveWidth(34) * 2 - 2;
  }, [panelW, innerBoxPad]);

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
    if (!newRoomName.trim()) return;

    dispatch(
      renameChatRoomThunk({
        familyId,
        userId,
        chatRoomId,
        roomName: newRoomName,
      }),
    )
      .unwrap()
      .then(() => {
        dispatch(updateChatRoomNameInList({chatRoomId, newRoomName}));
        setIsRenameModalVisible(false);
        setNewRoomName('');
      })
      .catch(err => console.warn('❌ 이름 변경 실패:', err));
  };

  const handleShowMembers = () => {
    onClose();
    navigation.navigate('채팅방멤버추가화면', {chatRoomId});
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

  // =========================================================
  // ✅ 루트 FlatList: 스크롤 컨테이너만
  // =========================================================
  const listData = useMemo(() => [], []);
  const renderEmpty = useCallback(() => null, []);

  // ✅ 미디어 프리뷰 (3x3) + 더보기
  const MediaPreviewGrid = useMemo(() => {
    if (!mediaOpened) return null;

    if (mediaLoading) {
      return (
        <View style={styles.mediaLoadingBox}>
          <ActivityIndicator />
          <Text style={styles.helperText}>불러오는 중…</Text>
        </View>
      );
    }

    if (mediaItems.length === 0) {
      return (
        <Text style={styles.helperText}>아직 모아볼 미디어가 없어요.</Text>
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
                    {
                      width: cellSize,
                      height: cellSize,
                    },
                  ]}
                  activeOpacity={0.9}
                  onPress={() => openMediaModal(item, index)}>
                  {thumb ? (
                    <Image source={{uri: thumb}} style={styles.mediaThumb} />
                  ) : (
                    <View style={styles.mediaPlaceholder}>
                      <Text style={styles.mediaPlaceholderText}>
                        {kind === 'VIDEO' ? 'VIDEO' : 'FILE'}
                      </Text>
                    </View>
                  )}

                  {kind === 'VIDEO' && (
                    <View style={styles.videoBadge}>
                      <Text style={styles.videoBadgeText}>영상</Text>
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
            <Text style={styles.moreButtonText}>더 보기</Text>
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
  ]);

  // ✅ 섹션 구분선 컴포넌트
  const SectionDivider = useCallback(() => {
    return <View style={styles.sectionDivider} />;
  }, []);

  // ✅ Header
  const Header = useMemo(() => {
    return (
      <View style={{paddingTop: getResponsiveHeight(18)}}>
        {/* ✅ 섹션 1: 채팅방 이름 */}
        {!isKino && (
          <View style={styles.sectionWrap}>
            <TouchableOpacity
              style={styles.sectionRow}
              onPress={() => setIsRenameModalVisible(true)}
              activeOpacity={0.9}>
              <View style={styles.sectionTextBox}>
                <Text style={styles.sectionTitle}>채팅방 이름</Text>
                <Text style={styles.sectionDesc}>채팅방 이름을 변경해요.</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {!isKino && <SectionDivider />}

        {/* ✅ 섹션 2: 멤버 목록 */}
        {!isKino && (
          <View style={styles.sectionWrap}>
            <TouchableOpacity
              onPress={() => setShowMembers(!showMembers)}
              style={styles.sectionRow}
              activeOpacity={0.9}>
              <View style={styles.sectionTextBox}>
                <Text style={styles.sectionTitle}>멤버 목록</Text>
                <Text style={styles.sectionDesc}>
                  함께 채팅하는 멤버를 확인해요.
                </Text>
              </View>
              <Image
                source={require('../../../assets/images/down-yellow.png')}
                style={[
                  styles.chevronDown,
                  {transform: [{rotate: showMembers ? '180deg' : '0deg'}]},
                ]}
              />
            </TouchableOpacity>

            {showMembers && (
              <View style={styles.memberBox}>
                {chatRoomUsers?.map((user, idx) => (
                  <View
                    key={`${user?.userId ?? 'u'}_${idx}`}
                    style={styles.memberItem}>
                    <Image
                      source={{uri: user.image}}
                      style={styles.memberImage}
                    />
                    <Text style={styles.memberName}>{user.name}</Text>
                  </View>
                ))}

                {!isAllFamilyInChat && (
                  <TouchableOpacity
                    onPress={handleShowMembers}
                    style={styles.inviteBtn}
                    activeOpacity={0.9}>
                    <Image
                      source={require('../../../assets/images/addMember-bt.png')}
                      style={styles.addIcon}
                    />
                    <Text style={styles.inviteText}>새 멤버 초대</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* ✅ 키노/일반 분기 */}
        {isKino ? (
          <>
            {/* <SectionDivider /> */}

            {/* ✅ 섹션 3: 키노 교체 */}
            <View style={styles.sectionWrap}>
              <TouchableOpacity
                style={styles.sectionRow}
                onPress={() => setIsChangeKinoModalVisible(true)}
                activeOpacity={0.9}>
                <View style={styles.sectionTextBox}>
                  <Text style={styles.sectionTitle}>키노 교체하기</Text>
                  <Text style={styles.sectionDesc}>
                    새로운 키노를 만나볼래요.
                  </Text>
                </View>
                <Image
                  source={require('../../../assets/images/down-yellow.png')}
                  style={styles.chevron}
                />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <SectionDivider />

            {/* ✅ 섹션 3: 미디어 */}
            <View style={styles.sectionWrap}>
              <TouchableOpacity
                style={styles.sectionRow}
                onPress={() => {
                  const next = !mediaOpened;
                  setMediaOpened(next);
                  if (next) fetchMediaFirst(mediaType);
                }}
                activeOpacity={0.9}>
                <View style={styles.sectionTextBox}>
                  <Text style={styles.sectionTitle}>미디어</Text>
                  <Text style={styles.sectionDesc}>
                    사진/영상을 한눈에 모아봐요.
                  </Text>
                </View>

                <Image
                  source={require('../../../assets/images/down-yellow.png')}
                  style={[
                    styles.chevronDown,
                    {transform: [{rotate: mediaOpened ? '180deg' : '0deg'}]},
                  ]}
                />
              </TouchableOpacity>

              {mediaOpened && (
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
        {/* ✅ 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerTextBox}>
            <Text style={styles.headerTitle}>채팅방 설정</Text>
            <Text style={styles.headerSubtitle}>
              이름 · 멤버 · 알림을 관리해요.
            </Text>
          </View>

          <TouchableOpacity onPress={handleToggleAlarm} activeOpacity={0.9}>
            <View style={styles.alarmBtn}>
              <Image
                style={styles.alarmIcon}
                source={
                  isAlarmOn
                    ? require('../../../assets/images/navigator_alarm-button.png')
                    : require('../../../assets/images/navigator_alarm-button-off4.png')
                }
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* ✅ 스크롤 컨테이너 */}
        <FlatList
          data={listData}
          renderItem={() => null}
          keyExtractor={(_, idx) => `empty_${idx}`}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          contentContainerStyle={{
            paddingBottom: isKino
              ? getResponsiveHeight(24)
              : LEAVE_BAR_H + getResponsiveHeight(22),
          }}
          ListHeaderComponent={Header}
          ListFooterComponent={Footer}
        />

        {/* ✅ 채팅방 나가기 (하단 고정) */}
        {!isKino && (
          <View style={[styles.leaveStickyWrap, {height: LEAVE_BAR_H}]}>
            <View style={styles.leaveDivider} />
            <TouchableOpacity
              style={styles.leaveStickyBtn}
              onPress={() => setIsLeaveModalVisible(true)}
              activeOpacity={0.9}>
              <Text style={styles.leaveText}>채팅방 나가기</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: getResponsiveWidth(20),
    paddingBottom: 0,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop:
      Platform.OS === 'android'
        ? getResponsiveHeight(34)
        : getResponsiveHeight(66),
    marginBottom: getResponsiveHeight(10),
    alignItems: 'center',
  },
  headerTextBox: {flexShrink: 1, paddingRight: getResponsiveWidth(10)},
  headerTitle: {
    fontSize: getResponsiveFontSize(19),
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    marginTop: getResponsiveHeight(4),
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
    color: COLORS.textSecondary,
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

  // ✅ 섹션 래퍼: 카드 제거, padding만
  sectionWrap: {
    paddingVertical: getResponsiveHeight(14),
  },

  // ✅ 섹션 구분선
  sectionDivider: {
    height: 1,
    backgroundColor: '#EEF2F7',
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTextBox: {flex: 1, paddingRight: getResponsiveWidth(10)},
  sectionTitle: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.textPrimary,
  },
  sectionDesc: {
    marginTop: getResponsiveHeight(4),
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-Regular',
    color: COLORS.textSecondary,
  },

  chevron: {
    width: getResponsiveIconSize(14),
    height: getResponsiveIconSize(14),
    resizeMode: 'contain',
    opacity: 0.7,
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
    fontSize: getResponsiveFontSize(13.5),
    fontFamily: 'Pretendard-Medium',
    color: '#111827',
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(8),
    marginTop: getResponsiveHeight(6),
  },
  addIcon: {
    width: getResponsiveIconSize(30),
    height: getResponsiveIconSize(30),
    resizeMode: 'contain',
    marginRight: getResponsiveWidth(10),
  },
  inviteText: {
    fontSize: getResponsiveFontSize(13),
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
    fontSize: getResponsiveFontSize(12),
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
    fontSize: getResponsiveFontSize(11.5),
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
    fontSize: getResponsiveFontSize(11),
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
    fontSize: getResponsiveFontSize(10),
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
    fontSize: getResponsiveFontSize(12.5),
    color: '#374151',
    fontFamily: 'Pretendard-Medium',
  },

  leaveStickyWrap: {
    position: 'absolute',
    left: getResponsiveWidth(20),
    right: getResponsiveWidth(20),
    bottom: getResponsiveHeight(14),
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
    fontSize: getResponsiveFontSize(13.5),
  },
});
