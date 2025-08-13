import axios from 'axios';
import { getToken } from '../../utils/storage';
import {
  setCommentList,
  setCommentLoading,
  setCommentError,
} from '../slices/commentSlice';

const BASE_URL = 'https://kinover.shop/api/comments';

// ✅ 댓글 조회
export const fetchCommentsThunk = (postId) => {
  return async (dispatch) => {
    dispatch(setCommentLoading(true));
    console.log(`📨 댓글 목록 불러오기 요청: postId = ${postId}`);
    try {
      const token = await getToken();
      const response = await axios.get(`${BASE_URL}/${postId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      dispatch(setCommentList(response.data));
      console.log('✅ 댓글 목록 조회 성공:', response.data);
    } catch (error) {
      console.error('❌ 댓글 목록 조회 실패:', error.message);
      dispatch(setCommentError(error.message));
    } finally {
      dispatch(setCommentLoading(false));
    }
  };
};

// ✅ 댓글 추가
export const createCommentThunk = (commentData) => {
  return async (dispatch) => {
    dispatch(setCommentLoading(true));
    console.log('📨 댓글 추가 요청:', commentData);
    try {
      const token = await getToken();
      await axios.post(BASE_URL, commentData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('✅ 댓글 추가 성공');

      // 댓글 추가 후 목록 재조회
      dispatch(fetchCommentsThunk(commentData.postId));
    } catch (error) {
      console.error('❌ 댓글 추가 실패:', error.message);
      dispatch(setCommentError(error.message));
    } finally {
      dispatch(setCommentLoading(false));
    }
  };
};

// ✅ 댓글 삭제
export const deleteCommentThunk = (commentId, postId) => {
  return async (dispatch) => {
    dispatch(setCommentLoading(true));
    console.log(`🗑 댓글 삭제 요청: commentId = ${commentId}`);
    try {
      const token = await getToken();
      await axios.delete(`${BASE_URL}/${commentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('✅ 댓글 삭제 성공');

      // 삭제 후 목록 다시 조회
      dispatch(fetchCommentsThunk(postId));
    } catch (error) {
      console.error('❌ 댓글 삭제 실패:', error.message);
      dispatch(setCommentError(error.message));
    } finally {
      dispatch(setCommentLoading(false));
    }
  };
};

// ✅ 댓글 알림 ON/OFF
export const toggleCommentNotificationThunk = ({userId, isOn}) => {
  return async dispatch => {
    try {
      const token = await getToken();
      console.log(
        `🔔 댓글 알림 설정 요청: userId=${userId}, isOn=${isOn}`,
      );

      await axios.patch(
        `${BASE_URL}/notification/comment`,
        null,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          params: {
            userId,
            isOn,
          },
        },
      );

      console.log('✅ 댓글 알림 설정 변경 성공');
    } catch (error) {
      console.error('❌ 댓글 알림 설정 변경 실패:', error.message);
      dispatch(setCommentError(error.message));
    }
  };
};
