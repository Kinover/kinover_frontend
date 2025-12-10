import React, {useEffect, useCallback, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchChatRoomListThunk} from '../store/chatRoomThunk';
import ChatRoomItem from '../components/ChatRoomItem';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import FastImage from '@d11/react-native-fast-image';
import YellowSpinner from '../../../components/YellowSpinner';
// import SwipeNavigator from 'components/SwipeNavigator';
import {EMPTY_STYLE} from 'styles/style';

export default function CommunicationScreen({navigation}) {
  const dispatch = useDispatch();
  const {userId, login} = useSelector(s => s.user);
  const {familyId} = useSelector(s => s.family);
  const {chatRoomList, loading, listRevision} = useSelector(s => s.chatRoom);
  const [refreshing, setRefreshing] = useState(false);
  
  const load = useCallback(() => {
    console.log('[CommunicationScreen] load 호출', { familyId, userId });
  
    if (familyId != null && userId != null) {
      console.log('[CommunicationScreen] fetchChatRoomListThunk 디스패치');
      dispatch(fetchChatRoomListThunk(familyId, userId));
    } else {
      console.log(
        '[CommunicationScreen] 조건 불만족으로 fetch 생략',
        { familyId, userId },
      );
    }
  }, [dispatch, familyId, userId]);

  useEffect(() => {
    load();
  }, [load, login]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const renderItem = useCallback(
    ({item}) => (
      <ChatRoomItem chatRoom={item} userId={userId} navigation={navigation} />
    ),
    [navigation, userId],
  );

  return (
    // <SwipeNavigator
    //   rightTo="일정" // 오른쪽→왼쪽 스와이프
    //   leftTo="홈" // 필요하면 다른 화면 넣기
    // >
      <View style={styles.container}>
        {loading && chatRoomList.length === 0 ? (
          <View style={styles.loaderWrapper}>
            <YellowSpinner />
          </View>
        ) : (
          <FlatList
            data={chatRoomList}
            key={`chatlist-${listRevision}`}
            renderItem={renderItem}
            extraData={listRevision}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.noChatMessage}>
                {'아직 채팅방이 없어요.\n가족과의 첫 대화를 시작해볼까요?'}
              </Text>
            }
          />
        )}

        <TouchableOpacity
          onPress={() => navigation.navigate('채팅방생성화면')}
          style={styles.fab}>
          <FastImage
            source={require('../../../assets/icons/chat-floating-bt.png')}
            style={{width: '100%', height: '100%', resizeMode: 'contain'}}
          />
        </TouchableOpacity>
      </View>
    // </SwipeNavigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: getResponsiveWidth(14), // 🔽 살짝 줄임
  },
  listContent: {
    paddingTop: getResponsiveHeight(4),
    paddingBottom: getResponsiveHeight(80), // 🔽 여백 살짝 줄임
    gap: getResponsiveHeight(6), // 🔽 카드 사이 간격 줄임
  },
  noChatMessage: {
    fontSize: EMPTY_STYLE.emptyFontSize,
    fontFamily: EMPTY_STYLE.emptyFontFamily,
    color: EMPTY_STYLE.emptyColor,
    textAlign: 'center',
    marginTop: getResponsiveHeight(80), // 🔽 살짝 위로
    lineHeight: getResponsiveFontSize(20), // 🔽 24 → 20
    paddingHorizontal: getResponsiveWidth(10),
  },
  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: getResponsiveHeight(20),
    right: getResponsiveWidth(18),
    width: getResponsiveIconSize(60), // 🔽 75 → 60
    height: getResponsiveIconSize(60),
  },
});
