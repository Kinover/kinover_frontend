// NotificationSettingScreen.js
import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';
import CustomSwitch from '../../../components/CustomSwitch';
import useHideTabBar from '../../../hooks/useHideTabBar';
import {useDispatch, useSelector} from 'react-redux';

import {toggleAllChatRoomNotificationThunk} from '../../chat/store/chatRoomThunk';
import {toggleCommentNotificationThunk} from '../../memory/store/commentThunk';
import {togglePostNotificationThunk} from '../../memory/store/memoryThunk';

// ✅ 토스트 모달 import
import ToastModal from '../../../components/ToastModal';
import {SETTING_STYLES} from 'styles/style';

export default function NotificationSettingScreen() {
  const dispatch = useDispatch();
  const userId = useSelector(
    state => state.user.userId?.toString?.() || state.user.userId,
  );

  const [allNotification, setAllNotification] = useState(true);
  const [chatNotification, setChatNotification] = useState(true);
  const [postNotification, setPostNotification] = useState(true);
  const [commentNotification, setCommentNotification] = useState(true);

  // ✅ 토스트 상태
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useHideTabBar({stayHidden: true});

  // ✅ 전체 알림 토글
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
      await dispatch(
        toggleAllChatRoomNotificationThunk({userId, isOn: newValue}),
      );
      await dispatch(togglePostNotificationThunk({userId, isOn: newValue}));
      await dispatch(toggleCommentNotificationThunk({userId, isOn: newValue}));

      // ✅ 성공 시 토스트
      setToastMessage(
        newValue ? '전체 알림이 켜졌어요' : '전체 알림이 꺼졌어요',
      );
      setToastVisible(true);
    } catch (e) {
      console.log('❌ 전체 알림 토글 실패:', e);
      // 필요하면 실패 토스트도 추가 가능
    }
  };

  const handleToggleChatNotification = async () => {
    const newValue = !chatNotification;
    setChatNotification(newValue);

    if (!userId) return;
    try {
      await dispatch(
        toggleAllChatRoomNotificationThunk({userId, isOn: newValue}),
      );

      setToastMessage(
        newValue ? '채팅방 알림이 켜졌어요' : '채팅방 알림이 꺼졌어요',
      );
      setToastVisible(true);
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

      setToastMessage(
        newValue ? '게시물 알림이 켜졌어요' : '게시물 알림이 꺼졌어요',
      );
      setToastVisible(true);
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

      setToastMessage(
        newValue ? '댓글 알림이 켜졌어요' : '댓글 알림이 꺼졌어요',
      );
      setToastVisible(true);
    } catch (e) {
      console.log('❌ 댓글 알림 토글 실패:', e);
    }
  };

  // ✅ 하위 알림 상태 → 전체 알림 동기화
  useEffect(() => {
    if (chatNotification && postNotification && commentNotification) {
      setAllNotification(true);
    } else {
      setAllNotification(false);
    }
  }, [chatNotification, postNotification, commentNotification]);

  return (
    <>
      <ScrollView style={styles.container}>
        <Text allowFontScaling={false} style={styles.header}>알림</Text>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text allowFontScaling={false} style={styles.label}>전체 알림</Text>
            <CustomSwitch
              isEnabled={allNotification}
              toggleSwitch={handleToggleAllNotification}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text allowFontScaling={false} style={styles.label}>채팅방 알림</Text>
            <CustomSwitch
              isEnabled={chatNotification}
              toggleSwitch={handleToggleChatNotification}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text allowFontScaling={false} style={styles.label}>게시물 알림</Text>
            <CustomSwitch
              isEnabled={postNotification}
              toggleSwitch={handleTogglePostNotification}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text allowFontScaling={false} style={styles.label}>댓글 알림</Text>
            <CustomSwitch
              isEnabled={commentNotification}
              toggleSwitch={handleToggleCommentNotification}
            />
          </View>
        </View>
      </ScrollView>

      {/* ✅ 토스트 모달 */}
      <ToastModal
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
        message={toastMessage}
        // 여긴 일반 화면이라 useNativeModal 안 넘겨도 됨 (기본 true)
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: getResponsiveWidth(18),
    paddingTop: getResponsiveHeight(16),
    flex: 1,
  },
  header: {
    fontSize: SETTING_STYLES().titleFontSize,
    fontWeight: SETTING_STYLES().titleFontWeight,
    marginBottom: getResponsiveHeight(20), // 🔽 30 → 20
    color: SETTING_STYLES().titleFontColor,
    fontFamily: SETTING_STYLES().titleFontFamily,
  },
  section: {
    borderBottomWidth: 0.5,
    borderColor: '#E5E5E5',
    paddingVertical: getResponsiveHeight(6),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(8),
  },
  label: {
    fontSize: SETTING_STYLES().labelFontSize,
    color: SETTING_STYLES().labelFontColor,
    fontFamily: SETTING_STYLES().labelFontFamily,
  },
});
