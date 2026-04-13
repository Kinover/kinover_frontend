import {Alert} from 'react-native';
import {store} from 'store';
import {moderationApi} from '../services/moderationApi';
import {addBlockedUserId} from '../store/blockedUsersSlice';
import {addLocalBlockedUserId} from './blockedUsersStorage';

/**
 * 확인 없이 차단 API + 로컬·Redux 반영 (신고 후 연쇄 차단 등)
 * @param {string|number} userId
 */
export async function executeBlockFamilyUser(userId) {
  const n = Number(userId);
  if (!Number.isFinite(n)) {
    throw new Error('invalid userId');
  }
  const req = store.dispatch(moderationApi.endpoints.blockUser.initiate(n));
  await req.unwrap();
  req.unsubscribe?.();
  await addLocalBlockedUserId(n);
  store.dispatch(addBlockedUserId(n));
}

/**
 * 가족 구성원 차단: 확인 Alert → API → 로컬 목록 반영
 * @param {string|number} userId
 * @param {object} [options]
 * @param {string} [options.title]
 * @param {string} [options.message]
 * @param {string} [options.successTitle]
 * @param {string} [options.successMessage]
 * @param {() => void} [options.onSuccess]
 */
export function promptBlockFamilyUser(userId, options = {}) {
  const n = Number(userId);
  if (!Number.isFinite(n)) return;

  const {
    title = '차단',
    message = '이 가족 구성원을 차단할까요? 차단하면 상대의 글과 메시지가 일부 보이지 않을 수 있어요.',
    successTitle = '',
    successMessage = '차단했어요.',
    onSuccess,
  } = options;

  Alert.alert(title, message, [
    {text: '취소', style: 'cancel'},
    {
      text: '차단',
      style: 'destructive',
      onPress: () => {
        void (async () => {
          try {
            await executeBlockFamilyUser(n);
            Alert.alert(successTitle, successMessage);
            onSuccess?.();
          } catch {
            Alert.alert(
              '오류',
              '차단에 실패했어요. 잠시 후 다시 시도해 주세요.',
            );
          }
        })();
      },
    },
  ]);
}
