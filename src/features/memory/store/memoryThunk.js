// src/screens/memory/store/memoryThunk.js
import {apiClient} from '../../../utils/apiClient';
import {
  setMemoryList,
  setMemoryLoading,
  setMemoryError,
  setPostDetail,
} from './memorySlice';

/**
 * ✅ 게시글 목록 조회 (A안: 서버가 userId로 familyId를 결정)
 * - 이제 familyId를 보내지 않는다.
 * - categoryId만 "진짜 UUID"일 때만 붙인다.
 */
export const fetchMemoryThunk = categoryId => {
  return async dispatch => {
    const isUuid = v =>
      typeof v === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        v,
      );

    dispatch(setMemoryLoading(true));
    dispatch(setMemoryError(null));

    try {
      const params = {};

      // ✅ categoryId는 "진짜 UUID"일 때만 붙이기
      if (isUuid(categoryId)) {
        params.categoryId = categoryId;
      } else {
        // 디버깅용: 전체 선택인데도 값이 들어오는 경우 잡아냄
        if (categoryId != null) {
          console.log('⚠️ categoryId 무시됨(UUID 아님):', categoryId);
        }
      }

      console.log('🧪 posts list request', {
        baseURL: apiClient?.defaults?.baseURL,
        path: '/posts',
        params: Object.keys(params).length ? params : undefined,
      });

      const res = await apiClient.get('/posts', {
        params: Object.keys(params).length ? params : undefined,
      });

      const data = res?.data;
      if (!Array.isArray(data)) {
        console.log('⚠️ posts list response is not array:', data);
      }

      dispatch(setMemoryList(Array.isArray(data) ? data : []));
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ 게시글 목록 조회 실패:', {
        baseURL: apiClient?.defaults?.baseURL,
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });

      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '게시글을 불러오지 못했어요';

      dispatch(setMemoryError(msg));
      throw error;
    } finally {
      dispatch(setMemoryLoading(false));
    }
  };
};

// ✅ 게시글 삭제
// - A안: familyId 필요 없음
// - 삭제 후 refresh가 필요하면 "현재 선택 categoryId"를 같이 넘겨서 목록 새로고침
export const deletePostThunk = (postId, categoryId) => {
  return async dispatch => {
    dispatch(setMemoryLoading(true));
    dispatch(setMemoryError(null));
    console.log('🗑️ 게시글 삭제 요청 시작:', {postId, categoryId});

    try {
      const res = await apiClient.delete(`/posts/${postId}`, {
        headers: {'Content-Type': 'application/json'},
      });

      console.log('✅ 게시글 삭제 성공:', res.status);

      // ✅ 삭제 후 목록 갱신
      await dispatch(fetchMemoryThunk(categoryId));

      return true;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '게시글 삭제 실패';

      console.error('❌ 게시글 삭제 실패:', msg);
      dispatch(setMemoryError(msg));
      throw error;
    } finally {
      dispatch(setMemoryLoading(false));
      console.log('📤 게시글 삭제 요청 종료');
    }
  };
};

// ✅ 게시글 이미지 삭제
// - A안: familyId 필요 없음
// - 삭제 후 refresh가 필요하면 categoryId로 목록 새로고침
export const deletePostImageThunk = (
  postId,
  imageUrlToDelete,
  categoryId,
  options = {refresh: true},
) => {
  return async dispatch => {
    dispatch(setMemoryLoading(true));
    dispatch(setMemoryError(null));
    console.log('🗑️ 게시글 이미지 삭제 요청 시작:', {postId, imageUrlToDelete});

    try {
      const res = await apiClient.delete(`/posts/${postId}/image`, {
        headers: {'Content-Type': 'application/json'},
        data: {imageUrl: imageUrlToDelete}, // ✅ axios delete body는 data로
      });

      console.log('✅ 이미지 삭제 성공:', res.status);

      if (options?.refresh) {
        await dispatch(fetchMemoryThunk(categoryId));
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

// ✅ 게시글 알림 ON/OFF (변경 없음)
export const togglePostNotificationThunk = ({userId, isOn}) => {
  return async dispatch => {
    dispatch(setMemoryError(null));
    try {
      console.log(`🔔 게시글 알림 설정 요청: userId=${userId}, isOn=${isOn}`);

      await apiClient.patch('/posts/notification/post', null, {
        headers: {'Content-Type': 'application/json'},
        params: {userId, isOn},
      });

      console.log('✅ 게시글 알림 설정 변경 성공');
      return true;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '게시글 알림 설정 변경 실패';

      console.error('❌ 게시글 알림 설정 변경 실패:', msg);
      dispatch(setMemoryError(msg));
      throw error;
    }
  };
};

// ✅ 특정 게시글 조회 (단건) (변경 없음)
export const fetchPostByIdThunk = postId => {
  return async (dispatch, getState) => {
    dispatch(setMemoryLoading(true));
    dispatch(setMemoryError(null));
    console.log('📥 특정 게시글 조회 요청 시작:', postId);

    try {
      const {postsById} = getState().memory || {};
      const existingPost = postsById?.[String(postId)];
      if (existingPost) {
        console.log('✅ 이미 스토어에 있는 게시글:', postId);
        return existingPost;
      }

      const res = await apiClient.get(`/posts/${postId}`, {
        headers: {'Content-Type': 'application/json'},
      });

      dispatch(setPostDetail(res.data));
      console.log('✅ 특정 게시글 조회 성공:', postId);
      return res.data;
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

// ✅ 스토어에서 postId로 게시글 가져오기 (동기 selector성 thunk)
export const getPostFromStoreById = postId => {
  return (dispatch, getState) => {
    const state = getState();
    const post = state?.memory?.postsById?.[String(postId)] || null;

    if (post) {
      console.log('✅ 스토어에서 해당 게시글 찾음:', postId);
      return post;
    }

    // postsById에 없으면 memoryList에서 한 번 더 찾기(방어)
    const list = state?.memory?.memoryList || [];
    const fallback = Array.isArray(list)
      ? list.find(p => String(p?.postId) === String(postId))
      : null;

    if (fallback) {
      console.log('✅ memoryList에서 해당 게시글 찾음:', postId);
      return fallback;
    }

    console.warn('❌ 해당 ID 게시글이 스토어에 없음:', postId);
    return null;
  };
};
