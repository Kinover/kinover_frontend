// store/readPointersSlice.js
import {createSlice} from '@reduxjs/toolkit';

const toId = v => (v == null ? null : String(v));
const toIsoOrNull = v => {
  if (!v) return null;
  const t = new Date(v);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
};

const initialState = {
  // chatRoomId -> { userId: lastReadAtIso|null }
  byRoom: {},
};

const ensureRoom = (state, chatRoomId) => {
  const rid = toId(chatRoomId);
  if (!rid) return null;
  if (!state.byRoom[rid]) state.byRoom[rid] = {};
  return state.byRoom[rid];
};

const readPointersSlice = createSlice({
  name: 'readPointers',
  initialState,
  reducers: {
    // GET /readPointers 응답 반영
    setReadPointers(state, action) {
      const {chatRoomId, pointers} = action.payload || {};
      const rid = toId(chatRoomId);
      if (!rid) return;

      const room = ensureRoom(state, rid);
      if (!room) return;

      // reset 후 세팅(서버가 소스 오브 트루스)
      state.byRoom[rid] = {};
      const next = ensureRoom(state, rid);

      (Array.isArray(pointers) ? pointers : []).forEach(p => {
        const uid = toId(p?.userId);
        if (!uid) return;
        next[uid] = toIsoOrNull(p?.lastReadAt);
      });
    },

    // WS room:read 들어오면 특정 유저만 갱신
    upsertReadPointer(state, action) {
      const {chatRoomId, userId, lastReadAt} = action.payload || {};
      const rid = toId(chatRoomId);
      const uid = toId(userId);
      if (!rid || !uid) return;

      const room = ensureRoom(state, rid);
      if (!room) return;

      const incoming = toIsoOrNull(lastReadAt);
      if (!incoming) return;

      const cur = room[uid];
      if (!cur) {
        room[uid] = incoming;
        return;
      }

      // 역행 방지(max)
      const curT = new Date(cur).getTime();
      const inT = new Date(incoming).getTime();
      if (Number.isFinite(curT) && Number.isFinite(inT) && inT > curT) {
        room[uid] = incoming;
      }
    },

    clearReadPointers(state, action) {
      const rid = toId(action.payload);
      if (!rid) return;
      delete state.byRoom[rid];
    },
  },
});

export const {setReadPointers, upsertReadPointer, clearReadPointers} =
  readPointersSlice.actions;

export default readPointersSlice.reducer;

export const selectReadPointersMap = (state, chatRoomId) =>
  state.readPointers.byRoom[String(chatRoomId)] || {};
