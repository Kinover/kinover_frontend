// src/features/memory/store/commentThunk.js
// (파일명은 네 프로젝트에 맞춰 유지/변경하면 돼)

import {apiClient} from '../../../utils/apiClient';
import {
  setCommentList,
  setCommentLoading,
  setCommentError,
} from './commentSlice';

const BASE_URL = '/comments';

// ✅ 댓글 조회
export const fetchCommentsThunk = postId => {
  return async dispatch => {
    dispatch(setCommentLoading(true));
    console.log(`📨 댓글 목록 불러오기 요청: postId = ${postId}`);

    try {
      const res = await apiClient.get(`${BASE_URL}/${postId}`, {
        headers: {'Content-Type': 'application/json'},
      });

      dispatch(setCommentList(res.data));
      console.log('✅ 댓글 목록 조회 성공:', res.data);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '댓글 목록 조회 실패';

      console.error('❌ 댓글 목록 조회 실패:', msg);
      dispatch(setCommentError(msg));
    } finally {
      dispatch(setCommentLoading(false));
    }
  };
};

// ✅ 댓글 추가
export const createCommentThunk = commentData => {
  return async dispatch => {
    dispatch(setCommentLoading(true));
    console.log('📨 댓글 추가 요청:', commentData);

    try {
      await apiClient.post(BASE_URL, commentData, {
        headers: {'Content-Type': 'application/json'},
      });

      console.log('✅ 댓글 추가 성공');

      // 댓글 추가 후 목록 재조회
      dispatch(fetchCommentsThunk(commentData.postId));
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '댓글 추가 실패';

      console.error('❌ 댓글 추가 실패:', msg);
      dispatch(setCommentError(msg));
    } finally {
      dispatch(setCommentLoading(false));
    }
  };
};

// ✅ 댓글 삭제
export const deleteCommentThunk = (commentId, postId) => {
  return async dispatch => {
    dispatch(setCommentLoading(true));
    console.log(`🗑 댓글 삭제 요청: commentId = ${commentId}`);

    const id = String(commentId).trim();

    try {
      await apiClient.delete(`${BASE_URL}/${encodeURIComponent(id)}`);

      console.log('✅ 댓글 삭제 성공');

      // 삭제 후 목록 다시 조회
      dispatch(fetchCommentsThunk(postId));
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '댓글 삭제 실패';

      console.error('❌ 댓글 삭제 실패:', msg);
      dispatch(setCommentError(msg));
    } finally {
      dispatch(setCommentLoading(false));
    }
  };
};

// ✅ 댓글 알림 ON/OFF
export const toggleCommentNotificationThunk = ({userId, isOn}) => {
  return async dispatch => {
    try {
      console.log(`🔔 댓글 알림 설정 요청: userId=${userId}, isOn=${isOn}`);

      await apiClient.patch(`${BASE_URL}/notification/comment`, null, {
        headers: {'Content-Type': 'application/json'},
        params: {userId, isOn},
      });

      console.log('✅ 댓글 알림 설정 변경 성공');
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '댓글 알림 설정 변경 실패';

      console.error('❌ 댓글 알림 설정 변경 실패:', msg);
      dispatch(setCommentError(msg));
    }
  };
};
