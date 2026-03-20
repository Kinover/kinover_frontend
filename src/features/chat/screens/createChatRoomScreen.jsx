/* eslint-disable react-native/no-inline-styles */
// src/features/chat/screens/CreateChatRoom.jsx

import React, {useState, useEffect, useLayoutEffect, useRef, useCallback} from 'react';
import { View, ActivityIndicator } from 'react-native';

import {useSelector, useDispatch} from 'react-redux';
import {CommonActions} from '@react-navigation/native';

import {createChatRoomThunk} from '../store/chatRoomThunk';
import {fetchFamilyUserListThunk} from 'features/home/store/familyUserThunk';

import {
  getResponsiveWidth,
  getResponsiveHeight,
} from 'utils/responsive';

import ToastModal from 'components/modal/ToastModal';
import {HEADER_STYLES} from 'styles/style';
import AppText from 'components/AppText';

// 기존 JSX의 <AppText />를 접근성 정책 포함 AppText로 통일
const Text = AppText;

// 너가 만든 바텀시트 컴포넌트
import CreateChatRoomBottomSheet from '../components/modals/CreateChatRoomBottomSheet';

export default function CreateChatRoom({navigation}) {
  const dispatch = useDispatch();
  const modalRef = useRef(null);

  const family = useSelector(state => state.family);
  const currentUserId = useSelector(state => state.user.userId);
  const familyUserList = useSelector(state => state.userFamily.familyUserList);
  const loading = useSelector(state => state.userFamily.loading);

  const [toastVisible, setToastVisible] = useState(false);

 /**
 * 1) 헤더는 타이틀만(체크버튼 제거)
 * - 저장은 바텀시트 내부 "저장하기"로 처리하니까
 */
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <AppText style={styles.headerTitle}>
          채팅방 만들기
        </AppText>
      ),
      headerRight: () => null,
    });
  }, [navigation]);

 /**
 * 2) 가족 유저 목록 가져오기 (기존 코드 그대로)
 */
  useEffect(() => {
    if (family.familyId) {
      dispatch(fetchFamilyUserListThunk(family.familyId));
    }
  }, [dispatch, family.familyId]);

 /**
 * 3) 이 화면 들어오면 바텀시트 자동으로 열기
 */
  useEffect(() => {
    const t = setTimeout(() => {
      modalRef.current?.present?.();
    }, 0);

    return () => clearTimeout(t);
  }, []);

 /**
 * 4) 바텀시트 칩용 members 만들기
 * - 네 바텀시트는 members: [{id, name, disabled?}] 형태
 * - 여기서는 본인 제외
 */
  const members = (familyUserList || [])
    .filter(u => u.userId !== currentUserId)
    .map(u => ({
      id: u.userId,
      name: u.name,
      disabled: false,
    }));

 /**
 * 5) 바텀시트 저장(onSubmit) → 기존 createChatRoomThunk 로직 이식
 * - roomName이 빈 값이면: 기존처럼 선택된 사람들 이름으로 자동 생성
 */
  const handleSubmit = useCallback(
    async ({roomName, userIds}) => {
 // userIds: 배열 형태로 들어옴
      if (!Array.isArray(userIds) || userIds.length === 0) return;

      const idsStr = userIds.join(',');

      const selectedUserNames = (familyUserList || [])
        .filter(user => userIds.includes(user.userId))
        .map(user => user.name);

      const autoRoomName = selectedUserNames.join(', ');
      const finalRoomName =
        roomName && roomName.trim().length > 0 ? roomName.trim() : autoRoomName;

      await dispatch(
        createChatRoomThunk({
          roomName: finalRoomName,
          userIds: idsStr,
          familyId: family.familyId,
        }),
      ).unwrap();

 // 성공 토스트
      setToastVisible(true);

 // 잠깐 뒤 소통 탭으로 이동
      setTimeout(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: '소통'}],
          }),
        );
      }, 1200);
    },
    [dispatch, family.familyId, familyUserList, navigation],
  );

  return (
    <View style={styles.container}>
      {/* 로딩이면 스켈레톤/인디케이터만 보여주고, 바텀시트는 members 비어있어도 렌더 가능 */}
      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#F8B500" />
        </View>
      )}

      {/* 너가 만든 바텀시트 적용 */}
      <CreateChatRoomBottomSheet
        modalRef={modalRef}
        members={members}
        initialRoomName=""          // 필요하면 기본값 넣어도 됨
        initialSelectedIds={[]}     // 처음엔 아무도 선택 X
        onSubmit={handleSubmit}
        requireRoomName={false}     // 이름 필수 아니게(기존처럼 자동이름 가능)
        maxRoomNameLength={30}
        snapPoints={['92%']}
      />

      {/* 채팅방 생성 완료 토스트(기존 그대로) */}
      <ToastModal
        visible={toastVisible}
        message="채팅방을 생성했어요"
        onClose={() => setToastVisible(false)}
        duration={1000}
      />
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: 'white',
  },

  headerTitle: {
    fontSize: HEADER_STYLES().defaultTitleFontSize,
    textAlign: 'center',
    fontFamily: HEADER_STYLES().defaultTitleFontFamily,
    color: HEADER_STYLES().defaultTitleFontColor,
  },

  loadingWrap: {
    position: 'absolute',
    top: getResponsiveHeight(220),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },

  headerCheckIcon: {
    width: getResponsiveWidth(24),
    height: getResponsiveHeight(24),
    marginRight: getResponsiveWidth(15),
    resizeMode: 'contain',
  },
};
