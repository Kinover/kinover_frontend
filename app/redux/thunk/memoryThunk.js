import axios from 'axios';
import {getToken} from '../../utils/storage';
import {
  setMemoryList,
  setMemoryLoading,
  setMemoryError,
} from '../slices/memorySlice';

export const fetchMemoryThunk = (familyId, categoryId = null) => {
  return async dispatch => {
    dispatch(setMemoryLoading(true));
    console.log('📥 게시글 목록 요청 시작:', {familyId, categoryId});
    try {
      const token = await getToken();
      console.log('🔐 토큰 획득 성공:', token);

      let apiUrl = `http://43.200.47.242:9090/api/posts?familyId=${familyId}`;
      if (categoryId) {
        apiUrl += `&categoryId=${categoryId}`;
      } 

      console.log('🌐 GET 요청 URL:', apiUrl);

      const response = await axios.get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('✅ 게시글 목록 조회 성공:', response.data);
      dispatch(setMemoryList(response.data));
    } catch (error) {
      console.error('❌ 게시글 목록 조회 실패:', error);
      dispatch(setMemoryError(error.message));
    } finally {
      dispatch(setMemoryLoading(false));
      console.log('📤 게시글 요청 종료');
    }
  };
};

export const deletePostThunk = (postId, familyId) => {
  return async dispatch => {
    dispatch(setMemoryLoading(true));
    console.log('🗑️ 게시글 삭제 요청 시작:', {postId, familyId});
    try {
      const token = await getToken();
      console.log('🔐 토큰 획득 성공:', token);

      const apiUrl = `http://43.200.47.242:9090/api/posts/${postId}`;
      console.log('🌐 DELETE 요청 URL:', apiUrl);

      const response = await axios.delete(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('✅ 게시글 삭제 성공:', response.status);

      // 삭제 후 다시 게시글 목록 요청
      dispatch(fetchMemoryThunk(familyId));
    } catch (error) {
      console.error('❌ 게시글 삭제 실패:', error);
      dispatch(setMemoryError(error.message));
    } finally {
      dispatch(setMemoryLoading(false));
      console.log('📤 게시글 삭제 요청 종료');
    }
  };
};

// 📁 memoryThunk.js

export const deletePostImageThunk = (postId, imageUrlToDelete, familyId) => {
  return async dispatch => {
    dispatch(setMemoryLoading(true));
    console.log('🗑️ 게시글 이미지 삭제 요청 시작:', {postId, imageUrlToDelete});
    try {
      const token = await getToken();
      console.log('🔐 토큰 획득 성공:', token);

      const apiUrl = `http://43.200.47.242:9090/api/posts/${postId}/image`;
      console.log('🌐 DELETE 요청 URL:', apiUrl);

      const response = await axios.delete(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        data: {
          imageUrl: imageUrlToDelete, // ✅ 실제 삭제할 이미지 URL 또는 파일명
        },
      });

      console.log('✅ 이미지 삭제 성공:', response.status);

      // 삭제 후 다시 게시글 목록 요청
      dispatch(fetchMemoryThunk(familyId));
    } catch (error) {
      console.error('❌ 게시글 이미지 삭제 실패:', error);
      dispatch(setMemoryError(error.message));
    } finally {
      dispatch(setMemoryLoading(false));
      console.log('📤 이미지 삭제 요청 종료');
    }
  };
};
