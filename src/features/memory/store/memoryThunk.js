import axios from 'axios';
import {getToken} from '../../../utils/storage';
import {
  setMemoryList,
  setMemoryLoading,
  setMemoryError,
  setPostDetail
} from './memorySlice';

export const fetchMemoryThunk = (familyId, categoryId = null) => {
  return async dispatch => {
    dispatch(setMemoryLoading(true));
    console.log('📥 게시글 목록 요청 시작:', {familyId, categoryId});
    try {
      const token = await getToken();
      console.log('🔐 토큰 획득 성공:', token);

      let apiUrl = `https://kinover.shop/api/posts?familyId=${familyId}`;
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

      const apiUrl = `https://kinover.shop/api/posts/${postId}`;
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
// ✅ memoryThunk.js 안의 deletePostImageThunk만 이걸로 교체

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
      const token = await getToken();
      console.log('🔐 토큰 획득 성공:', token);

      const apiUrl = `https://kinover.shop/api/posts/${postId}/image`;
      console.log('🌐 DELETE 요청 URL:', apiUrl);

      const response = await axios.delete(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        data: {
          imageUrl: imageUrlToDelete, // ✅ 서버가 URL/파일명 둘 다 받는다고 했으니 fileName 넣어도 됨
        },
      });

      console.log('✅ 이미지 삭제 성공:', response.status);

      // ✅ 필요할 때만 리프레시
      if (options?.refresh && familyId) {
        dispatch(fetchMemoryThunk(familyId));
      }

      // ✅ CreatePostScreen에서 await할 수 있게 return
      return response.data;
    } catch (error) {
      console.error('❌ 게시글 이미지 삭제 실패:', error?.response?.data || error);
      dispatch(setMemoryError(error.message));
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
    try {
      const token = await getToken();
      console.log(`🔔 게시글 알림 설정 요청: userId=${userId}, isOn=${isOn}`);

      await axios.patch(
        `https://kinover.shop/api/posts/notification/post`,
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

      console.log('✅ 게시글 알림 설정 변경 성공');
    } catch (error) {
      console.error('❌ 게시글 알림 설정 변경 실패:', error.message);
      dispatch(setMemoryError(error.message));
    }
  };
};

export const fetchPostByIdThunk = postId => {
  return async (dispatch, getState) => {
    dispatch(setMemoryLoading(true));
    console.log('📥 특정 게시글 조회 요청 시작:', postId);

    try {
      // 1. 먼저 Redux 스토어의 postsById에서 해당 포스트가 있는지 확인
      // PostPage에서 useSelector로 직접 접근하므로, 이 부분은 PostPage 로직과 일치시킵니다.
      const {postsById} = getState().memory;
      const existingPost = postsById[postId]; // postId로 직접 접근

      // 2. 이미 스토어에 있으면 API 호출 없이 종료
      if (existingPost) {
        console.log('✅ 이미 스토어에 있는 게시글 발견:', existingPost);
        dispatch(setMemoryLoading(false));
        // 스토어에 이미 있는 데이터를 PostPage가 사용할 수 있도록 여기서 액션 디스패치
        // (선택적이지만 일관성을 위해 추천. PostPage는 useSelector로 이미 가져오므로 없어도 동작.)
        // dispatch(setPostDetail(existingPost));
        return; // 이미 있으므로 Thunk 종료
      }

      // 3. 없으면 API 호출해서 가져오기 (⭐ 특정 게시물 조회 API 사용)
      console.log('🔍 스토어에 저장된 게시글 없음, API 요청 시작');
      const token = await getToken();
      console.log('🔐 토큰 획득 성공:', token);

      // 🚨 수정: 특정 게시물 조회 API 엔드포인트
      const apiUrl = `https://kinover.shop/api/posts/${postId}`;
      console.log('🌐 GET 요청 URL (특정 게시물):', apiUrl);

      const response = await axios.get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const fetchedPost = response.data; // API에서 반환된 단일 게시물 데이터
      console.log('✅ 특정 게시글 조회 성공:', fetchedPost);

      // 🚨 중요: 불러온 단일 게시물 데이터를 Redux 스토어에 디스패치하여 PostPage가 사용할 수 있도록 합니다.
      dispatch(setPostDetail(fetchedPost));

    } catch (error) {
      console.error('❌ 게시글 조회 실패:', error);
      dispatch(setMemoryError(error.message));
      // 에러 발생 시 PostPage에서 이를 처리할 수 있도록 에러를 다시 던짐
      throw error;
    } finally {
      dispatch(setMemoryLoading(false));
      console.log('📤 게시글 조회 요청 종료');
    }
  };
};


export const getPostFromStoreById = postId => {
  return (dispatch, getState) => {
    const { posts } = getState().memory.memoryList; // posts는 배열이라고 가정
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
