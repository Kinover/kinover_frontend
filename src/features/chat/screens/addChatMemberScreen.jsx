/* =========================================================
 * AddChatMemberScreen
 * - 현재 채팅방 멤버 목록 표시
 * - 가족 구성원 중 현재 채팅방에 없는 멤버를 선택해 초대
 * - RTK Query: getChatRoomUsers / addUsersToChatRoom
 * ========================================================= */

import React, {useState, useLayoutEffect, useCallback} from 'react';
import { View, ScrollView, ActivityIndicator, Image } from 'react-native';
import SpringPressable from 'components/SpringPressable';
import {useSelector} from 'react-redux';
import FastImage from '@d11/react-native-fast-image';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import useHideTabBar from 'hooks/useHideTabBar';
import {useColors, useIsDark} from 'hooks/useColors';
import {useGetFamilyUsersQuery} from 'features/home/services/homeApi';
import {
  useGetChatRoomUsersQuery,
  useAddUsersToChatRoomMutation,
} from '../services/chatApi';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveFontSize,
} from 'utils/responsive';
import {FONTS} from 'styles/typography';

export default function AddChatMemberScreen({navigation, route}) {
  const isDark = useIsDark();
  const colors = useColors();
  const styles = useScaledStyleSheet(rf => ({
    container: {
      flex: 1,
      backgroundColor: colors.surfaceSecondary,
    },
    headerTitle: {
      fontSize: getResponsiveFontSize(20),
      textAlign: 'center',
      fontFamily: FONTS.MEDIUM,
      color: colors.textPrimary,
    },
    headerCheckIcon: {
      width: getResponsiveWidth(24),
      height: getResponsiveHeight(24),
      marginRight: getResponsiveWidth(15),
      resizeMode: 'contain',
    },
    sectionLabel: {
      fontSize: rf(12),
      fontFamily: FONTS.REGULAR,
      color: colors.textTertiary,
      marginBottom: getResponsiveHeight(6),
      marginLeft: getResponsiveWidth(4),
      marginTop: getResponsiveHeight(16),
      paddingHorizontal: getResponsiveWidth(16),
    },
    cardShadow: {
      marginHorizontal: getResponsiveWidth(16),
      marginBottom: getResponsiveHeight(8),
      shadowOpacity: 0,
      elevation: 0,
    },
    card: {
      backgroundColor: colors.surfacePrimary,
      borderRadius: getResponsiveIconSize(16),
      overflow: 'hidden',
    },
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: getResponsiveHeight(13),
      paddingHorizontal: getResponsiveWidth(16),
    },
    userItemSelected: {
      backgroundColor: colors.brandPrimarySoft,
    },
    divider: {
      height: 1,
      backgroundColor: colors.borderSubtle,
      marginLeft: getResponsiveWidth(16 + 40 + 12),
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    userImage: {
      width: getResponsiveIconSize(40),
      height: getResponsiveIconSize(40),
      borderRadius: getResponsiveIconSize(20),
      marginRight: getResponsiveWidth(12),
      backgroundColor: colors.surfaceMuted,
    },
    userName: {
      fontSize: rf(15),
      fontFamily: FONTS.REGULAR,
      color: colors.textPrimary,
    },
    selectIcon: {
      width: getResponsiveIconSize(14),
      height: getResponsiveIconSize(14),
      resizeMode: 'contain',
    },
    emptyText: {
      fontSize: rf(13),
      fontFamily: FONTS.REGULAR,
      color: colors.textTertiary,
      textAlign: 'center',
      paddingVertical: getResponsiveHeight(20),
    },
  }));

  const {chatRoomId, onInvited} = route.params || {};
  const familyId = useSelector(state => state.family?.familyId);
  const {data: familyUserList = [], isLoading: isFamilyUsersLoading} =
    useGetFamilyUsersQuery(familyId, {skip: !familyId});
  const [selected, setSelected] = useState([]);

  const {data: roomUsers = [], isLoading: roomUsersLoading} =
    useGetChatRoomUsersQuery(String(chatRoomId), {
      skip: !chatRoomId,
    });
  const [addUsersToChatRoom] = useAddUsersToChatRoomMutation();

  useHideTabBar({stayHidden: true});

  const selectableUsers = (familyUserList || []).filter(
    user =>
      !(roomUsers || []).find(
        u => String(u.userId) === String(user.userId),
      ),
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
    } catch (err) {}
  }, [addUsersToChatRoom, chatRoomId, navigation, onInvited, selected]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <AppText style={styles.headerTitle}>멤버</AppText>
      ),
      headerRight: () =>
        selected.length > 0 ? (
          <SpringPressable
            onPress={handleInvite}
            style={{marginRight: getResponsiveWidth(10)}}>
            <FastImage
              source={require('assets/icons/check.png')}
              style={[
                styles.headerCheckIcon,
                isDark && {tintColor: '#F9FAFB'},
              ]}
            />
          </SpringPressable>
        ) : null,
    });
  }, [navigation, styles, handleInvite, selected, isDark]);

  if (isFamilyUsersLoading || roomUsersLoading) {
    return (
      <View
        style={[
          styles.container,
          {justifyContent: 'center', alignItems: 'center'},
        ]}>
        <ActivityIndicator size="large" color="#F8B500" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={{flex: 1}}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: getResponsiveHeight(32)}}>

        {/* 현재 멤버 섹션 */}
        <AppText style={styles.sectionLabel}>
          현재 멤버 {roomUsers.length > 0 ? `${roomUsers.length}명` : ''}
        </AppText>
        <View style={styles.cardShadow}>
          <View style={styles.card}>
            {roomUsers.length === 0 ? (
              <AppText style={styles.emptyText}>멤버 정보를 불러오지 못했어요.</AppText>
            ) : (
              roomUsers.map((user, index) => (
                <View key={String(user.userId)}>
                  <View style={styles.userItem}>
                    <View style={styles.userInfo}>
                      <Image
                        source={{uri: user.image || user.profileImage}}
                        style={styles.userImage}
                      />
                      <AppText style={styles.userName}>
                        {user.name || user.nickname}
                      </AppText>
                    </View>
                  </View>
                  {index < roomUsers.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))
            )}
          </View>
        </View>

        {/* 초대하기 섹션 */}
        {selectableUsers.length > 0 && (
          <>
            <AppText style={styles.sectionLabel}>초대하기</AppText>
            <View style={styles.cardShadow}>
            <View style={styles.card}>
              {selectableUsers.map((user, index) => {
                const isSelected = selected.includes(user.userId);
                return (
                  <View key={String(user.userId)}>
                    <SpringPressable
                      onPress={() => toggleUser(user.userId)}
                      style={[
                        styles.userItem,
                        isSelected && styles.userItemSelected,
                      ]}>
                      <View style={styles.userInfo}>
                        <Image
                          source={{uri: user.image}}
                          style={styles.userImage}
                        />
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
                    </SpringPressable>
                  </View>
                );
              })}
            </View>
            </View>
          </>
        )}

      </ScrollView>
    </View>
  );
}
