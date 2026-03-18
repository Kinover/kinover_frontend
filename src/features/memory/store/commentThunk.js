// src/features/memory/store/commentThunk.js
// 댓글 조회·추가: /posts/:postId/comments (서버에서 많이 쓰는 형태)
// 댓글 삭제: /comments/:commentId

import {apiClient} from 'utils/apiClient';
import {POSTS, COMMENTS} from 'config/apiEndpoints';
import {
  setCommentList,
  setCommentLoading,
  setCommentError,
} from './commentSlice';

// 댓글 조회 (게시글별)
export const fetchCommentsThunk = postId => {
  return async dispatch => {
    dispatch(setCommentLoading(true));
    const url = POSTS.comments(postId);
    console.log('📨 댓글 목록 불러오기 요청:', url);

    try {
      const res = await apiClient.get(url, {
        headers: {'Content-Type': 'application/json'},
      });

      const data = Array.isArray(res?.data) ? res.data : res?.data?.data ?? [];
      dispatch(setCommentList(data));
      console.log('✅ 댓글 목록 조회 성공');
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

// 댓글 추가 (POST /posts/:postId/comments, body: { content } 또는 { content, authorId })
export const createCommentThunk = commentData => {
  return async dispatch => {
    const postId = commentData?.postId;
    if (!postId) {
      console.error('❌ 댓글 추가: postId 없음');
      return;
    }

    dispatch(setCommentLoading(true));
    const url = POSTS.comments(postId);
    const body = {
      content: String(commentData?.content ?? '').trim(),
      ...(commentData?.authorId != null && {authorId: commentData.authorId}),
      ...(commentData?.mentionUserIds?.length && {
        mentionUserIds: commentData.mentionUserIds,
      }),
    };
    console.log('📨 댓글 추가 요청:', url, body);

    try {
      await apiClient.post(url, body, {
        headers: {'Content-Type': 'application/json'},
      });

      console.log('✅ 댓글 추가 성공');
      dispatch(fetchCommentsThunk(postId));
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

// 댓글 삭제
export const deleteCommentThunk = (commentId, postId) => {
  return async dispatch => {
    dispatch(setCommentLoading(true));
    const id = String(commentId).trim();
    const url = COMMENTS.delete(id);
    console.log('🗑 댓글 삭제 요청:', url);

    try {
      await apiClient.delete(url);

      console.log('✅ 댓글 삭제 성공');
      if (postId) dispatch(fetchCommentsThunk(postId));
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

// 댓글 알림 ON/OFF
export const toggleCommentNotificationThunk = ({userId, isOn}) => {
  return async dispatch => {
    try {
      console.log(`🔔 댓글 알림 설정 요청: userId=${userId}, isOn=${isOn}`);

      await apiClient.patch('/comments/notification/comment', null, {
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
