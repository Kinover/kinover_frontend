import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from '../../../utils/responsive';
import CustomSwitch from '../../../components/customSwitch';
import useHideTabBar from '../../../hooks/useHideTabBar';
import {useDispatch, useSelector} from 'react-redux';

import {toggleAllChatRoomNotificationThunk} from '../../../redux/thunk/chatRoomThunk';
import {toggleCommentNotificationThunk} from '../../../redux/thunk/commentThunk';
import {togglePostNotificationThunk} from '../../../redux/thunk/memoryThunk';

export default function NotificationSettingScreen() {
  const dispatch = useDispatch();
  const userId = useSelector(
    state => state.user.userId?.toString?.() || state.user.userId,
  );

  const [allNotification, setAllNotification] = useState(true);
  const [chatNotification, setChatNotification] = useState(true);
  const [postNotification, setPostNotification] = useState(true);
  const [commentNotification, setCommentNotification] = useState(true);

  useHideTabBar({stayHidden: true});

  // ✅ 전체 알림 토글 시
  const handleToggleAllNotification = async () => {
    const newValue = !allNotification;
    setAllNotification(newValue);
    setChatNotification(newValue);
    setPostNotification(newValue);
    setCommentNotification(newValue);

    if (!userId) {
      console.warn('⚠️ userId 없음 → 전체 알림 토글 취소');
      return;
    }

    try {
      // 서버에 전체 알림 API가 없다면 각각 호출
      await dispatch(toggleAllChatRoomNotificationThunk({userId, isOn: newValue}));
      await dispatch(togglePostNotificationThunk({userId, isOn: newValue}));
      await dispatch(toggleCommentNotificationThunk({userId, isOn: newValue}));
    } catch (e) {
      console.log('❌ 전체 알림 토글 실패:', e);
    }
  };

  const handleToggleChatNotification = async () => {
    const newValue = !chatNotification;
    setChatNotification(newValue);

    if (!userId) return;
    try {
      await dispatch(toggleAllChatRoomNotificationThunk({userId, isOn: newValue}));
    } catch (e) {
      console.log('❌ 채팅방 알림 토글 실패:', e);
    }
  };

  const handleTogglePostNotification = async () => {
    const newValue = !postNotification;
    setPostNotification(newValue);

    if (!userId) return;
    try {
      await dispatch(togglePostNotificationThunk({userId, isOn: newValue}));
    } catch (e) {
      console.log('❌ 게시물 알림 토글 실패:', e);
    }
  };

  const handleToggleCommentNotification = async () => {
    const newValue = !commentNotification;
    setCommentNotification(newValue);

    if (!userId) return;
    try {
      await dispatch(toggleCommentNotificationThunk({userId, isOn: newValue}));
    } catch (e) {
      console.log('❌ 댓글 알림 토글 실패:', e);
    }
  };

  // ✅ 하위 알림 상태에 따라 전체 알림 값 자동 업데이트
  useEffect(() => {
    if (chatNotification && postNotification && commentNotification) {
      setAllNotification(true);
    } else {
      setAllNotification(false);
    }
  }, [chatNotification, postNotification, commentNotification]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>알림</Text>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>전체 알림</Text>
          <CustomSwitch
            isEnabled={allNotification}
            toggleSwitch={handleToggleAllNotification}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>채팅방 알림</Text>
          <CustomSwitch
            isEnabled={chatNotification}
            toggleSwitch={handleToggleChatNotification}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>게시물 알림</Text>
          <CustomSwitch
            isEnabled={postNotification}
            toggleSwitch={handleTogglePostNotification}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>댓글 알림</Text>
          <CustomSwitch
            isEnabled={commentNotification}
            toggleSwitch={handleToggleCommentNotification}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: getResponsiveWidth(20),
    paddingTop: getResponsiveHeight(20),
    flex: 1,
  },
  header: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    marginBottom: getResponsiveHeight(25),
    color: '#000',
  },
  section: {
    borderBottomWidth: 0.5,
    borderColor: '#E5E5E5',
    paddingVertical: getResponsiveHeight(10),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(8),
  },
  label: {
    fontSize: getResponsiveFontSize(16),
    color: '#222',
  },
});
