// src/features/post/hooks/usePostConfirmDelete.js
import {useCallback, useState} from 'react';
import {useDeleteCommentMutation} from '../services/memoryApi';

/**
 * 삭제 확인 모달 전담
 * - image / post / comment 3종 지원
 */
export default function usePostConfirmDelete({
  postId,
  vm,
  toast,
}) {
  const [deleteComment] = useDeleteCommentMutation();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDeleteType, setPendingDeleteType] = useState(null); // 'image' | 'post' | 'comment'
  const [pendingCommentId, setPendingCommentId] = useState(null);
  const [isConfirmDeleting, setIsConfirmDeleting] = useState(false);

  const openConfirm = useCallback((type, payload) => {
    setPendingDeleteType(type);
    setPendingCommentId(type === 'comment' ? payload : null);
    setConfirmVisible(true);
  }, []);

  const openDeleteCommentConfirm = useCallback(commentId => {
    openConfirm('comment', commentId);
  }, [openConfirm]);

  const openDeletePostConfirm = useCallback(() => {
    openConfirm('post', null);
  }, [openConfirm]);

  const openDeleteImageConfirm = useCallback(() => {
    openConfirm('image', null);
  }, [openConfirm]);

  const closeConfirmModal = useCallback(() => {
    if (isConfirmDeleting) return;
    setConfirmVisible(false);
    setPendingDeleteType(null);
    setPendingCommentId(null);
  }, [isConfirmDeleting]);

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteType || isConfirmDeleting) return;

    setIsConfirmDeleting(true);
    try {
      if (pendingDeleteType === 'image') {
        await vm?.handleDeleteImage?.();
        toast?.('미디어를 삭제했어요');
      } else if (pendingDeleteType === 'post') {
        await vm?.handleDeletePost?.();
        toast?.('게시글을 삭제했어요');
      } else if (pendingDeleteType === 'comment') {
        if (pendingCommentId && postId) {
          await deleteComment(String(pendingCommentId)).unwrap();
          toast?.('댓글을 삭제했어요');
        }
      }
    } catch (e) {
      toast?.('삭제 중 오류가 발생했어요.');
    } finally {
      setIsConfirmDeleting(false);
      setConfirmVisible(false);
      setPendingDeleteType(null);
      setPendingCommentId(null);
    }
  }, [
    pendingDeleteType,
    isConfirmDeleting,
    vm,
    toast,
    pendingCommentId,
    postId,
    deleteComment,
  ]);

  return {
    confirmVisible,
    pendingDeleteType,
    pendingCommentId,
    isConfirmDeleting,

    openConfirm,
    openDeleteCommentConfirm,
    openDeletePostConfirm,
    openDeleteImageConfirm,

    closeConfirmModal,
    confirmDelete,
  };
}
