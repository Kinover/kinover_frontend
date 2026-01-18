// src/features/memory/store/memoryThunk.js

import {apiClient} from '../../../utils/apiClient';
import {
  setMemoryList,
  setMemoryLoading,
  setMemoryError,
  setPostDetail,
} from './memorySlice';

export const fetchMemoryThunk = (familyId, categoryId = null) => {
  return async dispatch => {
    dispatch(setMemoryLoading(true));
    console.log('📥 게시글 목록 요청 시작:', {familyId, categoryId});

    try {
      // GET /api/posts?familyId=...&categoryId=...
      const res = await apiClient.get('/posts', {
        headers: {'Content-Type': 'application/json'},
        params: {
          familyId,
          ...(categoryId ? {categoryId} : {}),
        },
      });

      console.log('✅ 게시글 목록 조회 성공:', res.data);
      dispatch(setMemoryList(res.data));
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '게시글 목록 조회 실패';

      console.error('❌ 게시글 목록 조회 실패:', msg);
      dispatch(setMemoryError(msg));
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
      // DELETE /api/posts/{postId}
      const res = await apiClient.delete(`/posts/${postId}`, {
        headers: {'Content-Type': 'application/json'},
      });

      console.log('✅ 게시글 삭제 성공:', res.status);

      // 삭제 후 다시 게시글 목록 요청
      dispatch(fetchMemoryThunk(familyId));
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '게시글 삭제 실패';

      console.error('❌ 게시글 삭제 실패:', msg);
      dispatch(setMemoryError(msg));
    } finally {
      dispatch(setMemoryLoading(false));
      console.log('📤 게시글 삭제 요청 종료');
    }
  };
};

// ✅ 게시글 이미지 삭제
export const deletePostImageThunk = (
  postId,
  imageUrlToDelete,
  familyId,
  options = {refresh: true},
) => {
  return async dispatch => {
    dispatch(setMemoryLoading(true));
    console.log('🗑️ 게시글 이미지 삭제 요청 시작:', {postId, imageUrlToDelete});

    try {
      // DELETE /api/posts/{postId}/image
      // axios 스타일로 delete body를 보내려면 { data: {...} }를 써야 함
      const res = await apiClient.delete(`/posts/${postId}/image`, {
        headers: {'Content-Type': 'application/json'},
        data: {
          imageUrl: imageUrlToDelete,
        },
      });

      console.log('✅ 이미지 삭제 성공:', res.status);

      // ✅ 필요할 때만 리프레시
      if (options?.refresh && familyId) {
        dispatch(fetchMemoryThunk(familyId));
      }

      return res.data;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '게시글 이미지 삭제 실패';

      console.error('❌ 게시글 이미지 삭제 실패:', msg);
      dispatch(setMemoryError(msg));
      throw error;
    } finally {
      dispatch(setMemoryLoading(false));
      console.log('📤 이미지 삭제 요청 종료');
    }
  };
};

// ✅ 게시글 알림 ON/OFF
export const togglePostNotificationThunk = ({userId, isOn}) => {
  return async dispatch => {
    try {
      console.log(`🔔 게시글 알림 설정 요청: userId=${userId}, isOn=${isOn}`);

      await apiClient.patch('/posts/notification/post', null, {
        headers: {'Content-Type': 'application/json'},
        params: {userId, isOn},
      });

      console.log('✅ 게시글 알림 설정 변경 성공');
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '게시글 알림 설정 변경 실패';

      console.error('❌ 게시글 알림 설정 변경 실패:', msg);
      dispatch(setMemoryError(msg));
    }
  };
};

export const fetchPostByIdThunk = postId => {
  return async (dispatch, getState) => {
    dispatch(setMemoryLoading(true));
    console.log('📥 특정 게시글 조회 요청 시작:', postId);

    try {
      // 1) 스토어에 이미 있으면 API 호출 없이 종료
      const {postsById} = getState().memory;
      const existingPost = postsById?.[String(postId)];

      if (existingPost) {
        console.log('✅ 이미 스토어에 있는 게시글 발견:', existingPost);
        dispatch(setMemoryLoading(false));
        return;
      }

      console.log('🔍 스토어에 저장된 게시글 없음, API 요청 시작');

      // GET /api/posts/{postId}
      const res = await apiClient.get(`/posts/${postId}`, {
        headers: {'Content-Type': 'application/json'},
      });

      const fetchedPost = res.data;
      console.log('✅ 특정 게시글 조회 성공:', fetchedPost);

      dispatch(setPostDetail(fetchedPost));
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '게시글 조회 실패';

      console.error('❌ 게시글 조회 실패:', msg);
      dispatch(setMemoryError(msg));
      throw error;
    } finally {
      dispatch(setMemoryLoading(false));
      console.log('📤 게시글 조회 요청 종료');
    }
  };
};

export const getPostFromStoreById = postId => {
  return (dispatch, getState) => {
    // ⚠️ 원본 코드가 "getState().memory.memoryList.posts" 구조를 가정하고 있었는데,
    // 실제 구조가 다를 수 있어도 일단 기존대로 유지함.
    const {posts} = getState().memory.memoryList; // posts는 배열이라고 가정
    const targetPost = posts.find(post => post.id === postId);

    if (targetPost) {
      console.log('✅ 스토어에서 해당 게시글 찾음:', targetPost);
      return targetPost;
    } else {
      console.warn('❌ 해당 ID의 게시글이 스토어에 없음:', postId);
      return null;
    }
  };
};
