// src/features/memory/components/MemoryGuideModal.jsx
import {useEffect} from 'react';
import {Platform} from 'react-native';
import useGuide from 'hooks/useGuide';
import {useGuideOverlay} from 'contexts/GuideOverlayContext';

const KEY_MEMORY_GUIDE_SHOWN = '@kinover/guide/memory_v1_shown';

/** 시안 구조: 하이라이트 + 말풍선 + 하단바 (1/3 스텝) */
const steps = [
  {
    key: 'timeline',
    title: '추억 둘러보기',
    description: '게시물을 탭하면 사진과 영상을 자세히 볼 수 있어요.',
  },
  {
    key: 'filter',
    title: '기간·카테고리',
    description: '**상단 기간·카테고리**를 눌러 추억을 골라볼 수 있어요.',
  },
  {
    key: 'upload',
    title: '추억 남기기',
    description: '**업로드 버튼**을 눌러 사진·영상을 올려보세요.\n한마디를 함께 남기면 좋아요.',
  },
];

export default function MemoryGuideModal({
  enabled = true,
  ready = true,
  forceVisible = false,
  storageKey = KEY_MEMORY_GUIDE_SHOWN,
  targetRef,
  targetRefsByKey,
  onAfterClose,
}) {
  const {visible, closeAndRemember} = useGuide(
    storageKey,
    enabled && ready,
    {forceVisible},
  );
  const {showGuide, hideGuide, setAnyGuideVisible} = useGuideOverlay() || {};

  useEffect(() => {
    if (Platform.OS !== 'android' || !setAnyGuideVisible) return;
    if (visible) setAnyGuideVisible(true);
    return () => setAnyGuideVisible(false);
  }, [visible, setAnyGuideVisible]);

  useEffect(() => {
    if (!showGuide || !hideGuide) return;
    if (visible) {
      const closeAndHide = () => {
        closeAndRemember();
        hideGuide();
      };
      showGuide({
        visible: true,
        steps,
        onRequestClose: closeAndHide,
        onDone: closeAndHide,
        targetRef,
        targetRefsByKey,
      });
    } else {
      hideGuide();
    }
    return () => hideGuide();
  }, [visible, showGuide, hideGuide, closeAndRemember]);

  if (!enabled) return null;

  return null;
}
