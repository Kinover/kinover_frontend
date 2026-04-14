/* =========================================================
 * 채팅 설정 화면
 * - 알림 토글, 채팅방명 변경, 멤버, 미디어 모아보기, 채팅방 나가기
 * - 멤버 추가 화면 복귀 시 route params로 초대 결과 토스트
 * ========================================================= */

import React, {useEffect, useMemo, useState, useCallback} from 'react';

import {View, StyleSheet, Image, ScrollView, Pressable} from 'react-native';
import DropShadow from 'react-native-drop-shadow';

import AppText from 'components/AppText';

import {useSelector, useDispatch} from 'react-redux';
import {useReduxFontMode} from 'hooks/useReduxFontMode';

// chatRoomThunk 교체: RTK Query mutations 사용
import {
  useRenameChatRoomForMeMutation,
  useToggleChatRoomNotificationMutation,
} from '../services/chatApi';

import LeaveChatRoomModal from '../components/modals/leaveChatRoomModal';
import RenameChatRoomModal from '../components/modals/renameChatRoomModal';
import ChangeKinoModal from '../components/modals/changeKinoModal';
import CustomSwitch from 'components/customSwitch';

import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
  getResponsiveWidth,
} from 'utils/responsive';

import {
  bumpChatRoomToTop,
  updateChatRoomNameInList,
  setChatRoomNotificationState,
} from '../store/chatRoomSlice';

import ToastModal from 'components/modal/ToastModal';
import {COLORS} from 'styles/style';
import {FONT_MODE} from 'store/uiSlice';
import {onLeaveChat} from '../hooks/onLeaveChat';

export default function ChatSettings({route, navigation}) {
  const dispatch = useDispatch();
  const {chatRoomId: rawChatRoomId, isKino: rawIsKino} = route?.params || {};
  const chatRoomId = rawChatRoomId == null ? null : String(rawChatRoomId);
  const isKino = !!rawIsKino;

  // RTK Query mutations
  const [renameChatRoomForMe] = useRenameChatRoomForMeMutation();
  const [toggleChatRoomNotification] = useToggleChatRoomNotificationMutation();

  const fontMode = useReduxFontMode();
  const hideSubtitle = fontMode === FONT_MODE.EXTRA_LARGE;

  const styles = useMemo(
    () => makeStyles(n => getResponsiveFontSize(n)),
    [fontMode],
  );

  const [isChangeKinoModalVisible, setIsChangeKinoModalVisible] =
    useState(false);
  const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [isAlarmOn, setIsAlarmOn] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const userId = useSelector(state => state.user.userId);
  const chatRoomList = useSelector(state => state.chatRoom.chatRoomList || []);
  const currentRoom = chatRoomList.find(
    room => String(room.chatRoomId) === chatRoomId,
  );
  const currentRoomName = currentRoom?.roomName ?? '';

  // =========================================================
  // 현재 라우트 / params
  // =========================================================
  const clearInvitedToastParams = useCallback(() => {
    try {
      navigation?.setParams?.({
        invitedToast: undefined,
        invitedCount: undefined,
        invitedMessage: undefined,
      });
    } catch (e) {
      null;
    }
  }, [navigation]);

  useEffect(() => {
    const currentParams = route?.params || {};
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
      // RTK Query: addUsersToChatRoom mutation이 ChatRoomUsers tag 무효화 → 자동 refetch
    }
  }, [route?.params, chatRoomId, dispatch, clearInvitedToastParams]);

  // fetchChatRoomUsersThunk 제거: useGetChatRoomUsersQuery(chatRoomId)가 useChatRoomTemplate에서 자동 처리

  useEffect(() => {
    if (!currentRoom) return;
    setIsAlarmOn(!!currentRoom.notificationOn);
  }, [currentRoom]);

  useEffect(() => {
    if (!toastVisible) return;
    const timer = setTimeout(() => setToastVisible(false), 1800);
    return () => clearTimeout(timer);
  }, [toastVisible]);

  const handleToggleAlarm = async () => {
    const newIsOn = !isAlarmOn;
    setIsAlarmOn(newIsOn); // optimistic UI
    try {
      await toggleChatRoomNotification({
        chatRoomId,
        userId,
        isOn: newIsOn,
      }).unwrap();
      // slice에 즉시 반영
      dispatch(setChatRoomNotificationState({chatRoomId, isOn: newIsOn}));
      setToastMessage(newIsOn ? '알림을 켰어요.' : '알림을 껐어요.');
      setToastVisible(true);
    } catch {
      setIsAlarmOn(!newIsOn); // rollback
      setToastMessage(
        '알림 설정을 바꾸지 못했어요.\n잠시 후 다시 시도해 주세요.',
      );
      setToastVisible(true);
    }
  };

  const handleRenameChatRoom = async () => {
    const nextName = newRoomName.trim();
    if (!nextName) return;
    try {
      await renameChatRoomForMe({chatRoomId, roomName: nextName}).unwrap();
      // slice에도 즉시 반영 (invalidateTags → refetch 전 UI 업데이트)
      dispatch(updateChatRoomNameInList({chatRoomId, newRoomName: nextName}));
      setIsRenameModalVisible(false);
      setNewRoomName('');
      setToastMessage('채팅방 이름을 바꿨어요.');
      setToastVisible(true);
    } catch {
      setToastMessage('이름 변경에 실패했어요. 잠시 후 다시 시도해 주세요.');
      setToastVisible(true);
    }
  };

  const openAddMember = () => {
    navigation.navigate('채팅방멤버추가화면', {
      chatRoomId,
      onInvited: ({count, message}) => {
        navigation.setParams({
          invitedToast: true,
          invitedCount: count,
          invitedMessage: message,
        });
      },
    });
  };

  const handleShowMembers = () => {
    openAddMember();
  };

  const handleLeaveConfirm = () => {
    setIsLeaveModalVisible(false);
    onLeaveChat(dispatch, navigation, chatRoomId);
  };

  const handleGoToKinoSelect = () => {
    if (!chatRoomId) return;
    dispatch(bumpChatRoomToTop(chatRoomId));
    navigation.navigate('키노선택화면', {chatRoomId});
  };

  const goToMediaPage = useCallback(() => {
    if (!chatRoomId) return;
    navigation.navigate('채팅방미디어모아보기화면', {chatRoomId});
  }, [chatRoomId, navigation]);

  return (
    <View style={styles.container}>
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* 알림 섹션 */}
        <AppText allowFontScaling={false} style={styles.sectionLabel}>
          알림
        </AppText>
        <DropShadow style={styles.cardShadow}>
          <View style={styles.card}>
            <Pressable
              onPress={handleToggleAlarm}
              android_ripple={{color: 'rgba(17,24,39,0.06)'}}
              accessibilityRole="switch"
              accessibilityLabel={isAlarmOn ? '알림 켜짐' : '알림 꺼짐'}
              accessibilityState={{checked: isAlarmOn}}
              style={({pressed}) => [
                styles.cardRow,
                pressed && styles.cardRowPressed,
              ]}>
              <View style={[styles.iconBox, {backgroundColor: '#FEF9C3'}]}>
                {isAlarmOn ? (
                  <Image
                    source={require('../../../assets/images/navigator_alarm-button.png')}
                    style={{
                      width: getResponsiveIconSize(20),
                      height: getResponsiveIconSize(20),
                      resizeMode: 'contain',
                    }}
                  />
                ) : (
                  <Image
                    source={require('../../../assets/images/navigator_alarm-button-off3.png')}
                    style={{
                      width: getResponsiveIconSize(20),
                      height: getResponsiveIconSize(20),
                      resizeMode: 'contain',
                      tintColor: COLORS.brandPrimary,
                    }}
                  />
                )}
              </View>
              <View style={styles.rowTextBox}>
                <AppText allowFontScaling={false} style={styles.rowTitle}>
                  알림
                </AppText>
                {!hideSubtitle && (
                  <AppText allowFontScaling={false} style={styles.rowSubtitle}>
                    새 메시지 알림을 받아요
                  </AppText>
                )}
              </View>
              <CustomSwitch
                isEnabled={isAlarmOn}
                toggleSwitch={handleToggleAlarm}
              />
            </Pressable>
          </View>
        </DropShadow>

        {/* 채팅방 관리 섹션 */}
        {!isKino && (
          <>
            <AppText allowFontScaling={false} style={styles.sectionLabel}>
              채팅방 관리
            </AppText>
            <DropShadow style={styles.cardShadow}>
              <View style={styles.card}>
                {/* 채팅방명 변경 */}
                <Pressable
                  onPress={() => setIsRenameModalVisible(true)}
                  android_ripple={{color: 'rgba(17,24,39,0.06)'}}
                  style={({pressed}) => [
                    styles.cardRow,
                    pressed && styles.cardRowPressed,
                  ]}>
                  <View style={[styles.iconBox, {backgroundColor: '#EFF6FF'}]}>
                    <Image
                      source={require('../../../assets/images/pencil.png')}
                      style={{
                        width: getResponsiveIconSize(21),
                        height: getResponsiveIconSize(21),
                        resizeMode: 'contain',
                        tintColor: COLORS.brandPrimary,
                      }}
                    />
                  </View>
                  <View style={styles.rowTextBox}>
                    <AppText allowFontScaling={false} style={styles.rowTitle}>
                      채팅방명 변경
                    </AppText>
                    {!hideSubtitle && (
                      <AppText
                        allowFontScaling={false}
                        style={styles.rowSubtitle}>
                        나만 보이는 이름으로 바꿔요
                      </AppText>
                    )}
                  </View>
                  <Image
                    source={require('assets/images/rightArrow-gray.png')}
                    style={styles.chevronRight}
                  />
                </Pressable>

                <View style={styles.rowDivider} />

                {/* 멤버 */}
                <Pressable
                  onPress={handleShowMembers}
                  android_ripple={{color: 'rgba(17,24,39,0.06)'}}
                  style={({pressed}) => [
                    styles.cardRow,
                    pressed && styles.cardRowPressed,
                  ]}>
                  <View style={[styles.iconBox, {backgroundColor: '#F3F4F6'}]}>
                    <Image
                      source={require('../../../assets/images/navigator_family-button.png')}
                      style={{
                        width: getResponsiveIconSize(21),
                        height: getResponsiveIconSize(21),
                        resizeMode: 'contain',
                        tintColor: COLORS.brandPrimary,
                      }}
                    />
                  </View>
                  <View style={styles.rowTextBox}>
                    <AppText allowFontScaling={false} style={styles.rowTitle}>
                      멤버
                    </AppText>
                    {!hideSubtitle && (
                      <AppText
                        allowFontScaling={false}
                        style={styles.rowSubtitle}>
                        함께하는 멤버를 확인해요
                      </AppText>
                    )}
                  </View>
                  <Image
                    source={require('assets/images/rightArrow-gray.png')}
                    style={styles.chevronRight}
                  />
                </Pressable>

                <View style={styles.rowDivider} />

                {/* 미디어 모아보기 */}
                <Pressable
                  onPress={goToMediaPage}
                  android_ripple={{color: 'rgba(17,24,39,0.06)'}}
                  style={({pressed}) => [
                    styles.cardRow,
                    pressed && styles.cardRowPressed,
                  ]}>
                  <View style={[styles.iconBox, {backgroundColor: '#FFF1F2'}]}>
                    <Image
                      source={require('assets/icons/tabs/2/photo.png')}
                      style={styles.iconImgYellow}
                    />
                  </View>
                  <View style={styles.rowTextBox}>
                    <AppText allowFontScaling={false} style={styles.rowTitle}>
                      사진 모아보기
                    </AppText>
                    {!hideSubtitle && (
                      <AppText
                        allowFontScaling={false}
                        style={styles.rowSubtitle}>
                        사진·동영상을 한곳에서 봐요
                      </AppText>
                    )}
                  </View>
                  <Image
                    source={require('assets/images/rightArrow-gray.png')}
                    style={styles.chevronRight}
                  />
                </Pressable>
              </View>
            </DropShadow>
          </>
        )}

        {/* 키노 설정 섹션 */}
        {isKino && (
          <>
            <AppText allowFontScaling={false} style={styles.sectionLabel}>
              키노 설정
            </AppText>
            <DropShadow style={styles.cardShadow}>
              <View style={styles.card}>
                <Pressable
                  onPress={() => setIsChangeKinoModalVisible(true)}
                  android_ripple={{color: 'rgba(17,24,39,0.06)'}}
                  style={({pressed}) => [
                    styles.cardRow,
                    pressed && styles.cardRowPressed,
                  ]}>
                  <View style={[styles.iconBox, {backgroundColor: '#EFF6FF'}]}>
                    <Image
                      source={require('assets/images/blueKino.png')}
                      style={styles.iconImg}
                    />
                  </View>
                  <View style={styles.rowTextBox}>
                    <AppText allowFontScaling={false} style={styles.rowTitle}>
                      키노 변경
                    </AppText>
                    {!hideSubtitle && (
                      <AppText
                        allowFontScaling={false}
                        style={styles.rowSubtitle}>
                        이 채팅에 연결된 키노를 바꿀 수 있어요
                      </AppText>
                    )}
                  </View>
                  <Image
                    source={require('assets/images/rightArrow-gray.png')}
                    style={styles.chevronRight}
                  />
                </Pressable>
              </View>
            </DropShadow>
          </>
        )}

        {isKino ? (
          <AppText allowFontScaling={false} style={styles.kinoAiDisclaimer}>
            {`키노는 AI 상담사로 때때로 실수를 할 수 있어요.\n 중요한 결정은 꼭 가족과 함께 상의해 주세요!`}
          </AppText>
        ) : null}

        {/* 채팅방 나가기 */}
        {!isKino && (
          <DropShadow style={styles.cardShadow}>
            <View style={styles.card}>
              <Pressable
                onPress={() => setIsLeaveModalVisible(true)}
                android_ripple={{color: 'rgba(17,24,39,0.06)'}}
                style={({pressed}) => [
                  styles.cardRow,
                  pressed && styles.cardRowPressed,
                ]}>
                <View style={[styles.iconBox, {backgroundColor: '#FFF1F2'}]}>
                  <Image
                    source={require('assets/icons/tabs/2/exit.png')}
                    style={styles.iconImgYellowExit}
                  />
                </View>
                <AppText
                  allowFontScaling={false}
                  style={[styles.rowTitle, styles.leaveText]}>
                  채팅방 나가기
                </AppText>
                <Image
                  source={require('assets/images/rightArrow-gray.png')}
                  style={[styles.chevronRight, {tintColor: '#EF4444'}]}
                />
              </Pressable>
            </View>
          </DropShadow>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const makeStyles = rf =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F5F5',
    },

    scrollContent: {
      paddingHorizontal: getResponsiveWidth(16),
      paddingTop: getResponsiveHeight(4),
    },

    sectionLabel: {
      fontSize: rf(12),
      fontFamily: 'Pretendard-Regular',
      color: '#9CA3AF',
      marginBottom: getResponsiveHeight(8),
      marginLeft: getResponsiveWidth(4),
      marginTop: getResponsiveHeight(8),
    },

    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: getResponsiveIconSize(16),
      overflow: 'hidden',
    },

    cardShadow: {
      marginBottom: getResponsiveHeight(8),
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },

    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: getResponsiveWidth(16),
      paddingVertical: getResponsiveHeight(14),
    },

    cardRowPressed: {
      backgroundColor: 'rgba(17,24,39,0.04)',
    },

    rowDivider: {
      height: 1,
      backgroundColor: '#F3F4F6',
      marginLeft: getResponsiveWidth(16 + 44 + 12),
    },

    iconBox: {
      width: getResponsiveIconSize(44),
      height: getResponsiveIconSize(44),
      borderRadius: getResponsiveIconSize(12),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: getResponsiveWidth(12),
    },

    iconEmoji: {
      fontSize: rf(22),
      lineHeight: rf(28),
    },

    iconImg: {
      width: getResponsiveIconSize(26),
      height: getResponsiveIconSize(26),
      resizeMode: 'contain',
    },
    iconImgYellow: {
      width: getResponsiveIconSize(22),
      height: getResponsiveIconSize(22),
      resizeMode: 'contain',
      tintColor: '#FFC84D',
    },
    iconImgYellowExit: {
      width: getResponsiveIconSize(19.5),
      height: getResponsiveIconSize(19.5),
      resizeMode: 'contain',
      tintColor: '#FFC84D',
    },

    rowTextBox: {
      flex: 1,
    },

    rowTitle: {
      fontSize: rf(14),
      fontFamily: 'Pretendard-SemiBold',
      color: COLORS.textPrimary,
    },

    rowSubtitle: {
      marginTop: getResponsiveHeight(2),
      fontSize: rf(11.5),
      fontFamily: 'Pretendard-Regular',
      color: '#9CA3AF',
    },

    chevronRight: {
      width: getResponsiveIconSize(16),
      height: getResponsiveIconSize(16),
      resizeMode: 'contain',
      tintColor: '#D1D5DB',
    },

    leaveText: {
      color: '#EF4444',
      flex: 1,
    },

    kinoAiDisclaimer: {
      marginTop: getResponsiveHeight(12),
      marginBottom: getResponsiveHeight(4),
      paddingHorizontal: getResponsiveWidth(4),
      fontSize: rf(12),
      lineHeight: rf(15),
      alignSelf: 'center',
      fontFamily: 'Pretendard-Regular',
      color: '#C4C4C8',
    },

    bottomPad: {
      height: getResponsiveHeight(40),
    },
  });
