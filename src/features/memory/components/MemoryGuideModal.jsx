// src/features/memory/components/MemoryGuideModal.jsx
import React from 'react';
import GuideModalCarousel from 'components/modal/GuideModal';
import useGuide from 'hooks/useGuide';

const KEY_MEMORY_GUIDE_SHOWN = '@kinover/guide/memory_v1_shown';

/** 행동 유도형: 이 화면에서 뭘 누르면 되는지 안내 */
const steps = [
  {
    key: 'timeline',
    title: '추억',
    description: '**스크롤**해서 가족 추억을 시간순으로 보세요.\n**상단 기간·카테고리**를 눌러 골라볼 수 있어요.',
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
}) {
  const {visible, closeAndRemember} = useGuide(
    storageKey,
    enabled && ready,
    {forceVisible},
  );

  if (!enabled) return null;

  return (
    <GuideModalCarousel
      visible={visible}
      steps={steps}
      onRequestClose={closeAndRemember}
      onDone={closeAndRemember}
    />
  );
}
