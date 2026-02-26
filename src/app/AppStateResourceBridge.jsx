// 백그라운드 갔다 온 뒤에만 새로고침 (첫 진입은 오토로그인에서 이미 함)
import {useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useAppStateBackground} from 'hooks/useAppStateBackground';
import {pauseForBackground, resumeFromBackground} from 'features/chat/hooks/ChatSocket';
import {fetchUserThunk} from 'features/home/store/userThunk';
import {fetchFamilyThunk, fetchFamilyStatusThunk} from 'features/home/store/familyThunk';
import {fetchFamilyUserListThunk} from 'features/home/store/familyUserThunk';
import {fetchChatRoomListThunk} from 'features/chat/store/chatRoomThunk';

export function AppStateResourceBridge() {
  const dispatch = useDispatch();
  const userId = useSelector(s => s.user?.userId);
  const familyId = useSelector(s => s.family?.familyId ?? s.user?.familyId ?? s.user?.family?.familyId);
  const isLogin = useSelector(s => !!s.login?.isLoggedIn);
  const beenBackgroundRef = useRef(false);

  useAppStateBackground({
    onBackground: () => {
      beenBackgroundRef.current = true;
      pauseForBackground();
    },
    onActive: () => {
      resumeFromBackground();

      if (!beenBackgroundRef.current) return;

      if (!isLogin || !userId) return;

      dispatch(fetchUserThunk());

      if (familyId) {
        dispatch(fetchFamilyThunk(familyId));
        dispatch(fetchFamilyUserListThunk(familyId));
        dispatch(fetchFamilyStatusThunk(familyId));
        dispatch(fetchChatRoomListThunk(familyId, userId));
      }
    },
  });

  return null;
}
