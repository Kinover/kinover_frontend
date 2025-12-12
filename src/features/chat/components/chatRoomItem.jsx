import React from 'react';
import {TouchableOpacity, Text, View, StyleSheet} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import GroupAvatar from './groupAvatar';
import {useDispatch, useSelector} from 'react-redux';
import {markRoomRead} from '../store/chatRoomSlice';
import {getChatRoomTitle} from '../utils/chatRoomTitleHelper';

function ChatRoomItem({chatRoom, userId, navigation}) {
  const dispatch = useDispatch();
  const userImage = useSelector(state => state.user.image);

  // 🔹 가족 유저 리스트
  const familyUserList = useSelector(state => state.userFamily.familyUserList);

  const {
    chatRoomId,
    roomName,
    kino,
    latestMessageContent,
    latestMessageTime,
    memberImages,
    unreadCount = 0,
    userChatRooms, // 참여자 userId 목록
  } = chatRoom;

  const screen = kino ? '키노상담소화면' : '채팅방화면';

  // 🔹 util 함수로 타이틀 생성 (familyUserList 사용)
  const title = getChatRoomTitle(
    roomName,
    kino,
    userChatRooms,
    userId,
    familyUserList,
  );

  const description =
    latestMessageContent || '지금 첫 메시지를 보내 대화를 시작해보세요!';

  const onPress = () => {
    dispatch(markRoomRead(chatRoomId));
    navigation.navigate(screen, {chatRoom, title, userId});
  };
  console.log('userId:', userId);
  console.log('userChatRooms:', userChatRooms);
  console.log('familyUserList:', familyUserList);
  console.log('avatarImages:', memberImages);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.75}>
      <GroupAvatar images={memberImages} size={getResponsiveIconSize(55)} />

      <View style={styles.textArea}>
        <View style={styles.headerRow}>
          <Text
            style={[styles.name, unreadCount > 0 && styles.nameUnread]}
            numberOfLines={1}
            ellipsizeMode="tail">
            {title}
          </Text>
        </View>

        <Text
          style={[
            styles.description,
            unreadCount > 0 && styles.descriptionUnread,
          ]}
          numberOfLines={2}
          ellipsizeMode="tail">
          {description}
        </Text>
      </View>
      <View style={styles.metaCol}>
        <Text style={styles.time}>
          {latestMessageTime ? formatPreviewTime(latestMessageTime) : ''}
        </Text>

        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}

        {unreadCount == 0 && (
          <View style={[styles.badge, {backgroundColor: 'transparent'}]}>
            <Text style={styles.badgeText}>0</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default ChatRoomItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(13),
    paddingVertical: getResponsiveHeight(10),
    width: '100%',
    height: getResponsiveHeight(80),
  },
  textArea: {
    flex: 1,
    gap: getResponsiveHeight(4),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(15.5),
    color: '#101010',
    lineHeight: getResponsiveHeight(22),
    textAlignVertical: 'center',
  },
  nameUnread: {
    fontFamily: 'Pretendard-SemiBold',
  },
  metaCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: getResponsiveHeight(2),
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  time: {
    top: 0,
    fontSize: getResponsiveFontSize(11.5),
    color: '#8B8B8B',
    lineHeight: getResponsiveHeight(20),
    textAlignVertical: 'top',
  },
  description: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(12.5),
    color: '#5A5A5A',
    lineHeight: getResponsiveHeight(16),
    textAlignVertical: 'top',
    flexWrap: 'wrap',
  },
  descriptionUnread: {
    fontFamily: 'Pretendard-Medium',
    color: '#2A2A2A',
  },
  badge: {
    right: 0,
    padding: getResponsiveHeight(5),
    minWidth: getResponsiveWidth(23),
    borderRadius: 999,
    backgroundColor: '#FFC84D',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-SemiBold',
  },
});

function formatPreviewTime(time) {
  if (!time) return '';

  const date = new Date(time);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours < 12 ? '오전' : '오후';

    if (hours === 0) hours = 12;
    else if (hours > 12) hours -= 12;

    return `${ampm} ${hours}:${minutes}`;
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일`;
}
