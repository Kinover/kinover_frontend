// NotificationSettingScreen.js
import React, {useState, useEffect, useLayoutEffect} from 'react';
import {View, ScrollView} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
import CustomSwitch from 'components/customSwitch';
import useHideTabBar from 'hooks/useHideTabBar';
import {useSelector} from 'react-redux';
import {RenderHeaderBackButton} from 'app/navigation/helpers/tabHeaderHelpers';

import {useToggleAllChatRoomNotificationMutation} from 'features/chat/services/chatApi';
import {
  useToggleCommentNotificationMutation,
  useTogglePostNotificationMutation,
} from 'features/memory/services/memoryApi';

// 토스트 모달 import
import ToastModal from 'components/modal/ToastModal';
import {SETTING_STYLES} from 'styles/style';

export default function NotificationSettingScreen() {
  const styles = useScaledStyleSheet(() => ({

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

  }));
  const navigation = useNavigation();
  const route = useRoute();
  const userId = useSelector(
    state => state.user.userId?.toString?.() || state.user.userId,
  );
  const [toggleAllChatRoomNotification] = useToggleAllChatRoomNotificationMutation();
  const [togglePostNotification] = useTogglePostNotificationMutation();
  const [toggleCommentNotification] = useToggleCommentNotificationMutation();

  const [allNotification, setAllNotification] = useState(true);
  const [chatNotification, setChatNotification] = useState(true);
  const [postNotification, setPostNotification] = useState(true);
  const [commentNotification, setCommentNotification] = useState(true);

 // 토스트 상태
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useHideTabBar({stayHidden: true});

 // 알림설정화면 뒤로가기 → 한 단계 pop (설정화면으로, 슬라이드 애니메이션)
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <RenderHeaderBackButton
          navigation={navigation}
          route={route}
          onBackPressOverride={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('설정화면');
            }
          }}
        />
      ),
    });
  }, [navigation, route]);

 // 전체 알림 토글
  const handleToggleAllNotification = async () => {
    const newValue = !allNotification;
    setAllNotification(newValue);
    setChatNotification(newValue);
    setPostNotification(newValue);
    setCommentNotification(newValue);

    if (!userId) {
      return;
    }

    try {
      await toggleAllChatRoomNotification({userId, isOn: newValue}).unwrap();
      await togglePostNotification({userId, isOn: newValue}).unwrap();
      await toggleCommentNotification({userId, isOn: newValue}).unwrap();

 // 성공 시 토스트
      setToastMessage(
        newValue ? '전체 알림이 켜졌어요' : '전체 알림이 꺼졌어요',
      );
      setToastVisible(true);
    } catch (e) {
    }
  };

  const handleToggleChatNotification = async () => {
    const newValue = !chatNotification;
    setChatNotification(newValue);

    if (!userId) return;
    try {
      await toggleAllChatRoomNotification({userId, isOn: newValue}).unwrap();

      setToastMessage(
        newValue ? '채팅방 알림이 켜졌어요' : '채팅방 알림이 꺼졌어요',
      );
      setToastVisible(true);
    } catch (e) {
    }
  };

  const handleTogglePostNotification = async () => {
    const newValue = !postNotification;
    setPostNotification(newValue);

    if (!userId) return;
    try {
      await togglePostNotification({userId, isOn: newValue}).unwrap();

      setToastMessage(
        newValue ? '게시물 알림이 켜졌어요' : '게시물 알림이 꺼졌어요',
      );
      setToastVisible(true);
    } catch (e) {
    }
  };

  const handleToggleCommentNotification = async () => {
    const newValue = !commentNotification;
    setCommentNotification(newValue);

    if (!userId) return;
    try {
      await toggleCommentNotification({userId, isOn: newValue}).unwrap();

      setToastMessage(
        newValue ? '댓글 알림이 켜졌어요' : '댓글 알림이 꺼졌어요',
      );
      setToastVisible(true);
    } catch (e) {
    }
  };

 // 하위 알림 상태 → 전체 알림 동기화
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
        <AppText allowFontScaling={false} style={styles.header}>알림</AppText>

        <View style={styles.section}>
          <View style={styles.row}>
            <AppText allowFontScaling={false} style={styles.label}>전체 알림</AppText>
            <CustomSwitch
              isEnabled={allNotification}
              toggleSwitch={handleToggleAllNotification}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <AppText allowFontScaling={false} style={styles.label}>채팅방 알림</AppText>
            <CustomSwitch
              isEnabled={chatNotification}
              toggleSwitch={handleToggleChatNotification}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <AppText allowFontScaling={false} style={styles.label}>게시물 알림</AppText>
            <CustomSwitch
              isEnabled={postNotification}
              toggleSwitch={handleTogglePostNotification}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <AppText allowFontScaling={false} style={styles.label}>댓글 알림</AppText>
            <CustomSwitch
              isEnabled={commentNotification}
              toggleSwitch={handleToggleCommentNotification}
            />
          </View>
        </View>
      </ScrollView>

      {/* 토스트 모달 */}
      <ToastModal
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
        message={toastMessage}
 // 여긴 일반 화면이라 useNativeModal 안 넘겨도 됨 (기본 true)
      />
    </>
  );
}

