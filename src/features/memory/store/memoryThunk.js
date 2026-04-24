import {
  setMemoryList,
  setMemoryLoading,
  setMemoryError,
  setPostDetail,
} from './memorySlice';
import {memoryApi} from '../services/memoryApi';

import {STORE_MOCK_ENABLED, getStoreMockMemoryList} from '../../home/utils/storeMockData';

/**
 * 게시글 목록 조회
 */
export const fetchMemoryThunk = categoryId => {
  return async dispatch => {
    const isUuid = v =>
      typeof v === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

    dispatch(setMemoryLoading(true));
    dispatch(setMemoryError(null));

    try {
      if (STORE_MOCK_ENABLED) {
        const mockList = getStoreMockMemoryList();
        const filtered =
          categoryId != null && categoryId !== ''
            ? mockList.filter(p => String(p.categoryId) === String(categoryId))
            : mockList;
        dispatch(setMemoryList(filtered));
        dispatch(setMemoryLoading(false));
        return filtered;
      }

      const params = {};
      if (isUuid(categoryId)) {
        params.categoryId = categoryId;
      }

      const req = dispatch(
        memoryApi.endpoints.getPosts.initiate(
          {categoryId: params?.categoryId},
          {forceRefetch: true},
        ),
      );
      const data = await req.unwrap();
      req.unsubscribe();

      const list = Array.isArray(data) ? data : [];
      dispatch(setMemoryList(list));
      return list;
    } catch (error) {
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

export const deletePostThunk = (postId, categoryId) => {
  return async dispatch => {
    dispatch(setMemoryLoading(true));
    dispatch(setMemoryError(null));

    try {
      const req = dispatch(memoryApi.endpoints.deletePost.initiate(postId));
      await req.unwrap();
      req.unsubscribe();

      await dispatch(fetchMemoryThunk(categoryId));

      return true;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '게시글 삭제 실패';

      dispatch(setMemoryError(msg));
      throw error;
    } finally {
      dispatch(setMemoryLoading(false));
    }
  };
};

export const deletePostImageThunk = (
  postId,
  imageUrlToDelete,
  categoryId,
  options = {refresh: true},
) => {
  return async dispatch => {
    dispatch(setMemoryLoading(true));
    dispatch(setMemoryError(null));

    try {
      const req = dispatch(
        memoryApi.endpoints.deletePostImage.initiate({
          postId,
          imageUrl: imageUrlToDelete,
        }),
      );
      const data = await req.unwrap();
      req.unsubscribe();

      if (options?.refresh) {
        await dispatch(fetchMemoryThunk(categoryId));
      }

      return data;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '게시글 이미지 삭제 실패';

      dispatch(setMemoryError(msg));
      throw error;
    } finally {
      dispatch(setMemoryLoading(false));
    }
  };
};

export const togglePostNotificationThunk = ({userId, isOn}) => {
  return async dispatch => {
    dispatch(setMemoryError(null));
    try {
      const req = dispatch(
        memoryApi.endpoints.togglePostNotification.initiate({userId, isOn}),
      );
      await req.unwrap();
      req.unsubscribe();

      return true;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '게시글 알림 설정 변경 실패';

      dispatch(setMemoryError(msg));
      throw error;
    }
  };
};

export const fetchPostByIdThunk = postId => {
  return async (dispatch, getState) => {
    dispatch(setMemoryLoading(true));
    dispatch(setMemoryError(null));

    try {
      const {postsById} = getState().memory || {};
      const existingPost = postsById?.[String(postId)];
      if (existingPost) {
        return existingPost;
      }

      const req = dispatch(
        memoryApi.endpoints.getPostById.initiate(postId, {forceRefetch: true}),
      );
      const data = await req.unwrap();
      req.unsubscribe();

      dispatch(setPostDetail(data));
      return data;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '게시글 조회 실패';

      dispatch(setMemoryError(msg));
      throw error;
    } finally {
      dispatch(setMemoryLoading(false));
    }
  };
};

export const getPostFromStoreById = postId => {
  return (dispatch, getState) => {
    const state = getState();
    const post = state?.memory?.postsById?.[String(postId)] || null;

    if (post) {
      return post;
    }

    const list = state?.memory?.memoryList || [];
    const fallback = Array.isArray(list)
      ? list.find(p => String(p?.postId) === String(postId))
      : null;

    if (fallback) {
      return fallback;
    }

    return null;
  };
};
