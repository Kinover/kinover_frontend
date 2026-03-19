// ChatRoomItem.jsx
import React from 'react';
import {Pressable, View, StyleSheet, Image} from 'react-native';
import AppText from 'components/AppText';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from 'utils/responsive';
import GroupAvatar from './groupAvatar';

// 기존 JSX의 <Text />를 접근성 정책 포함 AppText로 통일
const Text = AppText;

const KINO_AVATAR_SOURCE = require('../../../assets/images/kino-yellow.png');
import {useDispatch, useSelector} from 'react-redux';
import {markRoomRead} from '../store/chatRoomSlice';
import {getChatRoomTitle} from '../utils/chatRoomTitleHelper';

function ChatRoomItem({chatRoom, userId, navigation}) {
  const dispatch = useDispatch();
  const familyUserList = useSelector(state => state.userFamily.familyUserList);

  const {
    chatRoomId,
    roomName,
    kino,
    latestMessageContent,
    latestMessageTime,
    memberImages,
    unreadCount = 0,
    userChatRooms,
  } = chatRoom;

  const screen = kino ? '키노상담소화면' : '채팅방화면';

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
 // UX: 눌렀을 때 즉시 뱃지 0 (서버 read는 "채팅방 화면"에서 확실히 처리)
    dispatch(markRoomRead(chatRoomId));

    navigation.navigate(screen, {chatRoom, title, userId});
  };

  const AVATAR_SIZE = getResponsiveIconSize(50);
  const AI_BADGE_SIZE = getResponsiveIconSize(16);

  return (
    <Pressable
      onPress={onPress}
      android_ripple={null}
      style={styles.pressable}
      accessibilityLabel={`${title || '채팅방'}${unreadCount > 0 ? `. 읽지 않은 메시지 ${unreadCount}개` : ''}`}
      accessibilityRole="button">
      {({pressed}) => (
        <View style={styles.container}>
          {pressed && <View style={styles.pressOverlay} />}

          <View
            style={[
              styles.avatarWrap,
              {width: AVATAR_SIZE, height: AVATAR_SIZE},
            ]}>
            {kino && (!memberImages || memberImages.length === 0) ? (
              <View style={styles.kinoAvatarWrap}>
                <Image
                  source={KINO_AVATAR_SOURCE}
                  style={[
                    styles.kinoAvatar,
                    {
                      width: AVATAR_SIZE * 0.6,
                      height: AVATAR_SIZE * 0.6,
                    },
                  ]}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <GroupAvatar images={memberImages} size={AVATAR_SIZE} />
            )}

            {kino && (
              <View
                style={[
                  styles.aiBadge,
                  {width: AI_BADGE_SIZE, height: AI_BADGE_SIZE},
                ]}>
                <Text style={styles.aiBadgeText}>
                  AI
                </Text>
              </View>
            )}
          </View>

          <View style={styles.textArea}>
            <Text
              style={[styles.name, unreadCount > 0 && styles.nameUnread]}
              numberOfLines={1}>
              {title}
            </Text>

            <Text
              style={[
                styles.description,
                unreadCount > 0 && styles.descriptionUnread,
              ]}
              numberOfLines={2}>
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
          </View>
        </View>
      )}
    </Pressable>
  );
}

export default ChatRoomItem;

const styles = StyleSheet.create({
  pressable: {width: '100%'},
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(13),
    height: getResponsiveHeight(70),
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  pressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.045)',
  },
  avatarWrap: {position: 'relative'},
  kinoAvatarWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kinoAvatar: {},
  aiBadge: {
    position: 'absolute',
    top: -getResponsiveHeight(1.5),
    right: -getResponsiveWidth(1.5),
    borderRadius: 999,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-Bold',
    includeFontPadding: false,
  },
  textArea: {flex: 1, gap: getResponsiveHeight(1)},
  name: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(15),
    lineHeight: getResponsiveFontSize(16),
    color: '#101010',
  },
  nameUnread: {fontFamily: 'Pretendard-SemiBold'},
  description: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(12),
    color: '#5A5A5A',
  },
  descriptionUnread: {fontFamily: 'Pretendard-Medium', color: '#2A2A2A'},
  metaCol: {
    height: '80%',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  time: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(11),
    color: '#8B8B8B',
  },
  badge: {
    marginTop: getResponsiveHeight(3.5),
    padding: getResponsiveHeight(4),
    width: getResponsiveWidth(23),

    borderRadius: 999,
    backgroundColor: '#FFC84D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(11.5),
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

  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}
