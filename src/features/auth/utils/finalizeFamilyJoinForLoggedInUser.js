import mmkvStorage from 'utils/mmkvStorage';
import {emitAuthFlagsChanged} from 'utils/authFlagsEvent';
import {
  KEY_FIRST_ENTRY_AFTER_SETUP,
  KEY_GUIDE_ENTRY_TRIGGER,
  resetGuideShownKeys,
} from 'hooks/useGuide';
import {
  clearSignupOnboardingAux,
  setNeedsSignup,
  setHasFamily,
} from 'utils/storage';
import {fetchUserThunk} from 'features/home/store/userThunk';
import {
  fetchFamilyThunk,
  fetchFamilyStatusThunk,
} from 'features/home/store/familyThunk';
import {fetchFamilyUserListThunk} from 'features/home/store/familyUserThunk';
import {baseApi} from 'services/baseApi';

const sleep = ms => new Promise(res => setTimeout(res, ms));

const withTimeout = (promise, ms = 8000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms),
    ),
  ]);

async function syncUserAndFamilyToStore(store) {
  const userPayload = await withTimeout(
    store.dispatch(fetchUserThunk()).unwrap(),
    8000,
  );
  const familyId =
    userPayload?.familyId ?? userPayload?.family?.familyId ?? null;
  if (!familyId) {
    return;
  }

  const run = async thunkPromise => withTimeout(thunkPromise, 8000);

  try {
    await run(store.dispatch(fetchFamilyThunk(familyId)));
  } catch {
    null;
  }
  try {
    await run(store.dispatch(fetchFamilyUserListThunk(familyId)));
  } catch {
    null;
  }
  try {
    await run(store.dispatch(fetchFamilyStatusThunk(familyId)));
  } catch {
    null;
  }

  store.dispatch(baseApi.util.invalidateTags(['ChatRoom']));
}

/**
 * 설정완료 화면 없이 가족 참여/생성 직후 메인 앱·Redux 상태를 맞춘다.
 * (이미 로그인된 사용자가 탭 안에서 시트로만 가족에 합류할 때)
 *
 * @param {import('@reduxjs/toolkit').Store} store
 */
export async function finalizeFamilyJoinForLoggedInUser(store) {
  try {
    await clearSignupOnboardingAux();
  } catch {
    null;
  }
  try {
    await setNeedsSignup(false);
  } catch {
    null;
  }
  try {
    await mmkvStorage.setItem(KEY_FIRST_ENTRY_AFTER_SETUP, '1');
  } catch {
    null;
  }
  try {
    await setHasFamily(true);
  } catch {
    null;
  }
  try {
    await resetGuideShownKeys();
  } catch {
    null;
  }
  try {
    await mmkvStorage.setItem(KEY_GUIDE_ENTRY_TRIGGER, '1');
  } catch {
    null;
  }
  emitAuthFlagsChanged({hasFamily: true});

  // 탭 화면에서 RTK Query를 직접 구독 중인 경우(예: Home의 useGetUserQuery),
  // thunk로 forceRefetch를 때려도 캐시/구독 타이밍에 따라 화면이 늦게 갱신될 수 있다.
  // 합류/생성 직후에는 관련 태그를 invalidate 해서 "보이는 화면"을 확실히 최신화한다.
  try {
    store.dispatch(
      baseApi.util.invalidateTags(['User', 'Family', 'FamilyUser', 'FamilyStatus']),
    );
  } catch {
    null;
  }

  try {
    await syncUserAndFamilyToStore(store);
    await sleep(300);
    await syncUserAndFamilyToStore(store);
  } catch {
    null;
  }
}
