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

  // ✅ 전체 알림 토글 시 하위 알림도 변경 + API 호출
  const handleToggleAllNotification = () => {
    const newValue = !allNotification;
    setAllNotification(newValue);
    setChatNotification(newValue);
    setPostNotification(newValue);
    setCommentNotification(newValue);
    // dispatch(toggleAllNotificationsThunk({userId, isOn: newValue}));

    // ✅ 각 알림 API 직접 호출
    dispatch(toggleAllChatRoomNotificationThunk({userId, isOn: newValue}));
    dispatch(togglePostNotificationThunk({userId, isOn: newValue}));
    dispatch(toggleCommentNotificationThunk({userId, isOn: newValue}));
  };

  const handleToggleChatNotification = () => {
    const newValue = !chatNotification;
    setChatNotification(newValue);
    dispatch(toggleAllChatRoomNotificationThunk({userId, isOn: newValue}));
  };

  const handleTogglePostNotification = () => {
    const newValue = !postNotification;
    setPostNotification(newValue);
    dispatch(togglePostNotificationThunk({userId, isOn: newValue}));
  };

  const handleToggleCommentNotification = () => {
    const newValue = !commentNotification;
    setCommentNotification(newValue);
    dispatch(toggleCommentNotificationThunk({userId, isOn: newValue}));
  };

  // ✅ 하위 알림이 하나라도 false면 전체 알림도 false
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
