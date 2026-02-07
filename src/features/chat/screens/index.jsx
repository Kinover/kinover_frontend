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
import {fetchFamilyUserListThunk} from '../../home/store/familyUserThunk';

import ChatRoomItem from '../components/ChatRoomItem';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';

import YellowSpinner from '../../../components/YellowSpinner';
import ToastModal from '../../../components/modal/ToastModal';

import {BACKGROUND_COLORS, EMPTY_STYLE} from 'styles/style';
import {hapticLight} from '../../../utils/haptic';
import DropShadow from 'react-native-drop-shadow';

// ✅ 너가 만든 바텀시트
import CreateChatRoomBottomSheet from '../components/CreateChatRoomBottomSheet';

export default function CommunicationScreen({navigation}) {
  const dispatch = useDispatch();

  const modalRef = useRef(null);

  const {userId, login} = useSelector(s => s.user);
  const {familyId} = useSelector(s => s.family);

  const {chatRoomList, loading, listRevision} = useSelector(s => s.chatRoom);

  // ✅ 바텀시트에 필요한 가족 유저 리스트
  const familyUserList = useSelector(s => s.userFamily.familyUserList);
  const familyUserLoading = useSelector(s => s.userFamily.loading);

  const [refreshing, setRefreshing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  // ✅ 채팅방 리스트 load
  const load = useCallback(async () => {
    if (familyId != null && userId != null) {
      const result = await dispatch(fetchChatRoomListThunk(familyId, userId));
      return result;
    }
    return null;
  }, [dispatch, familyId, userId]);

  useEffect(() => {
    load();
  }, [load, login]);

  // ✅ 가족 유저 목록도 미리 가져오기(바텀시트 열 때 바로 뜨게)
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

  const renderItem = useCallback(
    ({item}) => (
      <ChatRoomItem chatRoom={item} userId={userId} navigation={navigation} />
    ),
    [navigation, userId],
  );

  // ✅ 바텀시트 members 변환 (본인 제외)
  const members = useMemo(() => {
    return (familyUserList || [])
      .filter(u => u?.userId !== userId)
      .map(u => ({
        id: u.userId,
        name: u.name,
        disabled: false,
      }));
  }, [familyUserList, userId]);

  // ✅ 바텀시트 열기
  const openCreateChatRoomSheet = useCallback(() => {
    hapticLight?.();
    modalRef.current?.present?.();
  }, []);

  // ✅ 바텀시트 저장(onSubmit) → 채팅방 생성 thunk 연결
  const handleSubmit = useCallback(
    async ({roomName, userIds}) => {
      if (!Array.isArray(userIds) || userIds.length === 0) return;

      const idsStr = userIds.join(',');

      // roomName 비어있으면 선택된 사람들 이름으로 자동 생성
      const selectedUserNames = (familyUserList || [])
        .filter(u => userIds.includes(u.userId))
        .map(u => u.name);

      const autoRoomName = selectedUserNames.join(', ');
      const finalRoomName =
        roomName && roomName.trim().length > 0 ? roomName.trim() : autoRoomName;

      await dispatch(
        createChatRoomThunk({
          roomName: finalRoomName,
          userIds: idsStr,
          familyId,
        }),
      ).unwrap();

      // ✅ 성공 토스트
      setToastVisible(true);

      // ✅ 생성 후 리스트 갱신
      await load();
    },
    [dispatch, familyId, familyUserList, load],
  );

  return (
    <View style={styles.container}>
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
          showsVerticalScrollIndicator={true}
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

      {/* ✅ 채팅방 만들기 바텀시트 (화면 이동 없이 present로만 띄움) */}
      <CreateChatRoomBottomSheet
        modalRef={modalRef}
        members={members}
        initialRoomName=""
        initialSelectedIds={[]}
        onSubmit={handleSubmit}
        requireRoomName={false}
        maxRoomNameLength={30}
        // snapPoints={['57%']}
      />

      {/* ✅ 완료 토스트 */}
      <ToastModal
        visible={toastVisible}
        message="채팅방을 생성했어요"
        onClose={() => setToastVisible(false)}
        duration={1000}
      />

      <DropShadow
        style={{
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 3},
          shadowOpacity: 0.08,
          shadowRadius: 3,
        }}>
        <TouchableOpacity
          onPress={openCreateChatRoomSheet}
          style={styles.fab}
          activeOpacity={0.8}>
          <Image
            source={require('../../../assets/icons/tabs/2/two.png')}
            style={{
              alignSelf: 'center',
              width: '45%',
              height: '45%',
              resizeMode: 'contain',
            }}
            tintColor={'white'}
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
});
