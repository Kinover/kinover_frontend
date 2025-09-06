// hooks/usePostPageViewModel.js
import {useState, useEffect, useMemo, useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

import {
  fetchCommentsThunk,
  createCommentThunk,
} from '../../../redux/thunk/commentThunk';
import {
  deletePostThunk,
  deletePostImageThunk,
} from '../../../redux/thunk/memoryThunk';

export default function usePostPageViewModel(memory) {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const user = useSelector(state => state.user);
  const familyId = useSelector(state => state.family.familyId);
  const {commentList} = useSelector(state => state.comment);

  // ✅ 안전 기본값(훅 내부 어디서도 null 접근 안 나게)
  const safePostId = memory?.postId ?? null;
  const safeImages = useMemo(
    () => memory?.imageUrls ?? [],
    [memory?.imageUrls],
  );

  const [commentText, setCommentText] = useState('');
  const [commentIndex, setCommentIndex] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [localImages, setLocalImages] = useState(safeImages); // ← 초기값도 안전

  const [isImageFullScreen, setIsImageFullScreen] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState('');
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);

  // ✅ 메모리/이미지 변경 시 로컬 이미지 동기화
  useEffect(() => {
    setLocalImages(safeImages);
    // 현재 인덱스가 범위를 넘어가면 보정
    setCurrentImageIndex(idx => {
      if (safeImages.length === 0) return 0;
      return Math.min(idx, safeImages.length - 1);
    });
  }, [safeImages]);

  // ✅ 댓글 목록 가져오기 (postId 있을 때만)
  useEffect(() => {
    if (safePostId) {
      dispatch(fetchCommentsThunk(safePostId));
    }
  }, [dispatch, safePostId]);

  const handleSendComment = useCallback(() => {
    const text = commentText.trim();
    if (!text || !safePostId || !user?.userId) return;

    dispatch(
      createCommentThunk({
        postId: safePostId,
        content: text,
        authorId: user.userId,
      }),
    );
    setCommentText('');
  }, [commentText, dispatch, safePostId, user?.userId]);

  const handleDeletePost = useCallback(async () => {
    if (!safePostId || !familyId) return;
    try {
      // ⚠️ thunk 시그니처가 (payloadObj) 형태라면 이렇게:
      // await dispatch(deletePostThunk({postId: safePostId, familyId}));
      // 만약 (postId, familyId) 시그니처라면 위 한 줄을 아래로 교체:
      await dispatch(deletePostThunk(safePostId, familyId));
      navigation.goBack();
    } catch (error) {
      console.warn('게시글 삭제 실패:', error);
    }
  }, [dispatch, safePostId, familyId, navigation]);

  const handleDeleteImage = useCallback(async () => {
    if (!safePostId || !familyId || localImages.length === 0) return;

    const targetImage = localImages[currentImageIndex];
    try {
      // ⚠️ thunk 시그니처 확인: 보통 객체로 받게끔 만듭니다.
      // await dispatch(
      //   deletePostImageThunk({
      //     postId: safePostId,
      //     imageUrl: targetImage,
      //     familyId,
      //   }),
      // );
      // (시그니처가 (postId, imageUrl, familyId)면 위를 아래로 교체)
      await dispatch(deletePostImageThunk(safePostId, targetImage, familyId));

      // 낙관적 업데이트
      const updated = localImages.filter((_, i) => i !== currentImageIndex);
      setLocalImages(updated);
      if (updated.length === 0) {
        // 마지막 이미지 삭제되면 포스트도 삭제
        await handleDeletePost();
      } else {
        // 인덱스 보정
        setCurrentImageIndex(idx =>
          idx >= updated.length ? Math.max(0, updated.length - 1) : idx,
        );
      }
    } catch (e) {
      console.warn('이미지 삭제 실패:', e);
    }
  }, [
    dispatch,
    safePostId,
    familyId,
    localImages,
    currentImageIndex,
    handleDeletePost,
  ]);

  return {
    user,
    commentList,
    commentText,
    setCommentText,
    commentIndex,
    setCommentIndex,
    currentImageIndex,
    setCurrentImageIndex,
    localImages,
    setLocalImages,
    isImageFullScreen,
    setIsImageFullScreen,
    deleteModalVisible,
    setDeleteModalVisible,
    deleteTarget,
    setDeleteTarget,
    showDeleteOptions,
    setShowDeleteOptions,
    handleSendComment,
    handleDeletePost,
    handleDeleteImage,
  };
}
