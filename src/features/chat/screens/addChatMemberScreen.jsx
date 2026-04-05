/* =========================================================
 * AddChatMemberScreen
 * - 가족 구성원 중 현재 채팅방에 없는 멤버를 선택해 초대
 * - RTK Query: getChatRoomUsers / addUsersToChatRoom
 * ========================================================= */

import React, {useState, useEffect, useLayoutEffect, useCallback} from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import {useSelector} from 'react-redux';
import FastImage from '@d11/react-native-fast-image';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import useHideTabBar from 'hooks/useHideTabBar';
import {useGetFamilyUsersQuery} from 'features/home/services/homeApi';
import {
  useGetChatRoomUsersQuery,
  useAddUsersToChatRoomMutation,
} from '../services/chatApi';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
} from 'utils/responsive';
import {HEADER_STYLES} from 'styles/style';

export default function AddChatMemberScreen({navigation, route}) {
  const styles = useScaledStyleSheet(rf => ({
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
      fontSize: rf(15),
      fontFamily: 'Pretendard-Regular',
      color: '#222',
    },
    selectIcon: {
      width: getResponsiveIconSize(13),
      height: getResponsiveIconSize(13),
      resizeMode: 'contain',
    },
  }));

  const {chatRoomId, onInvited} = route.params || {};
  const familyId = useSelector(state => state.family?.familyId);
  const {data: familyUserList = [], isLoading: isFamilyUsersLoading} = useGetFamilyUsersQuery(familyId, {skip: !familyId});
  const [selected, setSelected] = useState([]);

  const {data: roomUsers = [], isLoading: roomUsersLoading} =
    useGetChatRoomUsersQuery(String(chatRoomId), {
      skip: !chatRoomId,
    });
  const [addUsersToChatRoom] = useAddUsersToChatRoomMutation();

  useHideTabBar({stayHidden: true});


  const selectableUsers = (familyUserList || []).filter(
    user => !(roomUsers || []).find(u => String(u.userId) === String(user.userId)),
  );

  const toggleUser = userId => {
    setSelected(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId],
    );
  };

  const handleInvite = useCallback(async () => {
    if (!chatRoomId || selected.length === 0) return;
    try {
      await addUsersToChatRoom({chatRoomId, userIds: selected}).unwrap();
      if (typeof onInvited === 'function') {
        onInvited({count: selected.length});
      }
      navigation.goBack();
    } catch (err) {
    }
  }, [addUsersToChatRoom, chatRoomId, navigation, onInvited, selected]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <AppText style={styles.headerTitle}>새 멤버 초대</AppText>,
      headerRight: () => (
        <TouchableOpacity
          onPress={handleInvite}
          style={{marginRight: getResponsiveWidth(10)}}>
          <FastImage
            source={require('assets/icons/check.png')}
            style={styles.headerCheckIcon}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, styles, handleInvite]);

  if (isFamilyUsersLoading || roomUsersLoading) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color="#F8B500" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={{flex: 1}}>
        {selectableUsers.map(user => {
          const isSelected = selected.includes(user.userId);
          return (
            <TouchableOpacity
              key={String(user.userId)}
              onPress={() => toggleUser(user.userId)}
              style={[styles.userItem, isSelected && styles.userItemSelected]}>
              <View style={styles.userInfo}>
                <Image source={{uri: user.image}} style={styles.userImage} />
                <AppText style={styles.userName}>{user.name}</AppText>
              </View>
              <Image
                source={
                  isSelected
                    ? require('assets/images/selected-bt.png')
                    : require('assets/images/unselected-bt.png')
                }
                style={styles.selectIcon}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
