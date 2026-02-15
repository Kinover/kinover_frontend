// src/features/memory/components/MemoryGuideModal.jsx
import React from 'react';
import GuideModalCarousel from 'components/modal/GuideModal';
import useGuide from 'hooks/useGuide';

const KEY_MEMORY_GUIDE_SHOWN = '@kinover/guide/memory_v1_shown';

const steps = [
  {
    key: 'timeline',
    title: '사진·영상을 시간순으로 모아보기',
    description:
      '추억 화면에서는 우리 가족이 올린 사진과 영상을 한곳에서 모아볼 수 있어요.\n\n'
      + '스크롤만 해도 시간순으로 자연스럽게 이어져서 '
      + '지난 기록을 다시 꺼내보기 딱 좋아요.',
  },
  {
    key: 'filter_period',
    title: '기간으로 빠르게 찾기',
    description:
      '상단 필터에서 기간을 선택하면 '
      + '그 기간에 해당하는 추억만 골라서 볼 수 있어요.\n\n'
      + '“이번 달 여행 사진만 보기”처럼 '
      + '찾고 싶은 순간을 빠르게 좁힐 때 유용해요.',
  },
  {
    key: 'filter_category',
    title: '카테고리별로 깔끔하게 정리하기',
    description:
      '카테고리를 선택하면 '
      + '같은 주제의 추억만 모아서 볼 수 있어요.\n\n'
      + '예를 들어 “여행 / 일상 / 기념일”처럼 '
      + '우리 가족만의 기준으로 정리해두면 나중에 찾기가 훨씬 쉬워져요.',
  },
  {
    key: 'upload',
    title: '업로드로 추억 쌓기',
    description:
      '업로드 버튼을 눌러 사진이나 영상을 올릴 수 있어요.\n\n'
      + '짧은 메모나 한마디를 함께 남겨두면 '
      + '그때의 분위기가 더 또렷하게 기억돼요.',
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
