import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { getResponsiveHeight } from '../utils/responsive';
import CustomSwitch from '../utils/customSwitch';

export default function NotificationSettingScreen() {
  const [allNotification, setAllNotification] = useState(true);
  const [chatNotification, setChatNotification] = useState(true);
  const [postNotification, setPostNotification] = useState(true);
  const [commentNotification, setCommentNotification] = useState(true);

  // ✅ 전체 알림 토글 시 하위 알림 동기화
  const handleToggleAllNotification = () => {
    const newValue = !allNotification;
    setAllNotification(newValue);
    setChatNotification(newValue);
    setPostNotification(newValue);
    setCommentNotification(newValue);
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
            toggleSwitch={() => setChatNotification(prev => !prev)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>게시물 알림</Text>
          <CustomSwitch
            isEnabled={postNotification}
            toggleSwitch={() => setPostNotification(prev => !prev)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>댓글 알림</Text>
          <CustomSwitch
            isEnabled={commentNotification}
            toggleSwitch={() => setCommentNotification(prev => !prev)}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    flex: 1,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 30,
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
    paddingVertical: 10,
  },
  label: {
    fontSize: 17,
    color: '#222',
  },
});
