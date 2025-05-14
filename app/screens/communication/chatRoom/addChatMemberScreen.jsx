import React, {useState, useEffect, useLayoutEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import {useSelector, useDispatch} from 'react-redux';

import {getToken} from '../../../utils/storage';
import {
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import {fetchFamilyUserListThunk} from '../../../redux/thunk/familyUserThunk';

export default function AddChatMemberScreen({navigation, route}) {
  const {chatRoomId} = route.params;
  const dispatch = useDispatch();
  const family = useSelector(state => state.family);
  const chatRoomUsers = useSelector(state => state.chatRoom.chatRoomUsers);
  const familyUserList = useSelector(state => state.userFamily.familyUserList);
  const loading = useSelector(state => state.userFamily.loading);

  const [selected, setSelected] = useState([]);

  // 유저 데이터 불러오기
  useEffect(() => {
    if (family.familyId) {
      dispatch(fetchFamilyUserListThunk(family.familyId));
    }
  }, []);

  // 헤더 구성
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text style={{fontSize: 18, textAlign: 'center'}}>
          멤버 초대하기 ({selected.length})
        </Text>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={handleNext} style={{marginRight: 15}}>
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
  }, [selected]);

  // 채팅방에 아직 없는 유저 필터링
  const selectableUsers = familyUserList.filter(
    user => !chatRoomUsers.find(u => u.userId === user.userId),
  );

  // 선택 토글
  const toggleUser = userId => {
    setSelected(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId],
    );
  };

  // 초대 요청
  const handleNext = async () => {
    if (selected.length === 0) return;

    try {
      const token = await getToken();
      const idsStr = selected.join(',');

      await axios.post(
        `http://43.200.47.242:9090/api/chatRoom/${chatRoomId}/addUsers/${idsStr}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      navigation.goBack(); // 초대 후 뒤로 이동
    } catch (err) {
      console.error('유저 초대 실패:', err);
    }
  };

  return (
    <View style={styles.container}>
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
                <Image source={{uri: user.image}} style={styles.userImage} />
                <Text style={styles.userName}>{user.name}</Text>
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
    padding: getResponsiveWidth(10),
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(10),
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  userItemSelected: {
    backgroundColor: '#FFF2CC',
  },
  userImage: {
    width: getResponsiveIconSize(40),
    height: getResponsiveIconSize(40),
    borderRadius: getResponsiveIconSize(20),
    marginRight: getResponsiveWidth(10),
    backgroundColor: '#eee',
  },
  userName: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-SemiBold',
  },
});
