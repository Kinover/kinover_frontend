// hooks/usePostPageViewModel.js
import {useState, useEffect, useMemo, useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

import {createCommentThunk} from '../store/commentThunk';
import {
  useDeletePostMutation,
  useDeletePostImageMutation,
  useGetCommentsQuery,
  useDeleteCommentMutation,
} from '../services/memoryApi';
import {useGetFamilyUsersQuery} from 'features/home/services/homeApi';

export default function usePostPageViewModel(memory) {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const user = useSelector(state => state.user);
  const familyId = useSelector(state => state.family.familyId);

  const safePostId = memory?.postId ?? null;

  const {data: rawFamilyUsers = []} = useGetFamilyUsersQuery(familyId, {skip: !familyId});
  const {data: commentList = []} = useGetCommentsQuery(safePostId, {skip: !safePostId});

  const [deletePost] = useDeletePostMutation();
  const [deletePostImage] = useDeletePostImageMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const safeImages = useMemo(
    () => memory?.imageUrls ?? [],
    [memory?.imageUrls],
  );

  const [commentText, setCommentText] = useState('');
  const [commentIndex, setCommentIndex] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [localImages, setLocalImages] = useState(safeImages);

  const [isImageFullScreen, setIsImageFullScreen] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState('');
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);

 // 댓글 삭제 모달 상태
  const [commentDeleteModalVisible, setCommentDeleteModalVisible] =
    useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

 // 토스트
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

 // 멘션 후보용: familyUsers에서 "본인" 제거 + 최소 필드만 정리
  const familyUsers = useMemo(() => {
    const me = user?.userId;
    const list = Array.isArray(rawFamilyUsers) ? rawFamilyUsers : [];

    return list
      .filter(u => u?.userId != null && u?.name)
      .filter(u => (me == null ? true : String(u.userId) !== String(me)))
      .map(u => ({
        userId: u.userId,
        name: u.name,
        image: u.image || u.profileImage || u.avatar || null,
      }));
  }, [rawFamilyUsers, user?.userId]);

 // 로컬 이미지 동기화
  useEffect(() => {
    setLocalImages(safeImages);
    setCurrentImageIndex(idx => {
      if (safeImages.length === 0) return 0;
      return Math.min(idx, safeImages.length - 1);
    });
  }, [safeImages]);

 /**
 * 댓글 전송 (멘션 확장)
 * - 기존: handleSendComment()
 * - 변경: handleSendComment(payload?) 도 가능
 *
 * BottomSheet에서 이렇게 호출할 거야:
 * onSubmitComment({ content, mentionUserIds })
 *
 * 혹시 다른 곳에서 예전처럼 handleSendComment()로 부르더라도
 * commentText 기반으로 동작하게 호환 유지.
 */
  const handleSendComment = useCallback(
    payload => {
      const contentFromPayload = payload?.content;
      const mentionUserIds = payload?.mentionUserIds || [];

      const text = String(
        contentFromPayload != null ? contentFromPayload : commentText,
      ).trim();

      if (!text || !safePostId || !user?.userId) return;

      dispatch(
        createCommentThunk({
          postId: safePostId,
          content: text,
          authorId: user.userId,

 // 서버가 받게 만들고 싶으면 DTO/Entity도 같이 확장 필요
          mentionUserIds,
        }),
      );

 // 입력창 초기화는 ViewModel 기준으로도 처리
      setCommentText('');

      setToastMessage('댓글을 추가했어요');
      setToastVisible(true);
    },
    [commentText, dispatch, safePostId, user?.userId],
  );

 // 삭제 모달 오픈
  const openDeleteCommentModal = useCallback(commentId => {
    setCommentToDelete(commentId);
    setCommentDeleteModalVisible(true);
  }, []);

  const closeDeleteCommentModal = useCallback(() => {
    setCommentDeleteModalVisible(false);
    setCommentToDelete(null);
  }, []);

  const [isDeletingComment, setIsDeletingComment] = useState(false);

 // 모달 "확인" 눌렀을 때만 실제 삭제
  const confirmDeleteComment = useCallback(async () => {
    if (!commentToDelete || !safePostId || isDeletingComment) return;

    setIsDeletingComment(true);
    try {
      await deleteComment(String(commentToDelete)).unwrap();

      setToastMessage('댓글을 삭제했어요');
      setToastVisible(true);
    } catch (e) {
    } finally {
      closeDeleteCommentModal();
      setIsDeletingComment(false);
    }
  }, [
    commentToDelete,
    isDeletingComment,
    deleteComment,
    closeDeleteCommentModal,
  ]);

  const handleDeletePost = useCallback(async () => {
    if (!safePostId) return;
    try {
      await deletePost(safePostId).unwrap();
      navigation.goBack();
      setToastMessage('게시글이 삭제되었어요');
      setToastVisible(true);
    } catch (error) {
    }
  }, [deletePost, safePostId, navigation]);

  const handleDeleteImage = useCallback(async () => {
    if (!safePostId || localImages.length === 0) return;

    const targetImage = localImages[currentImageIndex];
    try {
      await deletePostImage({postId: safePostId, imageUrl: targetImage}).unwrap();

      const updated = localImages.filter((_, i) => i !== currentImageIndex);
      setLocalImages(updated);

      if (updated.length === 0) {
        await handleDeletePost();
      } else {
        setCurrentImageIndex(idx =>
          idx >= updated.length ? Math.max(0, updated.length - 1) : idx,
        );
        setToastMessage('이미지가 삭제되었어요');
        setToastVisible(true);
      }
    } catch (e) {
    }
  }, [
    deletePostImage,
    safePostId,
    localImages,
    currentImageIndex,
    handleDeletePost,
  ]);

  return {
    user,
    familyUsers, // "본인 제외된" 멘션 후보 리스트로 정리됨
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

 // 댓글 삭제 모달
    commentDeleteModalVisible,
    setCommentDeleteModalVisible,
    commentToDelete,
    openDeleteCommentModal,
    closeDeleteCommentModal,
    confirmDeleteComment,
    isDeletingComment,

 // 토스트
    toastVisible,
    setToastVisible,
    toastMessage,
    setToastMessage,
  };
}
