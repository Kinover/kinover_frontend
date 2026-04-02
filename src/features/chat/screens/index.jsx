/* eslint-disable react-native/no-inline-styles */
// src/features/chat/screens/CommunicationScreen.jsx

import React, {useEffect, useCallback, useState, useRef, useMemo} from 'react';
import { StyleSheet, View, TouchableOpacity, FlatList, RefreshControl, Image } from 'react-native';
import AppText from 'components/AppText';
import {useDispatch, useSelector} from 'react-redux';

import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  useGetChatRoomsQuery,
  useCreateChatRoomMutation,
} from '../services/chatApi';
import {fetchFamilyUserListThunk} from 'features/home/store/familyUserThunk';

import ChatRoomItem from '../components/rooms/chatRoomItem';
import SkeletonChatRoomItem from '../components/rooms/SkeletonChatRoomItem';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from 'utils/responsive';

import ToastModal from 'components/modal/ToastModal';

import {BACKGROUND_COLORS, EMPTY_STYLE} from 'styles/style';
import {hapticLight} from 'utils/haptic';
import DropShadow from 'react-native-drop-shadow';

import CreateChatRoomBottomSheet from '../components/modals/CreateChatRoomBottomSheet';
import ChatGuideModal from '../components/guides/ChatGuideModal';
import {STORE_MOCK_ENABLED} from '../../home/utils/storeMockData';

// 기존 JSX의 <AppText />를 접근성 정책 포함 AppText로 통일
const Text = AppText;

export default function CommunicationScreen({navigation}) {
  const styles = useScaledStyleSheet(rf => ({

  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  listWrap: { flex: 1 },
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
    lineHeight: rf(20),
    paddingHorizontal: getResponsiveWidth(10),
  },
  emptyWrapper: {
    paddingTop: getResponsiveHeight(80),
    alignItems: 'center',
    paddingHorizontal: getResponsiveWidth(20),
  },
  emptyIcon: {
    fontSize: getResponsiveFontSize(38),
    marginBottom: getResponsiveHeight(8),
  },
  emptyText: {
    fontSize: EMPTY_STYLE().emptyFontSize,
    fontFamily: EMPTY_STYLE().emptyFontFamily,
    color: EMPTY_STYLE().emptyColor,
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: getResponsiveHeight(4),
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-Regular',
    color: EMPTY_STYLE().emptyColor,
    textAlign: 'center',
    lineHeight: getResponsiveHeight(18),
  },
  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: getResponsiveHeight(110),
    right: getResponsiveWidth(13),
    width: getResponsiveIconSize(65),
    height: getResponsiveIconSize(65),
  },
  fabShadow: {
    width: '100%',
    height: '100%',
  },
  fabMeasure: {
    ...StyleSheet.absoluteFillObject,
  },
  fab: {
    width: '100%',
    height: '100%',
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

  }));
  const dispatch = useDispatch();
  const modalRef = useRef(null);

  const {userId, login} = useSelector(s => s.user);
  const {familyId} = useSelector(s => s.family);

  // RTK Query: 채팅방 목록 (onQueryFulfilled에서 chatRoomSlice.setChatRoomList 동기화)
  const {isLoading, refetch} = useGetChatRoomsQuery(
    {familyId, userId},
    {skip: !familyId || !userId},
  );
  // 실제 목록은 WS 핸들러가 slice에도 업데이트하므로 slice에서 읽음
  const {chatRoomList, listRevision} = useSelector(s => s.chatRoom);
  const loading = isLoading;

  // RTK Query: 채팅방 생성 mutation
  const [createChatRoom] = useCreateChatRoomMutation();

  const familyUserList = useSelector(s => s.userFamily.familyUserList);

  const [refreshing, setRefreshing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

 /** =========================
 * 데이터 로딩
   ========================= */
  // RTK Query가 familyId/userId 변경 시 자동 refetch
  // login 상태 변경 시도 refetch
  useEffect(() => {
    if (familyId != null && userId != null) {
      refetch();
    }
  }, [login]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (familyId != null) {
      dispatch(fetchFamilyUserListThunk(familyId));
    }
  }, [dispatch, familyId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

 /** =========================
 * 리스트 렌더
   ========================= */
  const renderItem = useCallback(
    ({item}) => {
      const isKino = !!item?.kino;
      const content = (
        <ChatRoomItem
          chatRoom={item}
          userId={userId}
          navigation={navigation}
        />
      );
      if (isKino) {
        return (
          <View ref={guideKinoRef} collapsable={false}>
            {content}
          </View>
        );
      }
      return content;
    },
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

  const guideTargetRef = useRef(null);
  const guideKinoRef = useRef(null);

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

      // RTK Query mutation: 성공 시 invalidateTags(['ChatRoom']) → 자동 refetch
      await createChatRoom({
        roomName: finalRoomName,
        userIds,
        familyId,
      }).unwrap();

      setToastVisible(true);
    },
    [createChatRoom, familyId, familyUserList],
  );

 /** =========================
 * 렌더
   ========================= */
 // iOS: 가이드 모달 닫은 뒤 터치 복구용
  const [contentKey, setContentKey] = useState(0);
  const handleGuideAfterClose = useCallback(() => setContentKey(k => k + 1), []);

  return (
    <View style={styles.container}>
      {/* 소통 가이드 모달: 실제 화면 위 오버레이 */}
      <ChatGuideModal
        enabled={true}
        ready={!loading && !!familyId}
        forceVisible={false}
        onAfterClose={handleGuideAfterClose}
        targetRef={guideTargetRef}
        targetRefsByKey={{
          kino_counseling: guideKinoRef,
          chat_action: guideTargetRef,
        }}
      />

      <View key={contentKey} style={styles.listWrap}>
      {loading && chatRoomList.length === 0 ? (
        <FlatList
          data={Array.from({length: 6}, (_, i) => `skeleton-${i}`)}
          keyExtractor={item => item}
          renderItem={() => <SkeletonChatRoomItem />}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      ) : (
        <FlatList
          data={chatRoomList}
          renderItem={renderItem}
          extraData={listRevision}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <AppText style={styles.emptyIcon}>💬</AppText>
              <AppText style={styles.emptyText}>아직 채팅방이 없어요.</AppText>
              <AppText style={styles.emptySubText}>
                오른쪽 아래 버튼을 눌러{'\n'}가족과의 첫 대화를 시작해보세요.
              </AppText>
            </View>
          }
          keyExtractor={item => String(item?.chatRoomId)}
        />
      )}
      </View>

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

      {/* FAB를 화면 하단 고정 + 가이드 측정 정확도를 위한 절대 위치 래퍼 */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        <DropShadow style={[styles.shadow, styles.fabShadow]} pointerEvents="box-none">
          <View
            ref={guideTargetRef}
            collapsable={false}
            pointerEvents="none"
            style={styles.fabMeasure}
          />
          <TouchableOpacity
            onPress={openCreateChatRoomSheet}
            style={styles.fab}
            activeOpacity={0.8}
            accessibilityLabel="새 채팅방 만들기"
            accessibilityRole="button">
            <Image
              source={require('assets/icons/tabs/2/two.png')}
              style={styles.fabIcon}
              tintColor="white"
              accessibilityIgnoresInvertColors
            />
          </TouchableOpacity>
        </DropShadow>
      </View>
    </View>
  );
}

