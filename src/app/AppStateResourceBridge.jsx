// 백그라운드 갔다 온 뒤에만 새로고침 (첫 콜드 스타트 active는 오토로그인·쿼리 초기 로딩에 맡김)
import {useEffect, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useAppStateBackground} from 'hooks/useAppStateBackground';
import {
  pauseForBackground,
  resumeFromBackground,
} from 'features/chat/hooks/ChatSocket';
import {fetchUserThunk} from 'features/home/store/userThunk';
import {
  fetchFamilyThunk,
  fetchFamilyStatusThunk,
} from 'features/home/store/familyThunk';
import {fetchFamilyUserListThunk} from 'features/home/store/familyUserThunk';
import {baseApi} from 'services/baseApi';

export function AppStateResourceBridge() {
  const dispatch = useDispatch();
  const userId = useSelector(s => s.user?.userId);
  const familyId = useSelector(
    s => s.family?.familyId ?? s.user?.familyId ?? s.user?.family?.familyId,
  );
  const isLogin = useSelector(s => !!s.login?.isLoggedIn);
  const sessionLeftForegroundRef = useRef(false);
  const pauseTimerRef = useRef(null);
  const PAUSE_GRACE_MS = 700; // 짧은 앱 이탈(알림창 확인 등) 시 불필요한 소켓 재연결을 방지하기 위한 유예 시간

  /**
   * [AppStateResourceBridge]
   * 앱의 활성화 상태(Foreground/Background)에 따른 리소스 최적화 및 데이터 동기화 관리
   *
   * 1. 백그라운드 전환 시: 700ms 유예 후 소켓 일시정지 (잦은 이탈 시 재연결 비용 절감)
   * 2. 포그라운드 복귀 시: 소켓 재개 및 주요 데이터(User, Family) 최신화, API 캐시 무효화
   * 3. 콜드 스타트 시의 중복 호출 방지를 위해 sessionLeftForegroundRef로 이력 추적
   */

  useAppStateBackground({
    // 백그라운드
    onBackground: () => {
      sessionLeftForegroundRef.current = true;
      // 유예 타이머 설정
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = setTimeout(() => {
        // 소켓 일시정지
        pauseForBackground();
        pauseTimerRef.current = null;
      }, PAUSE_GRACE_MS);
    },

    // 포그라운드
    onActive: () => {
      // 유예 타이머 정리
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
      // 소켓 재개
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
        // 캐시 무효화: 백그라운드 이탈 후 포그라운드 전환 시 최신 데이터 확보를 위해 캐시를 무효화
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
