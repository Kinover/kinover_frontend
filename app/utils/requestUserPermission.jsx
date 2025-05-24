import messaging from '@react-native-firebase/messaging';

export async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('알림 권한 허용됨');
    const token = await messaging().getToken();
    console.log('FCM Token:', token);

    // 🔸 백엔드로 토큰 전송 (JWT 포함)
    await fetch(`${API_BASE_URL}/api/fcm/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fcmToken: token }),
    });
  }
}


// useEffect(() => {
//     requestUserPermission();
//   }, []);