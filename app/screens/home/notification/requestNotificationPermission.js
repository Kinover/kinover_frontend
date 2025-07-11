import {PermissionsAndroid, Platform} from 'react-native';
import {getApp} from 'firebase/app';

import {getMessaging, requestPermission} from 'firebase/messaging';

import axios from 'axios';
import {getToken} from '../../../utils/storage';
import {navigate} from '../../../navigation/navigationRef';

export async function requestNotificationPermission() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      {
        title: '알림 권한 요청',
        message: '알림을 보내기 위해 권한이 필요해요!',
        buttonPositive: '확인',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  if (Platform.OS === 'ios' && (await isSupported())) {
    try {
      const messaging = getMessaging(getApp());
      const status = await requestPermission(messaging);
      return status === 'granted' || status === 'provisional';
    } catch (err) {
      console.error('iOS 권한 요청 실패:', err);
      return false;
    }
  }

  return false;
}

const SERVER_URL = 'https://kinover.shop/api/fcm/register';

export async function getFcmTokenAndSend() {
  try {
    const fcmToken = await messaging().getToken();
    const accessToken = await getToken(); // 로그인한 유저의 JWT 토큰

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const body = {
      fcmToken: fcmToken,
    };

    const response = await axios.post(SERVER_URL, body, {headers});

    console.log('✅ FCM 토큰 서버 전송 성공:', response.data);
  } catch (error) {
    console.error(
      '❌ FCM 토큰 전송 실패:',
      error?.response?.data || error.message,
    );
  }
}

export function handleNotificationListeners() {
  // 앱이 열려 있을 때 (포그라운드)
  messaging().onMessage(async remoteMessage => {
    Alert.alert(
      remoteMessage.notification?.title || '알림',
      remoteMessage.notification?.body || '알림 내용 없음',
    );
  });

  // 앱이 백그라운드 상태에서 알림 누른 경우
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('알림 눌러서 앱 열림 (백그라운드)', remoteMessage);
    navigateToNotification();
  });

  // 앱이 꺼진 상태에서 알림 눌러서 실행된 경우
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('앱 종료 상태에서 알림 클릭으로 실행됨', remoteMessage);
        navigateToNotification();
      }
    });
}

function navigateToNotification() {
  navigate('Notification'); // 알림 상세 페이지로 이동!
}
