// src/features/chat/components/ChatGuideModal.jsx
import React from 'react';
import GuideModalCarousel from 'components/modal/GuideModal';
import useGuide from 'hooks/useGuide';

const KEY_CHAT_GUIDE_SHOWN = '@kinover/guide/chat_v1_shown';

const steps = [
  {
    key: 'family_chat',
    title: '우리 가족만의 채팅방',
    description:
      '소통 탭에서는 가족끼리만 사용하는 전용 채팅방이 있어요.\n\n'
      + '사진을 공유하거나, 오늘 있었던 일을 가볍게 남기면서 '
      + '가족 대화를 자연스럽게 이어갈 수 있어요.\n'
      + '한 번 쌓인 대화는 계속 남아서, 나중에 다시 보기에도 좋아요.',
  },
  {
    key: 'kino_ai',
    title: 'AI 챗봇 키노와 대화하기',
    description:
      '키노는 우리 가족 앱 안에서 사용할 수 있는 AI 챗봇이에요.\n\n'
      + '일정 정리나 질문 답변처럼 실용적인 도움을 받을 수도 있고, '
      + '가족에게 보낼 말이 애매할 때 문장 추천을 받을 수도 있어요.\n'
      + '혼자 고민하지 말고, 필요할 때 가볍게 불러보면 돼요.',
  },
  {
    key: 'tips',
    title: '소통을 더 편하게 쓰는 팁',
    description:
      '가족 채팅과 키노 채팅은 목적이 달라요.\n\n'
      + '가족 채팅은 “우리끼리 기록하고 공유하는 공간”, '
      + '키노 채팅은 “도움받고 정리하는 공간”으로 생각하면 편해요.\n'
      + '상황에 맞게 골라 쓰면 소통이 훨씬 매끄러워져요.',
  },
];

export default function ChatGuideModal({
  enabled = true,
  ready = true,
  forceVisible = false,
  storageKey = KEY_CHAT_GUIDE_SHOWN,
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
