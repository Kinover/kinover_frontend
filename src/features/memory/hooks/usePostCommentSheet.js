// src/features/post/hooks/usePostCommentSheet.js
import {useCallback, useRef} from 'react';

/**
 * 댓글 sheet 열기/닫기 + 타이머/중복 방지 + cleanup 전담
 */
export default function usePostCommentSheet({
  isChromeHidden,
  isLeavingRef,
  menuVisible,
  closeMenu,
  collapseDesc,
  commentSheetRef,
}) {
  const commentOpenRef = useRef(false);
  const presentingCommentRef = useRef(false);
  const commentOpenTimerRef = useRef(null);

  const cleanupCommentTimers = useCallback(() => {
    if (commentOpenTimerRef.current) {
      clearTimeout(commentOpenTimerRef.current);
      commentOpenTimerRef.current = null;
    }

    try {
      commentSheetRef?.current?.dismiss?.();
    } catch {return null}

    commentOpenRef.current = false;
    presentingCommentRef.current = false;
  }, [commentSheetRef]);

  const openCommentSheet = useCallback(() => {
    if (isChromeHidden) return;
    if (isLeavingRef?.current) return;

    if (menuVisible) closeMenu?.();
    if (commentOpenRef.current) return;
    if (presentingCommentRef.current) return;

    collapseDesc?.();

    if (commentOpenTimerRef.current) {
      clearTimeout(commentOpenTimerRef.current);
      commentOpenTimerRef.current = null;
    }

    presentingCommentRef.current = true;

    commentOpenTimerRef.current = setTimeout(() => {
      commentOpenTimerRef.current = null;

      if (isLeavingRef?.current) {
        presentingCommentRef.current = false;
        return;
      }

      commentSheetRef?.current?.present?.();
    }, 120);
  }, [
    isChromeHidden,
    isLeavingRef,
    menuVisible,
    closeMenu,
    collapseDesc,
    commentSheetRef,
  ]);

  const onCommentSheetChange = useCallback(index => {
 // MemoryDetailBottomSheet가 index < 0 이면 닫힘
    commentOpenRef.current = index >= 0;
    if (index < 0) presentingCommentRef.current = false;
  }, []);

  return {
    commentOpenRef,
    presentingCommentRef,
    commentOpenTimerRef,

    openCommentSheet,
    cleanupCommentTimers,
    onCommentSheetChange,
  };
}
