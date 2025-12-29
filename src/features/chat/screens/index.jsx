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
import {EMPTY_STYLE} from 'styles/style';
import {hapticLight} from '../../../utils/haptic';


export default function CommunicationScreen({navigation}) {
  const dispatch = useDispatch();
  const {userId, login} = useSelector(s => s.user);
  const {familyId} = useSelector(s => s.family);
  const {chatRoomList, loading, listRevision} = useSelector(s => s.chatRoom);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ 갱신(load)할 때 채팅방 리스트 + 알림 unread 같이 갱신
  const load = useCallback(async () => {
    console.log('[CommunicationScreen] load 호출', {familyId, userId});

    if (familyId != null && userId != null) {
      console.log('[CommunicationScreen] fetchChatRoomListThunk 디스패치');

      // 1) 채팅방 리스트 갱신
      const result = await dispatch(fetchChatRoomListThunk(familyId, userId));

      return result;
    } else {
      console.log('[CommunicationScreen] 조건 불만족으로 fetch 생략', {
        familyId,
        userId,
      });
      return null;
    }
  }, [dispatch, familyId, userId]);

  useEffect(() => {
    load();
  }, [load, login]);

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

  const handleFabPress = useCallback(() => {
    hapticLight();
    navigation.navigate('채팅방생성화면');
  }, [navigation]);

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
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.noChatMessage}>
              {'아직 채팅방이 없어요.\n가족과의 첫 대화를 시작해볼까요?'}
            </Text>
          }
          keyExtractor={item => String(item?.chatRoomId)}
        />
      )}

      <TouchableOpacity onPress={handleFabPress} style={styles.fab}>
        <FastImage
          source={require('../../../assets/icons/chat-floating-bt.png')}
          style={{width: '100%', height: '100%', resizeMode: 'contain'}}
        />
      </TouchableOpacity>
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
    fontSize: EMPTY_STYLE.emptyFontSize,
    fontFamily: EMPTY_STYLE.emptyFontFamily,
    color: EMPTY_STYLE.emptyColor,
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
    right: getResponsiveWidth(18),
    width: getResponsiveIconSize(60),
    height: getResponsiveIconSize(60),
  },
});
