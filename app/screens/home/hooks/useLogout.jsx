import * as KakaoLogin from '@react-native-seoul/kakao-login';
// import { removeToken, removeHasFamily } from '../utils/storage';
import {useNavigation} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import {resetAuthState} from '../redux/slices/authSlice';

import {deleteLoginInfo} from '../../../utils/storage';

export const useLogout = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const logout = async () => {
    try {
      await KakaoLogin.logout(); // ✅ 토큰 삭제
      deleteLoginInfo();
      //   await removeToken();
      //   //   await removeHasFamily();
      //   //   dispatch(resetAuthState());

      navigation.reset({
        index: 0,
        routes: [
            {
              name: 'Auth', // ← RootNavigator에 등록된 AuthNavigator의 이름
              state: {
                index: 0,
                routes: [{ name: '온보딩화면' }], // ← AuthStack 내부 스크린
              },
            },
          ],      });
    } catch (err) {
      console.log('❌ 로그아웃 실패:', err);
    }
  };

  return logout;
};
