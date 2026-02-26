// src/screens/memory/store/memoryThunk.js
import {apiClient} from 'utils/apiClient';
import {POSTS} from 'config/apiEndpoints';
import {
  setMemoryList,
  setMemoryLoading,
  setMemoryError,
  setPostDetail,
} from './memorySlice';

import {getGuestMode} from 'utils/storage'; // 추가
import {STORE_MOCK_ENABLED, getStoreMockMemoryList} from '../../home/utils/storeMockData';

// =======================
// Guest Dummy
// =======================
const makeGuestPosts = () => {
 // 네 UI가 어떤 필드(postId/content/images/categoryTitle/createdAt 등)를 쓰는지 몰라서
 // "최소한의 흔한 필드"로 구성했어.
 // 만약 UI에서 다른 키를 강하게 쓰면(예: images[].imageUrl 필수) 그 키만 맞춰주면 돼.
  const now = new Date().toISOString();

  return [
    {
      postId: 'GUEST_POST_1',
      content: '게스트 모드예요! 서버 없이 UI만 둘러볼 수 있어요 🙂',
      createdAt: now,
      categoryId: 'GUEST_CAT_1',
      categoryTitle: '일상',
      images: [
        {
          imageUrl: 'https://via.placeholder.com/800x600.png?text=Kinover+Guest+1',
        },
      ],
      authorName: '게스트',
      commentCount: 0,
    },
    {
      postId: 'GUEST_POST_2',
      content: '이건 더미 게시글이에요. 나중에 로그인하면 진짜 데이터가 보여요!',
      createdAt: now,
      categoryId: 'GUEST_CAT_2',
      categoryTitle: '기념일',
      images: [],
      authorName: '게스트',
      commentCount: 2,
    },
    {
      postId: 'GUEST_POST_3',
      content: 'UI 작업할 때 게스트 모드가 있으면 너무 편하쥬 ✨',
      createdAt: now,
      categoryId: 'GUEST_CAT_3',
      categoryTitle: '기록',
      images: [
        {
          imageUrl: 'https://via.placeholder.com/800x600.png?text=Kinover+Guest+2',
        },
      ],
      authorName: '게스트',
      commentCount: 1,
    },
  ];
};

const filterGuestPostsByCategoryId = (posts, categoryId) => {
 // 네 로직이 UUID만 categoryId로 인정하니까
 // 게스트 모드에서는 그냥 "문자열 카테고리"도 필터되게 따로 처리해주는 게 좋아.
  if (!categoryId) return posts;

  return posts.filter(p => String(p.categoryId) === String(categoryId));
};

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
 // 스토어 목업이면 더미(부산 광안리 여행) 세팅
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
 // 게스트면 서버 호출 X, 더미 list 세팅
      const isGuest = await getGuestMode();
      if (isGuest) {
        const dummyAll = makeGuestPosts();
        const dummy = filterGuestPostsByCategoryId(dummyAll, categoryId);
        dispatch(setMemoryList(dummy));
        console.log('🟡 [GUEST] fetchMemoryThunk: server skipped', {
          categoryId,
          count: dummy.length,
        });
        return dummy;
      }

      const params = {};

 // categoryId는 "진짜 UUID"일 때만 붙이기
      if (isUuid(categoryId)) {
        params.categoryId = categoryId;
      } else {
        if (categoryId != null) {
          console.log('⚠️ categoryId 무시됨(UUID 아님):', categoryId);
        }
      }

      console.log('🧪 posts list request', {
        baseURL: apiClient?.defaults?.baseURL,
        path: '/posts',
        params: Object.keys(params).length ? params : undefined,
      });

      const res = await apiClient.get(POSTS.list, {
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

// 게시글 삭제
export const deletePostThunk = (postId, categoryId) => {
  return async (dispatch, getState) => {
    dispatch(setMemoryLoading(true));
    dispatch(setMemoryError(null));
    console.log('🗑️ 게시글 삭제 요청 시작:', {postId, categoryId});

    try {
 // 게스트면 서버 호출 X, 로컬 리스트에서만 제거
      const isGuest = await getGuestMode();
      if (isGuest) {
        const list = getState()?.memory?.memoryList || [];
        const next = Array.isArray(list)
          ? list.filter(p => String(p?.postId) !== String(postId))
          : [];
        dispatch(setMemoryList(next));
        console.log('🟡 [GUEST] deletePostThunk: server skipped', {postId});
        return true;
      }

      const res = await apiClient.delete(POSTS.delete(postId), {
        headers: {'Content-Type': 'application/json'},
      });

      console.log('✅ 게시글 삭제 성공:', res.status);

 // 삭제 후 목록 갱신
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

// 게시글 이미지 삭제
export const deletePostImageThunk = (
  postId,
  imageUrlToDelete,
  categoryId,
  options = {refresh: true},
) => {
  return async (dispatch, getState) => {
    dispatch(setMemoryLoading(true));
    dispatch(setMemoryError(null));
    console.log('🗑️ 게시글 이미지 삭제 요청 시작:', {postId, imageUrlToDelete});

    try {
 // 게스트면 서버 호출 X, 로컬에서 이미지 제거만
      const isGuest = await getGuestMode();
      if (isGuest) {
        const list = getState()?.memory?.memoryList || [];
        const next = Array.isArray(list)
          ? list.map(p => {
              if (String(p?.postId) !== String(postId)) return p;
              const imgs = Array.isArray(p?.images) ? p.images : [];
              const newImgs = imgs.filter(img => img?.imageUrl !== imageUrlToDelete);
              return {...p, images: newImgs};
            })
          : [];
        dispatch(setMemoryList(next));
        console.log('🟡 [GUEST] deletePostImageThunk: server skipped', {postId});
        return {ok: true, guest: true};
      }

      const res = await apiClient.delete(POSTS.deleteImage(postId), {
        headers: {'Content-Type': 'application/json'},
        data: {imageUrl: imageUrlToDelete},
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

// 게시글 알림 ON/OFF
export const togglePostNotificationThunk = ({userId, isOn}) => {
  return async dispatch => {
    dispatch(setMemoryError(null));
    try {
 // 게스트면 서버 호출 X
      const isGuest = await getGuestMode();
      if (isGuest) {
        console.log('🟡 [GUEST] togglePostNotificationThunk: server skipped', {userId, isOn});
        return true;
      }

      console.log(`🔔 게시글 알림 설정 요청: userId=${userId}, isOn=${isOn}`);

      await apiClient.patch(POSTS.notificationPostGlobal, null, {
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

// 특정 게시글 조회 (단건)
export const fetchPostByIdThunk = postId => {
  return async (dispatch, getState) => {
    dispatch(setMemoryLoading(true));
    dispatch(setMemoryError(null));
    console.log('📥 특정 게시글 조회 요청 시작:', postId);

    try {
 // 게스트면 서버 호출 X
      const isGuest = await getGuestMode();
      if (isGuest) {
 // 스토어에 있으면 그거 반환, 없으면 더미에서 찾아서 setPostDetail
        const {postsById, memoryList} = getState().memory || {};
        const existingPost = postsById?.[String(postId)];
        if (existingPost) return existingPost;

        const list = Array.isArray(memoryList) ? memoryList : [];
        const found = list.find(p => String(p?.postId) === String(postId));

        const dummyAll = makeGuestPosts();
        const dummyFound =
          found || dummyAll.find(p => String(p?.postId) === String(postId)) || dummyAll[0];

        dispatch(setPostDetail(dummyFound));
        console.log('🟡 [GUEST] fetchPostByIdThunk: server skipped', postId);
        return dummyFound;
      }

      const {postsById} = getState().memory || {};
      const existingPost = postsById?.[String(postId)];
      if (existingPost) {
        console.log('✅ 이미 스토어에 있는 게시글:', postId);
        return existingPost;
      }

      const res = await apiClient.get(POSTS.one(postId), {
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

// 스토어에서 postId로 게시글 가져오기 (동기 selector성 thunk)
export const getPostFromStoreById = postId => {
  return (dispatch, getState) => {
    const state = getState();
    const post = state?.memory?.postsById?.[String(postId)] || null;

    if (post) {
      console.log('✅ 스토어에서 해당 게시글 찾음:', postId);
      return post;
    }

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
