// src/features/chat/components/ChatSettings.jsx
import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
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

import {
  fetchChatRoomUsersThunk,
  renameChatRoomThunk,
  toggleChatRoomNotificationThunk,
  fetchChatRoomMediaThunk,
} from '../store/chatRoomThunk';

import LeaveChatRoomModal from '../components/leaveChatRoomModal';
import RenameChatRoomModal from '../components/renameChatRoomModal';
import ChangeKinoModal from '../components/ChangeKinoModal';

// ✅ Android 케이스 민감: 파일명이 MediaModal.jsx면 이렇게 import 해야 안전함
// import MediaModal from '../components/MediaModal';
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

  // ✅ 토스트
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const chatRoomUsers = useSelector(state => state.chatRoom.chatRoomUsers);
  const familyId = useSelector(state => state.family.familyId);
  const userId = useSelector(state => state.user.userId);
  const familyMembers = useSelector(
    state => state.userFamily.familyUserList || [],
  );

  // ✅ 현재 채팅방 정보
  const chatRoomList = useSelector(state => state.chatRoom.chatRoomList || []);
  const rid = chatRoomId == null ? null : String(chatRoomId);
  const currentRoom = chatRoomList.find(
    room => String(room.chatRoomId) === rid,
  );

  const isAllFamilyInChat =
    Array.isArray(familyMembers) &&
    familyMembers.length > 0 &&
    Array.isArray(chatRoomUsers) &&
    chatRoomUsers.length >= familyMembers.length;

  // =========================================================
  // ✅ “원래 있는 헤더 가리기” + 닫힐 때 스르륵 닫기
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
  // ✅ 미디어 상태
  // =========================================================
  const [mediaType, setMediaType] = useState('ALL'); // ALL | IMAGE | VIDEO
  const [mediaItems, setMediaItems] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaMoreLoading, setMediaMoreLoading] = useState(false);
  const [mediaNextBefore, setMediaNextBefore] = useState(null);
  const [mediaOpened, setMediaOpened] = useState(false);

  // ✅ MediaModal 연결 (너가 올린 시그니처)
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [modalUrls, setModalUrls] = useState([]);
  const [modalType, setModalType] = useState('image'); // 'image' | 'video'
  const [modalInitialIndex, setModalInitialIndex] = useState(0);

  const fetchingFirstRef = useRef(false);

  const gridGap = getResponsiveWidth(8);
  const paddingH = getResponsiveWidth(22); // container paddingHorizontal

  // ✅ cellSize 계산식 수정(패딩을 4번 빼고 있었음)
  // panelW - (좌우 padding 2개) - (열 사이 gap 2개)
  const cellSize = useMemo(() => {
    const w = panelW - paddingH * 2 - gridGap * 2 - getResponsiveWidth(20);
    return Math.floor(w / 3);
  }, [panelW, paddingH, gridGap]);

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

  // ✅ keyExtractor에서만 사용 (render 안정)
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
      setMediaNextBefore(res?.nextBefore ?? null);
    } catch (e) {
      console.warn('❌ fetchMediaFirst 실패:', e);
      setMediaItems([]);
      setMediaNextBefore(null);
    } finally {
      setMediaLoading(false);
      fetchingFirstRef.current = false;
    }
  };

  // ✅ 핵심 수정: 더보기는 “절대 dedupe 하지 말고” 무조건 append
  // (dedupe는 서버 key 확정된 뒤에 다시 설계)
  const fetchMediaMore = async () => {
    if (!chatRoomId) return;
    if (!mediaNextBefore) return;
    if (mediaMoreLoading) return;

    setMediaMoreLoading(true);
    try {
      const res = await dispatch(
        fetchChatRoomMediaThunk({
          chatRoomId,
          type: mediaType,
          before: mediaNextBefore,
          limit: 30,
        }),
      ).unwrap();

      const nextItems = Array.isArray(res?.items) ? res.items : [];
      setMediaItems(prev => [...prev, ...nextItems]); // ✅ 줄어드는 현상 방지
      setMediaNextBefore(res?.nextBefore ?? null);
    } catch (e) {
      console.warn('❌ fetchMediaMore 실패:', e);
    } finally {
      setMediaMoreLoading(false);
    }
  };

  const onChangeMediaType = async t => {
    const upper = String(t).toUpperCase();
    setMediaType(upper);
    await fetchMediaFirst(upper);
  };

  const openMediaModal = useCallback(
    (pressedItem, pressedIndexInGrid) => {
      const pressedKind = normalizeMediaType(pressedItem); // IMAGE | VIDEO | FILE
      const pressedUri = pickMediaUri(pressedItem);

      if (!pressedUri) return;
      if (pressedKind === 'FILE') return;

      // ✅ ALL이면 누른 타입끼리만 묶어서 모달 넘김
      const kindForList =
        mediaType === 'ALL'
          ? pressedKind
          : mediaType === 'VIDEO'
          ? 'VIDEO'
          : 'IMAGE';

      const list = (mediaItems || [])
        .filter(it => normalizeMediaType(it) === kindForList)
        .map(it => pickMediaUri(it))
        .filter(Boolean);

      if (!list.length) return;

      const foundIndex = list.findIndex(u => String(u) === String(pressedUri));

      setModalUrls(list);
      setModalType(kindForList === 'VIDEO' ? 'video' : 'image');
      setModalInitialIndex(
        foundIndex >= 0 ? foundIndex : Math.max(0, pressedIndexInGrid || 0),
      );
      setMediaModalVisible(true);
    },
    [mediaItems, mediaType],
  );

  const closeMediaModal = useCallback(() => {
    setMediaModalVisible(false);
    setTimeout(() => {
      setModalUrls([]);
      setModalInitialIndex(0);
      setModalType('image');
    }, 0);
  }, []);

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
        setToastMessage(newIsOn ? '알림을 켰어요' : '알림을 껐어요');
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

  if (!internalVisible) return null;

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
          mediaUrls={modalUrls}
          mediaType={modalType}
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
            <Text style={styles.headerTitle}>채팅방 설정</Text>
            <Text style={styles.headerSubtitle}>
              이름, 멤버, 알림을 한 번에 관리해요.
            </Text>
          </View>

          <TouchableOpacity onPress={handleToggleAlarm}>
            <Image
              style={styles.alarmIcon}
              source={
                isAlarmOn
                  ? require('../../../assets/images/navigator_alarm-button.png')
                  : require('../../../assets/images/navigator_alarm-button-off4.png')
              }
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {!isKino && (
            <TouchableOpacity
              style={styles.option}
              onPress={() => setIsRenameModalVisible(true)}>
              <Text style={styles.optionTitle}>채팅방 이름</Text>
              <Text style={styles.optionDescription}>
                채팅방 이름을 변경해요.
              </Text>
            </TouchableOpacity>
          )}

          {!isKino && (
            <View style={styles.option}>
              <TouchableOpacity
                onPress={() => setShowMembers(!showMembers)}
                style={styles.optionRow}>
                <View>
                  <Text style={styles.optionTitle}>멤버 목록</Text>
                  <Text style={styles.optionDescription}>
                    함께 채팅하는 가족을 확인해요.
                  </Text>
                </View>
                <Image
                  source={require('../../../assets/images/down-yellow.png')}
                  style={[
                    styles.arrowIcon,
                    {transform: [{rotate: showMembers ? '180deg' : '0deg'}]},
                  ]}
                />
              </TouchableOpacity>

              {showMembers && (
                <View style={styles.memberList}>
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
                      style={styles.addMemberButton}>
                      <Image
                        source={require('../../../assets/images/addMember-bt.png')}
                        style={styles.addIcon}
                      />
                      <Text style={styles.addText}>새 멤버 초대</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          {isKino && (
            <TouchableOpacity
              style={styles.option}
              onPress={() => setIsChangeKinoModalVisible(true)}>
              <Text style={styles.optionTitle}>키노 교체하기</Text>
              <Text style={styles.optionDescription}>여러가지 성격의 키노를 만나보세요.</Text>
            </TouchableOpacity>
          )}

          {/* ✅ 미디어 */}
          {!isKino && (
            <View style={styles.option}>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => {
                  const next = !mediaOpened;
                  setMediaOpened(next);
                  if (next) fetchMediaFirst(mediaType);
                }}>
                <View>
                  <Text style={styles.optionTitle}>미디어</Text>
                  <Text style={styles.optionDescription}>
                    사진/영상을 한눈에 모아봐요.
                  </Text>
                </View>

                <Image
                  source={require('../../../assets/images/down-yellow.png')}
                  style={[
                    styles.arrowIcon,
                    {transform: [{rotate: mediaOpened ? '180deg' : '0deg'}]},
                  ]}
                />
              </TouchableOpacity>

              {mediaOpened && (
                <View
                  style={{
                    backgroundColor: BACKGROUND_COLORS.secondaryBg,
                    borderRadius: getResponsiveHeight(10),
                    paddingVertical: getResponsiveHeight(8),
                    paddingHorizontal: getResponsiveWidth(10),
                    marginTop: getResponsiveHeight(10),
                  }}>
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
                          ]}>
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

                  {mediaLoading ? (
                    <View style={styles.mediaLoadingBox}>
                      <ActivityIndicator />
                      <Text style={styles.mediaLoadingText}>불러오는 중…</Text>
                    </View>
                  ) : (
                    <>
                      {mediaItems.length === 0 ? (
                        <Text style={styles.emptyText}>
                          아직 모아볼 미디어가 없어요.
                        </Text>
                      ) : (
                        <FlatList
                          data={mediaItems}
                          key="media-grid-3"
                          numColumns={3}
                          scrollEnabled={false}
                          columnWrapperStyle={{justifyContent: 'space-between'}}
                          keyExtractor={(item, idx) => {
                            const baseKey = getMediaKey(item) ?? 'noid';
                            return `${String(baseKey)}_${idx}`;
                          }}
                          renderItem={({item, index}) => {
                            const thumb =
                              pickThumbUri(item) || pickMediaUri(item);
                            const kind = normalizeMediaType(item);

                            return (
                              <TouchableOpacity
                                style={[
                                  styles.mediaCell,
                                  {
                                    width: cellSize,
                                    height: cellSize,
                                    marginBottom: gridGap,
                                  },
                                ]}
                                activeOpacity={0.85}
                                onPress={() => openMediaModal(item, index)}>
                                {thumb ? (
                                  <Image
                                    source={{uri: thumb}}
                                    style={styles.mediaThumb}
                                  />
                                ) : (
                                  <View style={styles.mediaPlaceholder}>
                                    <Text style={styles.mediaPlaceholderText}>
                                      {kind === 'VIDEO' ? 'VIDEO' : 'FILE'}
                                    </Text>
                                  </View>
                                )}

                                {kind === 'VIDEO' && (
                                  <View style={styles.videoBadge}>
                                    <Text style={styles.videoBadgeText}>
                                      영상
                                    </Text>
                                  </View>
                                )}
                              </TouchableOpacity>
                            );
                          }}
                        />
                      )}

                      {!!mediaNextBefore && (
                        <TouchableOpacity
                          style={styles.moreButton}
                          onPress={fetchMediaMore}
                          disabled={mediaMoreLoading}>
                          <Text style={styles.moreButtonText}>
                            {mediaMoreLoading ? '불러오는 중…' : '더 보기'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              )}
            </View>
          )}
          {!isKino && (
            <TouchableOpacity
              style={styles.leaveOption}
              onPress={() => setIsLeaveModalVisible(true)}>
              <Text style={styles.leaveText}>채팅방 나가기</Text>
            </TouchableOpacity>
          )}

          <View style={{height: getResponsiveHeight(30)}} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: getResponsiveWidth(310),
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: getResponsiveWidth(20),
    paddingBottom: getResponsiveHeight(30),
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop:
      Platform.OS === 'android'
        ? getResponsiveHeight(36)
        : getResponsiveHeight(80),
    marginBottom: getResponsiveHeight(28),
    alignItems: 'center',
  },
  headerTextBox: {flexShrink: 1, paddingRight: getResponsiveWidth(12)},
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
  alarmIcon: {
    width: getResponsiveIconSize(20),
    height: getResponsiveIconSize(20),
    resizeMode: 'contain',
  },

  content: {flex: 1, paddingTop: getResponsiveHeight(4)},
  option: {
    paddingVertical: getResponsiveHeight(14),
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-SemiBold',
    // color: '#4B5563',
    color: COLORS.textPrimary,
    marginBottom: getResponsiveHeight(3),
  },
  optionText: {
    color: COLORS.textPrimary,
    fontSize: getResponsiveFontSize(15.5),
    fontFamily: 'Pretendard-Regular',
  },
  optionDescription: {
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-Regular',
    color: COLORS.textSecondary,
  },
  expandButton: {
    paddingHorizontal: getResponsiveWidth(4),
    paddingVertical: getResponsiveHeight(4),
  },
  arrowIcon: {
    resizeMode: 'contain',
    width: getResponsiveWidth(13),
    height: getResponsiveHeight(13),
  },

  mediaTabs: {
    flexDirection: 'row',
    marginBottom: getResponsiveHeight(10),
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
    paddingVertical: getResponsiveHeight(12),
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: getResponsiveHeight(6),
  },
  mediaLoadingText: {
    fontSize: getResponsiveFontSize(12),
    color: '#6B7280',
    fontFamily: 'Pretendard-Regular',
  },
  emptyText: {
    alignSelf: 'center',
    fontSize: getResponsiveFontSize(11),
    color: '#6B7280',
    fontFamily: 'Pretendard-Regular',
    paddingVertical: getResponsiveHeight(10),
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
    marginTop: getResponsiveHeight(12),
    paddingVertical: getResponsiveHeight(10),
    alignItems: 'center',
    borderRadius: getResponsiveIconSize(12),
    backgroundColor: '#F3F4F6',
  },
  moreButtonText: {
    fontSize: getResponsiveFontSize(12.5),
    color: '#374151',
    fontFamily: 'Pretendard-Medium',
  },

  memberList: {
    width: '100%',
    minHeight: getResponsiveHeight(110),
    borderRadius: getResponsiveIconSize(10),
    backgroundColor: '#f9f9f9',
    marginTop: getResponsiveHeight(10),
    paddingVertical: getResponsiveHeight(8),
    paddingHorizontal: getResponsiveWidth(10),
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(4),
    marginBottom: getResponsiveHeight(2),
  },
  memberImage: {
    width: getResponsiveIconSize(32),
    height: getResponsiveIconSize(32),
    borderRadius: getResponsiveIconSize(16),
    marginRight: getResponsiveWidth(10),
    backgroundColor: '#FFFFFF',
  },
  memberName: {
    fontSize: getResponsiveFontSize(13.5),
    fontFamily: 'Pretendard-Medium',
    color: '#111827',
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(6),
  },
  addIcon: {
    width: getResponsiveIconSize(32),
    height: getResponsiveIconSize(32),
    resizeMode: 'contain',
    marginRight: getResponsiveWidth(10),
  },
  addText: {
    fontSize: getResponsiveFontSize(13),
    color: '#F59E0B',
    fontFamily: 'Pretendard-Medium',
  },

  leaveOption: {
    marginTop: getResponsiveHeight(16),
    paddingVertical: getResponsiveHeight(10),
    alignItems: 'flex-start',
  },
  leaveText: {
    fontFamily: 'Pretendard-Medium',
    color: '#EF4444',
    fontSize: getResponsiveFontSize(13.5),
  },
});
