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

import {getToken} from '../../../../utils/storage';
import {
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
} from '../../../../utils/responsive';
import {fetchFamilyUserListThunk} from '../../../../redux/thunk/familyUserThunk';
import useHideTabBar from '../../../../hooks/useHideTabBar';

export default function AddChatMemberScreen({navigation, route}) {
  const {chatRoomId} = route.params;
  const dispatch = useDispatch();
  const family = useSelector(state => state.family);
  const chatRoomUsers = useSelector(state => state.chatRoom.chatRoomUsers);
  const familyUserList = useSelector(state => state.userFamily.familyUserList);
  const loading = useSelector(state => state.userFamily.loading);
  const [selected, setSelected] = useState([]);

  useHideTabBar({ stayHidden: true });

  useEffect(() => {
    if (family.familyId) {
      dispatch(fetchFamilyUserListThunk(family.familyId));
    }
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <Text style={styles.headerTitle}>새 멤버 초대</Text>,
      headerRight: () => (
        <TouchableOpacity onPress={handleNext} style={styles.headerRight}>
          <Image
            source={require('../../../../assets/images/check-bt.png')}
            style={styles.headerIcon}
          />
        </TouchableOpacity>
      ),
    });
  }, [selected]);

  const selectableUsers = familyUserList.filter(
    user => !chatRoomUsers.find(u => u.userId === user.userId),
  );

  const toggleUser = userId => {
    setSelected(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId],
    );
  };

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

      navigation.goBack();
    } catch (err) {
      console.error('유저 초대 실패:', err);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#F8B500" />
      ) : (
        <ScrollView style={{flex: 1}}>
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
                      ? require('../../../../assets/images/selected-bt.png')
                      : require('../../../../assets/images/unselected-bt.png')
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
  headerTitle: {
    fontSize: getResponsiveFontSize(18),
    textAlign: 'center',
    fontFamily: 'Pretendard-Medium',
  },
  headerRight: {
    marginRight: getResponsiveWidth(15),
  },
  headerIcon: {
    width: getResponsiveIconSize(25),
    height: getResponsiveIconSize(25),
    resizeMode: 'contain',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: getResponsiveHeight(15),
    paddingHorizontal: getResponsiveWidth(22),
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
    width: getResponsiveIconSize(14),
    height: getResponsiveIconSize(14),
    resizeMode: 'contain',
  },
});
