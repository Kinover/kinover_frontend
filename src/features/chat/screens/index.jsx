/* eslint-disable react-native/no-inline-styles */
// src/features/chat/screens/CommunicationScreen.jsx

import React, {useEffect, useCallback, useState, useRef, useMemo} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';

import {
  fetchChatRoomListThunk,
  createChatRoomThunk,
} from '../store/chatRoomThunk';
import {fetchFamilyUserListThunk} from 'features/home/store/familyUserThunk';

import ChatRoomItem from '../components/ChatRoomItem';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from 'utils/responsive';

import YellowSpinner from 'components/YellowSpinner';
import ToastModal from 'components/modal/ToastModal';

import {BACKGROUND_COLORS, EMPTY_STYLE} from 'styles/style';
import {hapticLight} from 'utils/haptic';
import DropShadow from 'react-native-drop-shadow';

import CreateChatRoomBottomSheet from '../components/CreateChatRoomBottomSheet';
import ChatGuideModal from '../components/ChatGuideModal';

export default function CommunicationScreen({navigation}) {
  const dispatch = useDispatch();
  const modalRef = useRef(null);

  const {userId, login} = useSelector(s => s.user);
  const {familyId} = useSelector(s => s.family);

  const {chatRoomList, loading, listRevision} = useSelector(s => s.chatRoom);

  const familyUserList = useSelector(s => s.userFamily.familyUserList);

  const [refreshing, setRefreshing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  /** =========================
   * 데이터 로딩
   ========================= */
  const load = useCallback(async () => {
    if (familyId != null && userId != null) {
      return dispatch(fetchChatRoomListThunk(familyId, userId));
    }
    return null;
  }, [dispatch, familyId, userId]);

  useEffect(() => {
    load();
  }, [load, login]);

  useEffect(() => {
    if (familyId != null) {
      dispatch(fetchFamilyUserListThunk(familyId));
    }
  }, [dispatch, familyId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  /** =========================
   * 리스트 렌더
   ========================= */
  const renderItem = useCallback(
    ({item}) => (
      <ChatRoomItem chatRoom={item} userId={userId} navigation={navigation} />
    ),
    [navigation, userId],
  );

  /** =========================
   * 바텀시트용 멤버
   ========================= */
  const members = useMemo(() => {
    return (familyUserList || [])
      .filter(u => u?.userId !== userId)
      .map(u => ({
        id: u.userId,
        name: u.name,
        disabled: false,
      }));
  }, [familyUserList, userId]);

  const openCreateChatRoomSheet = useCallback(() => {
    hapticLight?.();
    modalRef.current?.present?.();
  }, []);

  const handleSubmit = useCallback(
    async ({roomName, userIds}) => {
      if (!Array.isArray(userIds) || userIds.length === 0) return;

      const selectedUserNames = (familyUserList || [])
        .filter(u => userIds.includes(u.userId))
        .map(u => u.name);

      const autoRoomName = selectedUserNames.join(', ');
      const finalRoomName =
        roomName && roomName.trim().length > 0
          ? roomName.trim()
          : autoRoomName;

      await dispatch(
        createChatRoomThunk({
          roomName: finalRoomName,
          userIds: userIds.join(','),
          familyId,
        }),
      ).unwrap();

      setToastVisible(true);
      await load();
    },
    [dispatch, familyId, familyUserList, load],
  );

  /** =========================
   * 렌더
   ========================= */
  return (
    <View style={styles.container}>
      {/* ✅ 소통 가이드 모달 */}
      <ChatGuideModal
        enabled={true}
        ready={!loading && !!familyId}
        forceVisible={false} // ✅ 개발 중엔 항상 노출
      />

      {loading && chatRoomList.length === 0 ? (
        <View style={styles.loaderWrapper}>
          <YellowSpinner />
        </View>
      ) : (
        <FlatList
          data={chatRoomList}
          renderItem={renderItem}
          extraData={listRevision}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text allowFontScaling={false} style={styles.noChatMessage}>
              {'아직 채팅방이 없어요.\n가족과의 첫 대화를 시작해볼까요?'}
            </Text>
          }
          keyExtractor={item => String(item?.chatRoomId)}
        />
      )}

      <CreateChatRoomBottomSheet
        modalRef={modalRef}
        members={members}
        initialRoomName=""
        initialSelectedIds={[]}
        onSubmit={handleSubmit}
        requireRoomName={false}
        maxRoomNameLength={30}
      />

      <ToastModal
        visible={toastVisible}
        message="채팅방을 생성했어요"
        onClose={() => setToastVisible(false)}
        duration={1000}
      />

      <DropShadow style={styles.shadow}>
        <TouchableOpacity
          onPress={openCreateChatRoomSheet}
          style={styles.fab}
          activeOpacity={0.8}>
          <Image
            source={require('../../../assets/icons/tabs/2/two.png')}
            style={styles.fabIcon}
            tintColor="white"
          />
        </TouchableOpacity>
      </DropShadow>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  listContent: {
    paddingTop: getResponsiveHeight(4),
    paddingBottom: getResponsiveHeight(150),
    gap: getResponsiveHeight(6),
  },
  noChatMessage: {
    fontSize: EMPTY_STYLE().emptyFontSize,
    fontFamily: EMPTY_STYLE().emptyFontFamily,
    color: EMPTY_STYLE().emptyColor,
    textAlign: 'center',
    marginTop: getResponsiveHeight(80),
    lineHeight: getResponsiveFontSize(20),
    paddingHorizontal: getResponsiveWidth(10),
  },
  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: getResponsiveHeight(110),
    right: getResponsiveWidth(13),
    width: getResponsiveIconSize(65),
    height: getResponsiveIconSize(65),
    backgroundColor: BACKGROUND_COLORS.primaryBg,
    borderRadius: 999,
    justifyContent: 'center',
  },
  fabIcon: {
    alignSelf: 'center',
    width: '45%',
    height: '45%',
    resizeMode: 'contain',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
});
