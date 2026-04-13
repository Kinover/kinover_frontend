import {createSlice} from '@reduxjs/toolkit';
import {
  getLocalBlockedUserIdsSync,
  setLocalBlockedUserIds,
} from '../utils/blockedUsersStorage';

const initialState = {
  ids: [],
};

const blockedUsersSlice = createSlice({
  name: 'blockedUsers',
  initialState,
  reducers: {
    setBlockedUserIds(state, action) {
      const arr = Array.isArray(action.payload) ? action.payload : [];
      state.ids = [...new Set(arr.map(Number).filter(Number.isFinite))];
    },
    addBlockedUserId(state, action) {
      const n = Number(action.payload);
      if (!Number.isFinite(n)) return;
      if (!state.ids.includes(n)) state.ids.push(n);
    },
    removeBlockedUserId(state, action) {
      const n = Number(action.payload);
      if (!Number.isFinite(n)) return;
      state.ids = state.ids.filter(id => id !== n);
    },
  },
});

export const {setBlockedUserIds, addBlockedUserId, removeBlockedUserId} =
  blockedUsersSlice.actions;

export function hydrateBlockedUsersFromStorage() {
  return dispatch => {
    dispatch(setBlockedUserIds(getLocalBlockedUserIdsSync()));
  };
}

/** 서버 목록과 MMKV 낙관적 ID를 합쳐 Redux·저장소에 반영 */
export function mergeServerBlockedUserIdsIntoCache(serverIds) {
  return async dispatch => {
    const server = Array.isArray(serverIds) ? serverIds : [];
    const local = getLocalBlockedUserIdsSync();
    const merged = [
      ...new Set(
        [...server, ...local].map(Number).filter(Number.isFinite),
      ),
    ];
    try {
      await setLocalBlockedUserIds(merged);
    } catch {
      // MMKV 실패 시에도 Redux는 반영
    }
    dispatch(setBlockedUserIds(merged));
  };
}

export default blockedUsersSlice.reducer;
