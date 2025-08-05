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
import {useSelector, useDispatch} from 'react-redux';
import {createChatRoomThunk} from '../../redux/thunk/chatRoomThunk';
import {fetchFamilyUserListThunk} from '../../redux/thunk/familyUserThunk';

import {
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
} from '../../utils/responsive';
import useHideTabBar from '../../hooks/useHideTabBar';

export default function CreateChatRoom({navigation}) {
  const dispatch = useDispatch();
  const family = useSelector(state => state.family);
  const currentUserId = useSelector(state => state.user.userId);
  const familyUserList = useSelector(state => state.userFamily.familyUserList);
  const loading = useSelector(state => state.userFamily.loading);
  const [selected, setSelected] = useState([]);

  useHideTabBar();

  useEffect(() => {
    if (family.familyId) {
      dispatch(fetchFamilyUserListThunk(family.familyId));
    }
  }, [dispatch, family.familyId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text
          style={{
            fontSize: getResponsiveFontSize(17),
            fontFamily: 'Pretendard-Medium',
            textAlign: 'center',
          }}>
          채팅방 만들기
        </Text>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleCreateChatRoom}
          style={{marginRight: getResponsiveWidth(10)}}>
          <Image
            source={require('../../assets/icons/check.png')}
            style={styles.headerCheckIcon}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, selected]);

  const toggleUser = userId => {
    setSelected(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId],
    );
  };

  const handleCreateChatRoom = async () => {
    if (selected.length === 0) return;

    const idsStr = selected.join(',');

    const selectedUserNames = selectableUsers
      .filter(user => selected.includes(user.userId))
      .map(user => user.name);

    const autoRoomName = selectedUserNames.join(', ');

    try {
      const result = await dispatch(
        createChatRoomThunk({
          roomName: autoRoomName,
          userIds: idsStr,
        }),
      ).unwrap();

      navigation.navigate('소통');
    } catch (err) {
      console.error('🔴 채팅방 생성 실패:', err);
    }
  };

  const selectableUsers = familyUserList.filter(
    user => user.userId !== currentUserId,
  );

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
                <View style={styles.userInfo}>
                  <Image source={{uri: user.image}} style={styles.userImage} />
                  <Text style={styles.userName}>{user.name}</Text>
                </View>
                <Image
                  source={
                    isSelected
                      ? require('../../assets/images/selected-bt.png')
                      : require('../../assets/images/unselected-bt.png')
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
    borderTopWidth: 0.5,
    borderColor: 'lightgray',
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
  headerCheckIcon: {
    width: getResponsiveWidth(30),
    height: getResponsiveHeight(30),
    marginRight: getResponsiveWidth(15),
    resizeMode: 'contain',
  },
});
