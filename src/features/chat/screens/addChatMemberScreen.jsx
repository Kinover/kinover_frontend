import React, {useState, useEffect, useLayoutEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
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
import {fetchFamilyUserListThunk} from '../../home/store/familyUserThunk';
import useHideTabBar from '../../../hooks/useHideTabBar';
import FastImage from '@d11/react-native-fast-image';
import {HEADER_STYLES} from 'styles/style';

export default function AddChatMemberScreen({navigation, route}) {
  const {chatRoomId} = route.params;
  const dispatch = useDispatch();
  const family = useSelector(state => state.family);
  const chatRoomUsers = useSelector(state => state.chatRoom.chatRoomUsers);
  const familyUserList = useSelector(state => state.userFamily.familyUserList);
  const loading = useSelector(state => state.userFamily.loading);
  const [selected, setSelected] = useState([]);

  useHideTabBar({stayHidden: true});

  useEffect(() => {
    if (family.familyId) {
      dispatch(fetchFamilyUserListThunk(family.familyId));
    }
  }, [dispatch, family.familyId]);

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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <Text style={styles.headerTitle}>새 멤버 초대</Text>,
      headerRight: () => (
        <TouchableOpacity
          onPress={handleNext}
          style={{marginRight: getResponsiveWidth(10)}}>
          <FastImage
            source={require('../../../assets/icons/check.png')}
            style={styles.headerCheckIcon}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, selected, handleNext]);

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
    borderTopWidth: 2,
    borderColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: HEADER_STYLES.defaultTitleFontSize, // 🔽 18 → 17
    textAlign: 'center',
    fontFamily: HEADER_STYLES.defaultTitleFontFamily,
    color:HEADER_STYLES.defaultTitleFontColor,
  },
  headerRight: {
    marginRight: getResponsiveWidth(15),
  },
  headerCheckIcon: {
    width: getResponsiveWidth(24), // 🔽 30 → 24
    height: getResponsiveHeight(24), // 🔽 30 → 24
    marginRight: getResponsiveWidth(15),
    resizeMode: 'contain',
  },

  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: getResponsiveHeight(13), // 🔽 15 → 13
    paddingHorizontal: getResponsiveWidth(20), // 살짝 줄임
  },
  userItemSelected: {
    backgroundColor: '#FFF2CC',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(6),
  },
  userImage: {
    width: getResponsiveIconSize(40), // 🔽 45 → 40
    height: getResponsiveIconSize(40),
    borderRadius: getResponsiveIconSize(20),
    marginRight: getResponsiveWidth(8),
    backgroundColor: '#eee',
  },
  userName: {
    fontSize: getResponsiveFontSize(15), // 🔽 16 → 15
    fontFamily: 'Pretendard-Regular',
    color: '#222',
  },
  selectIcon: {
    width: getResponsiveIconSize(13), // 🔽 14 → 13
    height: getResponsiveIconSize(13),
    resizeMode: 'contain',
  },
});
