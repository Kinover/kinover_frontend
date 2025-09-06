import React, {memo, useMemo} from 'react';
import {TouchableOpacity, Text, View, StyleSheet} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../utils/responsive';
// import formatTime from '../../utils/formatTime';
import GroupAvatar from './groupAvatar';
import {useDispatch, useSelector} from 'react-redux';
import {markRoomRead} from '../../redux/slices/chatRoomSlice';

function ChatRoomItem({chatRoom, userId, navigation}) {
  const dispatch = useDispatch();
  const userImage = useSelector(state => state.user.image);

  const {
    chatRoomId,
    roomName,
    kino,
    latestMessageContent,
    latestMessageTime,
    unreadCount = 0,
    memberImages,
  } = chatRoom;

  const screen = kino ? '키노상담소화면' : '채팅방화면';
  const title = kino ? '챗봇 키노' : roomName || '이름 없는 채팅방';

  const description =
    latestMessageContent || '지금 첫 메시지를 보내 대화를 시작해보세요!';

  const onPress = () => {
    dispatch(markRoomRead(chatRoomId));
    navigation.navigate(screen, {chatRoom, userId});
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.75}>
      <GroupAvatar
        images={memberImages}
        size={getResponsiveIconSize(55)}
        userImage={userImage}
      />

      <View style={styles.textArea}>
        {/* 상단 헤더: 이름 / 우측 정보(시간, 뱃지) */}
        <View style={styles.headerRow}>
          <Text
            style={[styles.name, unreadCount > 0 && styles.nameUnread]}
            numberOfLines={1}
            ellipsizeMode="tail">
            {title}
          </Text>

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
          </View>
        </View>

        {/* 최근 메시지 프리뷰 */}
        <Text
          style={[
            styles.description,
            unreadCount > 0 && styles.descriptionUnread,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail">
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
export default ChatRoomItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(15),
    paddingHorizontal: getResponsiveWidth(2),
    paddingVertical: getResponsiveHeight(10),
    width: '100%',
    height: getResponsiveHeight(80),
  },
  textArea: {
    flex: 1,
    gap: getResponsiveHeight(6),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(16),
    color: '#101010',
    lineHeight: getResponsiveHeight(25),
    textAlignVertical: 'center',
  },
  nameUnread: {
    fontFamily: 'Pretendard-SemiBold',
  },
  metaCol: {
    marginLeft: getResponsiveWidth(10),
    alignItems: 'flex-end',
    minWidth: getResponsiveWidth(52),
    gap: getResponsiveHeight(4),
  },
  time: {
    fontSize: getResponsiveFontSize(11),
    color: '#8B8B8B',
    lineHeight: getResponsiveHeight(20),
    textAlignVertical: 'top',
  },
  description: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(12.5),
    color: '#5A5A5A',
    lineHeight: getResponsiveHeight(18),
    textAlignVertical:'top',
    paddingRight: getResponsiveWidth(25),
  },
  descriptionUnread: {
    fontFamily: 'Pretendard-Medium',
    color: '#2A2A2A',
  },
  badge: {
    position: 'absolute',
    top: getResponsiveHeight(22.5),
    minWidth: getResponsiveWidth(20),
    height: getResponsiveWidth(20),
    paddingHorizontal: getResponsiveWidth(6),
    borderRadius: getResponsiveHeight(10),
    backgroundColor: '#FFC84D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(10),
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
    // ✅ 오늘이면 → "오전 9:27" / "오후 3:05"
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours < 12 ? '오전' : '오후';

    if (hours === 0) hours = 12; // 자정
    else if (hours > 12) hours -= 12; // 오후 시간 보정

    return `${ampm} ${hours}:${minutes}`;
  }

  // ✅ 오늘이 아니면 → "8월 28일"
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일`;
}
