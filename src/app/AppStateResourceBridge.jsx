// 백그라운드 갔다 온 뒤에만 새로고침 (첫 진입은 오토로그인에서 이미 함)
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
  const beenBackgroundRef = useRef(false);
  const pauseTimerRef = useRef(null);
  const PAUSE_GRACE_MS = 700;

  useAppStateBackground({
    onBackground: () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = setTimeout(() => {
        beenBackgroundRef.current = true;
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

      if (!beenBackgroundRef.current) return;

      if (!isLogin || !userId) return;

      dispatch(fetchUserThunk()).catch(e =>
        console.log('[AppStateResourceBridge] user refresh error:', e),
      );

      if (familyId) {
        dispatch(fetchFamilyThunk(familyId)).catch(e =>
          console.log('[AppStateResourceBridge] family refresh error:', e),
        );
        dispatch(fetchFamilyUserListThunk(familyId)).catch(e =>
          console.log('[AppStateResourceBridge] family users refresh error:', e),
        );
        dispatch(fetchFamilyStatusThunk(familyId)).catch(e =>
          console.log('[AppStateResourceBridge] family status refresh error:', e),
        );
        // RTK Query: ChatRoom 태그 무효화 → 활성 getChatRooms 쿼리 자동 refetch
        dispatch(baseApi.util.invalidateTags(['ChatRoom']));
      }
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
