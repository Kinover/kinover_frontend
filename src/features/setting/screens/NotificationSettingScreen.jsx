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
import {useSelector, useDispatch} from 'react-redux';
import {RenderHeaderBackButton} from 'app/navigation/helpers/tabHeaderHelpers';
import {setMarketingNotificationEnabled} from 'store/uiSlice';
import {
  useGetMarketingNotificationQuery,
  useToggleMarketingNotificationMutation,
} from 'features/home/services/homeApi';

import {useToggleAllChatRoomNotificationMutation} from 'features/chat/services/chatApi';
import {
  useToggleCommentNotificationMutation,
  useTogglePostNotificationMutation,
} from 'features/memory/services/memoryApi';

// 토스트 모달 import
import ToastModal from 'components/modal/ToastModal';
import {SETTING_STYLES, getHeaderStyles} from 'styles/style';

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
  marketingSubLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    fontFamily: SETTING_STYLES().labelFontFamily,
    marginTop: getResponsiveHeight(2),
    flexShrink: 1,
    paddingRight: getResponsiveWidth(12),
  },
  labelWrap: {
    flex: 1,
  },

  }));
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const userId = useSelector(
    state => state.user.userId?.toString?.() || state.user.userId,
  );
  const [toggleAllChatRoomNotification] = useToggleAllChatRoomNotificationMutation();
  const [togglePostNotification] = useTogglePostNotificationMutation();
  const [toggleCommentNotification] = useToggleCommentNotificationMutation();

  const marketingNotificationLocal = useSelector(
    state => state.ui.marketingNotificationEnabled ?? true,
  );
  const {data: marketingData} = useGetMarketingNotificationQuery(undefined, {
    skip: !userId,
  });
  const [toggleMarketingNotificationApi] = useToggleMarketingNotificationMutation();

  // 서버 값 우선, 없으면 로컬 Redux fallback
  const marketingNotificationEnabled =
    marketingData?.marketingNotificationEnabled ?? marketingNotificationLocal;

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
    const H = getHeaderStyles();
    navigation.setOptions({
      headerTitle: () => (
        <AppText
          allowFontScaling={false}
          style={{
            fontSize: H.defaultTitleFontSize,
            color: H.defaultTitleFontColor,
            fontFamily: H.defaultTitleFontFamily,
          }}>
          알림 설정
        </AppText>
      ),
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

  const handleToggleMarketingNotification = async () => {
    if (!userId) return;
    const newValue = !marketingNotificationEnabled;
    dispatch(setMarketingNotificationEnabled(newValue));
    try {
      const patchRes = await toggleMarketingNotificationApi({
        isOn: newValue,
      }).unwrap();
      const serverVal = patchRes?.marketingNotificationEnabled;
      if (typeof serverVal === 'boolean') {
        dispatch(setMarketingNotificationEnabled(serverVal));
      }
      setToastMessage(
        newValue ? '마케팅 알림 수신에 동의했어요' : '마케팅 알림 수신을 거부했어요',
      );
    } catch {
      dispatch(setMarketingNotificationEnabled(!newValue));
      setToastMessage('설정 변경에 실패했어요. 다시 시도해 주세요.');
    }
    setToastVisible(true);
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

        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.labelWrap}>
              <AppText allowFontScaling={false} style={styles.label}>
                마케팅 알림 수신 동의
              </AppText>
              <AppText allowFontScaling={false} style={styles.marketingSubLabel}>
                이벤트, 프로모션 등 마케팅 정보를 푸시 알림으로 받아요
              </AppText>
            </View>
            <CustomSwitch
              isEnabled={marketingNotificationEnabled}
              toggleSwitch={handleToggleMarketingNotification}
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

