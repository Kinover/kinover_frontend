/* =========================================================
 * src/features/chat/screens/AddChatMemberScreen.jsx
 * - 초대 성공 시: route.params.onInvited 콜백 호출 → goBack
 * - 네비 이름/merge 필요 없음
 * ========================================================= */

import React, {useState, useEffect, useLayoutEffect, useCallback} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import AppText from 'components/AppText';

import { apiClient } from 'utils/apiClient';
import {CHAT_ROOM} from 'config/apiEndpoints';
import {useSelector, useDispatch} from 'react-redux';

import {
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
} from 'utils/responsive';
import {fetchFamilyUserListThunk} from 'features/home/store/familyUserThunk';
import useHideTabBar from 'hooks/useHideTabBar';
import FastImage from '@d11/react-native-fast-image';
import {HEADER_STYLES} from 'styles/style';

// 기존 JSX의 <Text />를 접근성 정책 포함 AppText로 통일
const Text = AppText;

export default function AddChatMemberScreen({navigation, route}) {
  const {chatRoomId, onInvited} = route.params; // 콜백 받기

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

  const selectableUsers = (familyUserList || []).filter(
    user => !(chatRoomUsers || []).find(u => u.userId === user.userId),
  );

  const toggleUser = userId => {
    setSelected(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId],
    );
  };

  const handleNext = useCallback(async () => {
    if (selected.length === 0) return;

    try {
      const idsStr = selected.join(',');

      await apiClient.post(CHAT_ROOM.addUsers(chatRoomId, idsStr), null);

      if (typeof onInvited === 'function') {
        onInvited({
          count: selected.length,
 // message: '멤버를 초대했어요.' // 필요하면 커스텀
        });
      }

 // goBack으로 자연스럽게 복귀
      navigation.goBack();
    } catch (err) {
      console.error('유저 초대 실패:', err?.response?.data || err?.message || err);
    }
  }, [chatRoomId, navigation, onInvited, selected]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text style={styles.headerTitle}>
          새 멤버 초대
        </Text>
      ),
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
  }, [navigation, handleNext]);

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
                style={[styles.userItem, isSelected && styles.userItemSelected]}>
                <View style={styles.userInfo}>
                  <Image source={{uri: user.image}} style={styles.userImage} />
                  <Text style={styles.userName}>
                    {user.name}
                  </Text>
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
    fontSize: HEADER_STYLES().defaultTitleFontSize,
    textAlign: 'center',
    fontFamily: HEADER_STYLES().defaultTitleFontFamily,
    color: HEADER_STYLES().defaultTitleFontColor,
  },
  headerCheckIcon: {
    width: getResponsiveWidth(24),
    height: getResponsiveHeight(24),
    marginRight: getResponsiveWidth(15),
    resizeMode: 'contain',
  },

  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: getResponsiveHeight(13),
    paddingHorizontal: getResponsiveWidth(20),
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
    width: getResponsiveIconSize(40),
    height: getResponsiveIconSize(40),
    borderRadius: getResponsiveIconSize(20),
    marginRight: getResponsiveWidth(8),
    backgroundColor: '#eee',
  },
  userName: {
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'Pretendard-Regular',
    color: '#222',
  },
  selectIcon: {
    width: getResponsiveIconSize(13),
    height: getResponsiveIconSize(13),
    resizeMode: 'contain',
  },
});
