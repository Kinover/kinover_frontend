// store/readPointersThunk.js
import axios from 'axios';
import {getToken} from '../../../utils/storage';
import {setReadPointers} from './readPointersSlice';

export const fetchReadPointersThunk = chatRoomId => {
  return async dispatch => {
    const token = await getToken();
    const url = `https://kinover.shop/api/chatRoom/${chatRoomId}/readPointers`;

    const res = await axios.get(url, {
      headers: {Authorization: `Bearer ${token}`},
    });

    // 서버 응답: { chatRoomId, pointers: [{userId, lastReadAt}, ...] }
    dispatch(setReadPointers(res.data));
    return res.data;
  };
};

// REST 읽음 처리(방 들어왔을 때 한번 찍어두기)
export const markReadThunk = (chatRoomId, lastReadAt) => {
  return async () => {
    const token = await getToken();
    const url = `https://kinover.shop/api/chatRoom/${chatRoomId}/read`;

    await axios.post(
      url,
      {lastReadAt},
      {headers: {Authorization: `Bearer ${token}`}},
    );
  };
};
