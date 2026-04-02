// src/features/memory/store/commentThunk.js
// 댓글 조회·추가: /posts/:postId/comments (서버에서 많이 쓰는 형태)
// 댓글 삭제: /comments/:commentId

import {
  setCommentList,
  setCommentLoading,
  setCommentError,
} from './commentSlice';
import {memoryApi} from '../services/memoryApi';

// 댓글 조회 (게시글별)
export const fetchCommentsThunk = postId => {
  return async dispatch => {
    dispatch(setCommentLoading(true));
    console.log('📨 댓글 목록 불러오기 요청:', postId);

    try {
      const req = dispatch(
        memoryApi.endpoints.getComments.initiate(postId, {forceRefetch: true}),
      );
      const res = await req.unwrap();
      req.unsubscribe();

      const data = Array.isArray(res) ? res : res?.data ?? [];
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
    const body = {
      content: String(commentData?.content ?? '').trim(),
      ...(commentData?.authorId != null && {authorId: commentData.authorId}),
      ...(commentData?.mentionUserIds?.length && {
        mentionUserIds: commentData.mentionUserIds,
      }),
    };
    console.log('📨 댓글 추가 요청:', postId, body);

    try {
      const req = dispatch(memoryApi.endpoints.createComment.initiate({postId, ...body}));
      await req.unwrap();
      req.unsubscribe();

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
    console.log('🗑 댓글 삭제 요청:', id);

    try {
      const req = dispatch(memoryApi.endpoints.deleteComment.initiate(id));
      await req.unwrap();
      req.unsubscribe();

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

      const req = dispatch(
        memoryApi.endpoints.toggleCommentNotification.initiate({userId, isOn}),
      );
      await req.unwrap();
      req.unsubscribe();

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
