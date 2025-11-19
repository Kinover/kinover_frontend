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
import ChatRoomItem from '../components/chatRoomItem';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import FastImage from 'react-native-fast-image2';
import YellowSpinner from '../../../components/YellowSpinner';

export default function CommunicationScreen({navigation}) {
  const dispatch = useDispatch();
  const {userId, login} = useSelector(s => s.user);
  const {familyId} = useSelector(s => s.family);
  const {chatRoomList, loading, listRevision} = useSelector(s => s.chatRoom);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    if (familyId && userId != null) {
      dispatch(fetchChatRoomListThunk(familyId, userId));
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
    <View style={styles.container}>
      {loading && chatRoomList.length === 0 ? (
        <View style={styles.loaderWrapper}>
          <YellowSpinner />
        </View>
      ) : (
        <FlatList
          data={chatRoomList}
          key={`chatlist-${listRevision}`} // ✅ (옵션) 프레임 즉시 리마운트
          // keyExtractor={(item) => String(item.chatRoomId)}
          renderItem={renderItem}
          extraData={listRevision} // ⭐️ 변경이 있을 때마다 강제 리렌더
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          // extraData={chatRoomList}
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
          source={require('../../assets/icons/chat-floating-bt.png')}
          style={{width: '100%', height: '100%', objectFit: 'contain'}}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: getResponsiveWidth(18),
  },
  listContent: {
    paddingBottom: getResponsiveHeight(100),
    gap: getResponsiveHeight(8),
  },
  noChatMessage: {
    fontSize: getResponsiveFontSize(16),
    color: '#777',
    textAlign: 'center',
    marginTop: getResponsiveHeight(100),
    lineHeight: getResponsiveFontSize(24),
    paddingHorizontal: getResponsiveWidth(10),
  },
  loader: {alignSelf: 'center', marginTop: getResponsiveHeight(100)},
  fab: {
    position: 'absolute',
    bottom: getResponsiveHeight(15),
    right: getResponsiveWidth(15),
    width: getResponsiveIconSize(75),
    height: getResponsiveIconSize(75),
    zIndex: 0,
  },
  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
