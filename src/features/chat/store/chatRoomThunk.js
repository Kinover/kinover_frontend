// fetchChatRoomListThunk.js
import axios from 'axios';
import {createAsyncThunk} from '@reduxjs/toolkit';
import {getToken} from '../../../utils/storage';
import {
  setChatRoomList,
  setChatRoomUsers,
  setChatRoomLoading,
  setChatRoomError,
} from './chatRoomSlice';

export const fetchChatRoomListThunk = (familyId, userId) => {
  return async dispatch => {
    dispatch(setChatRoomLoading(true));
    try {
      const apiUrl = `https://kinover.shop/api/chatRoom/${familyId}/${userId}`;

      const token = await getToken();

      const response = await axios.post(
        apiUrl,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      dispatch(setChatRoomList(response.data));
      console.log('✅ 채팅방 목록 불러오기 성공:', response.data);
    } catch (error) {
      console.error('❌ 채팅방 목록 불러오기 실패:', error);
      dispatch(setChatRoomError(error.message));
    } finally {
      dispatch(setChatRoomLoading(false));
    }
  };
};

export const fetchChatRoomUsersThunk = chatRoomId => {
  return async dispatch => {
    dispatch(setChatRoomLoading(true));

    try {
      const token = await getToken();
      const apiUrl = `https://kinover.shop/api/chatRoom/${chatRoomId}/users/get`;

      const response = await axios.post(
        apiUrl,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      dispatch(setChatRoomUsers(response.data));
      console.log('✅ 채팅방 내 유저 조회 성공:', response.data);
    } catch (error) {
      console.error('❌ 채팅방 내 유저 조회 실패:', error);
      dispatch(setChatRoomError(error.message));
    } finally {
      dispatch(setChatRoomLoading(false));
    }
  };
};

export const leaveChatRoomThunk = createAsyncThunk(
  'chatRoom/leaveChatRoom',
  async (chatRoomId, {rejectWithValue}) => {
    try {
      const token = await getToken();

      const res = await fetch(
        `https://kinover.shop/api/chatRoom/${chatRoomId}/leave`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        // ❌ 에러 응답일 때만 간단히 reject
        return rejectWithValue(`서버 오류: ${res.status}`);
      }

      // ✅ 성공하면 그냥 chatRoomId 반환 (또는 true, 'success' 등)
      return chatRoomId;
    } catch (error) {
      return rejectWithValue(error.message || '알 수 없는 에러');
    }
  },
);

export const renameChatRoomThunk = createAsyncThunk(
  'chatRoom/renameChatRoom',
  async (
    {familyId, userId, chatRoomId, roomName},
    {rejectWithValue, dispatch},
  ) => {
    try {
      const token = await getToken();
      const response = await fetch(
        `https://kinover.shop/api/chatRoom/${chatRoomId}/rename?roomName=${encodeURIComponent(
          roomName,
        )}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        return rejectWithValue(`이름 변경 실패: ${response.status}`);
      }

      const data = await response.text();
      console.log('✅ 채팅방 이름 변경 성공:', data);

      // ✅ thunkAPI에서 dispatch 가져와서 사용
      dispatch(fetchChatRoomListThunk(familyId, userId));
      return data;
    } catch (err) {
      console.error('❌ 채팅방 이름 변경 중 에러:', err);
      return rejectWithValue(err.message || '알 수 없는 오류');
    }
  },
);

// 채팅방 생성 Thunk
export const createChatRoomThunk = createAsyncThunk(
  'chatRoom/create',
  async ({roomName, userIds}, {rejectWithValue}) => {
    try {
      console.log(
        `🟡 채팅방 생성 요청: roomName="${roomName}", userIds=${userIds}`,
      );
      const token = await getToken();
      const response = await axios.post(
        `https://kinover.shop/api/chatRoom/create/${encodeURIComponent(
          roomName,
        )}/${userIds}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log('🟢 채팅방 생성 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error(
        '🔴 채팅방 생성 실패:',
        error.response?.data || error.message,
      );
      return rejectWithValue(error.response?.data || '채팅방 생성 실패');
    }
  },
);

// ✅ 채팅방 성격(personality) 변경 Thunk
export const updateKinoPersonalityThunk = createAsyncThunk(
  'chatRoom/updatePersonality',
  async ({chatRoomId, personality}, {rejectWithValue}) => {
    try {
      const token = await getToken();

      const response = await axios.patch(
        `https://kinover.shop/api/chatRoom/${chatRoomId}/personality`,
        {personality},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('✅ [키노 성격 변경 성공]');
      console.log('📌 요청 채팅방 ID:', chatRoomId);
      console.log('🧠 변경된 성격:', personality);
      console.log('📦 응답 데이터:', response.data);

      return response.data;
    } catch (err) {
      const msg = err.response?.data || err.message || '알 수 없는 오류';

      console.error('❌ [키노 성격 변경 실패]');
      console.error('📌 요청 채팅방 ID:', chatRoomId);
      console.error('🧠 시도한 성격:', personality);
      console.error('⚠️ 에러 내용:', msg);

      return rejectWithValue(msg);
    }
  },
);

export const toggleChatRoomNotificationThunk = createAsyncThunk(
  'chatRoom/toggleNotification',
  async ({userId, chatRoomId, isOn}, {rejectWithValue}) => {
    try {
      const token = await getToken();

      const url = `https://kinover.shop/api/chatRoom/notification/chatroom?userId=${userId}&chatRoomId=${chatRoomId}&isOn=${isOn}`;

      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        return rejectWithValue(`알림 설정 실패: ${res.status}`);
      }

      console.log(`✅ 알림 ${isOn ? 'ON' : 'OFF'} 설정 완료 for ${chatRoomId}`);
      return {chatRoomId, isOn};
    } catch (err) {
      return rejectWithValue(err.message || '알 수 없는 에러');
    }
  },
);

// 🔄 유저 전체 채팅방 알림 ON/OFF 설정
export const toggleAllChatRoomNotificationThunk = createAsyncThunk(
  'chatRoom/toggleAllNotification',
  async ({userId, isOn}, {rejectWithValue}) => {
    try {
      const token = await getToken();
      const url = `https://kinover.shop/api/chatRoom/notification/user?userId=${userId}&isOn=${isOn}`;

      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        return rejectWithValue(`전체 채팅방 알림 설정 실패: ${res.status}`);
      }

      const result = await res.text(); // 서버 응답은 단순 문자열일 수도 있어!
      console.log(`✅ 전체 알림 ${isOn ? 'ON' : 'OFF'} 설정 완료`);
      return {userId, isOn};
    } catch (err) {
      return rejectWithValue(err.message || '알 수 없는 에러');
    }
  },
);
