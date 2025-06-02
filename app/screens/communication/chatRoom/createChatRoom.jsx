import React, {useState, useEffect, useLayoutEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import axios from 'axios';
import {useSelector, useDispatch} from 'react-redux';
import {createChatRoomThunk} from '../../../redux/thunk/chatRoomThunk';

import {getToken} from '../../../utils/storage';
import {
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import {fetchFamilyUserListThunk} from '../../../redux/thunk/familyUserThunk';

export default function CreateChatRoom({navigation}) {
  const dispatch = useDispatch();
  const family = useSelector(state => state.family);
  const currentUserId = useSelector(state => state.user.userId);
  const familyUserList = useSelector(state => state.userFamily.familyUserList);
  const loading = useSelector(state => state.userFamily.loading);

  const [selected, setSelected] = useState([]);
  const [roomName, setRoomName] = useState('');

  // 가족 유저 목록 불러오기
  useEffect(() => {
    if (family.familyId) {
      dispatch(fetchFamilyUserListThunk(family.familyId));
    }
  }, []);

  // 헤더 구성
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text style={{fontSize: 18, textAlign: 'center'}}>채팅방 만들기</Text>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleCreateChatRoom}
          style={{marginRight: 15}}>
          <Image
            source={require('../../../assets/images/check-bt.png')}
            style={{
              width: 25,
              height: 25,
              resizeMode: 'contain',
              right: getResponsiveWidth(10),
            }}
          />
        </TouchableOpacity>
      ),
    });
  }, [selected, roomName]);

  // 선택 토글
  const toggleUser = userId => {
    setSelected(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId],
    );
  };

  // 채팅방 생성 요청
  const handleCreateChatRoom = async () => {
    if (selected.length === 0 || !roomName.trim()) return;

    const idsStr = selected.join(',');

    try {
      const result = await dispatch(
        createChatRoomThunk({roomName, userIds: idsStr}),
      ).unwrap(); // unwrap으로 결과 직접 받기

      console.log('🟢 채팅방 생성 성공:', result);
      navigation.navigate('ChatScreen', {chatRoomId: result.chatRoomId});
    } catch (err) {
      console.error('🔴 채팅방 생성 실패:', err);
    }
  };

  const selectableUsers = familyUserList.filter(
    user => user.userId !== currentUserId,
  );

  return (
    <View style={styles.container}>
      {/* 채팅방 이름 입력 */}
      <View style={styles.inputContainer}>
        <TextInput
          value={roomName}
          onChangeText={setRoomName}
          placeholder="채팅방 이름을 입력하세요"
          style={styles.input}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#F8B500" />
      ) : (
        <ScrollView>
          {selectableUsers.map(user => {
            const isSelected = selected.includes(user.userId);
            return (
              <TouchableOpacity
                key={user.userId}
                onPress={() => toggleUser(user.userId)}
                style={[
                  styles.userItem,
                  isSelected && styles.userItemSelected,
                ]}>
                <View style={styles.userInfo}>
                  <Image source={{uri: user.image}} style={styles.userImage} />
                  <Text style={styles.userName}>{user.name}</Text>
                </View>
                <Image
                  source={
                    isSelected
                      ? require('../../../assets/images/selected-bt.png')
                      : require('../../../assets/images/unselected-bt.png')
                  }
                  style={styles.selectIcon}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderTopWidth: 3,
    borderColor: '#D3D3D3',
  },
  inputContainer: {
    padding: getResponsiveWidth(20),
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-Regular',
    borderBottomWidth: 0.5,
    borderColor: '#B0B0B0',
    paddingVertical: getResponsiveHeight(8),
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(15),
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveWidth(22.5),
  },
  userItemSelected: {
    backgroundColor: '#FFF2CC',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(5),
  },
  userImage: {
    width: getResponsiveIconSize(45),
    height: getResponsiveIconSize(45),
    borderRadius: getResponsiveIconSize(22.5),
    marginRight: getResponsiveWidth(10),
    backgroundColor: '#eee',
  },
  userName: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-Regular',
  },
  selectIcon: {
    width: getResponsiveWidth(14),
    height: getResponsiveHeight(14),
    resizeMode: 'contain',
  },
});
