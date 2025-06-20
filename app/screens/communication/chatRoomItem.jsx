import React from 'react';
import {
  TouchableOpacity,
  Image,
  Text,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../utils/responsive';
import formatTime from '../../utils/formatTime';
import GroupAvatar from './groupAvatar';
import {useSelector} from 'react-redux';

export default function ChatRoomItem({chatRoom, userId, navigation}) {
  const imageUri = chatRoom.memberImages?.[0];
  let name = chatRoom.roomName;
  const description =
    chatRoom.latestMessageContent ||
    '지금 첫 메시지를 보내 대화를 시작해보세요!';
  const screen = chatRoom.kino ? '키노상담소화면' : '채팅방화면';
  const time = chatRoom.latestMessageTime;
  const userImage = useSelector(state => state.user.image);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate(screen, {chatRoom, userId})}>
      <GroupAvatar
        images={chatRoom.memberImages}
        size={getResponsiveIconSize(55)}
        userImage={userImage}
      />
      <View style={styles.textContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{chatRoom.kino ? '챗봇 키노' : name}</Text>
          <Text style={styles.time}>{formatTime(time) || ''}</Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(16),
    width: '100%',
    height: getResponsiveHeight(75),
    paddingHorizontal: getResponsiveWidth(6),
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    paddingLeft: getResponsiveWidth(14),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(6),
  },
  name: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(16.5),
  },
  time: {
    fontSize: getResponsiveFontSize(11),
    color: 'gray',
  },
  description: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(12),
    color: '#555',
    paddingRight: getResponsiveWidth(40),
  },
});
