// 백그라운드 갔다 온 뒤에만 새로고침 (첫 콜드 스타트 active는 오토로그인·쿼리 초기 로딩에 맡김)
import {useEffect, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useAppStateBackground} from 'hooks/useAppStateBackground';
import {pauseForBackground, resumeFromBackground} from 'features/chat/hooks/ChatSocket';
import {fetchUserThunk} from 'features/home/store/userThunk';
import {fetchFamilyThunk, fetchFamilyStatusThunk} from 'features/home/store/familyThunk';
import {fetchFamilyUserListThunk} from 'features/home/store/familyUserThunk';
import {baseApi} from 'services/baseApi';

export function AppStateResourceBridge() {
  const dispatch = useDispatch();
  const userId = useSelector(s => s.user?.userId);
  const familyId = useSelector(s => s.family?.familyId ?? s.user?.familyId ?? s.user?.family?.familyId);
  const isLogin = useSelector(s => !!s.login?.isLoggedIn);
  const sessionLeftForegroundRef = useRef(false);
  const pauseTimerRef = useRef(null);
  const PAUSE_GRACE_MS = 700;

  useAppStateBackground({
    onBackground: () => {
      sessionLeftForegroundRef.current = true;
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = setTimeout(() => {
        pauseForBackground();
        pauseTimerRef.current = null;
      }, PAUSE_GRACE_MS);
    },
    onActive: () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
      resumeFromBackground();

      if (!sessionLeftForegroundRef.current) return;

      if (!isLogin || !userId) return;

      dispatch(fetchUserThunk());

      const fid =
        typeof familyId === 'string' || typeof familyId === 'number'
          ? String(familyId).trim()
          : '';
      const hasFamilyId = fid.length > 0;

      if (hasFamilyId) {
        dispatch(fetchFamilyThunk(familyId));
        dispatch(fetchFamilyUserListThunk(familyId));
        dispatch(fetchFamilyStatusThunk(familyId));
      }

      dispatch(
        baseApi.util.invalidateTags([
          'ChatRoom',
          'Schedule',
          'ScheduleCount',
          'Memory',
          'Category',
          'Notification',
        ]),
      );
    },
  });

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
    };
  }, []);

  return null;
}
