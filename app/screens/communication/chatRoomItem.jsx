import React from 'react';
import {TouchableOpacity, Image, Text, View, StyleSheet} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../utils/responsive';
import formatTime from '../../utils/formatTime';
import GroupAvatar from './groupAvatar';

export default function ChatRoomItem({chatRoom, userId, navigation}) {
  let imageUri = chatRoom.memberImages[0];
  let name = chatRoom.roomName;
  let description =
    chatRoom.latestMessageContent ||
    `지금 첫 메시지를 보내고 대화를 열어보세요!`;
  let screen = '채팅방화면';
  let time = chatRoom.latestMessageTime || null;

  if (chatRoom.kino === true) {
    name = '챗봇 키노';
    screen = '키노상담소화면';
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate(screen, {chatRoom, userId})}>
      <GroupAvatar images={chatRoom.memberImages} size={60} />
      <View style={styles.textContainer}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: getResponsiveHeight(6),
          }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.time}>{formatTime(time) || null}</Text>
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
    gap: getResponsiveWidth(20),
  },
  image: {
    width: getResponsiveWidth(60),
    height: getResponsiveHeight(60),
    borderRadius: getResponsiveIconSize(30),
    resizeMode: 'cover',
  },
  textContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
  },
  name: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(16.5),
    fontWeight: Platform.OS === 'ios' ? undefined : 'bold',
  },
  description: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(12),
    color: '#555',
    flexWrap: 'wrap',
    paddingRight: getResponsiveWidth(55),
  },

  time: {
    fontSize: getResponsiveFontSize(11),
    color: 'gray',
  },
});
