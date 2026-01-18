// store/readPointersThunk.js

import {apiClient} from '../../../utils/apiClient';
import {setReadPointers} from './readPointersSlice';

export const fetchReadPointersThunk = chatRoomId => {
  return async dispatch => {
    try {
      const res = await apiClient.get(`/chatRoom/${chatRoomId}/readPointers`);

      // 서버 응답: { chatRoomId, pointers: [{userId, lastReadAt}, ...] }
      dispatch(setReadPointers(res.data));
      return res.data;
    } catch (e) {
      // 401은 apiClient가 공통 처리(로그아웃+reset)하니까 여기선 최소 방어만
      const msg = e?.response?.data || e?.message || 'readPointers 조회 실패';
      // slice에 에러 저장 로직이 없어서 일단 throw/return 선택지인데,
      // 기존 패턴 유지하려고 return null로 두는 게 덜 터짐.
      return {error: msg};
    }
  };
};

// REST 읽음 처리(방 들어왔을 때 한번 찍어두기)
export const markReadThunk = (chatRoomId, lastReadAt) => {
  return async () => {
    try {
      await apiClient.post(`/chatRoom/${chatRoomId}/read`, {lastReadAt});
      return true;
    } catch (e) {
      const msg = e?.response?.data || e?.message || 'read 저장 실패';
      return {error: msg};
    }
  };
};
