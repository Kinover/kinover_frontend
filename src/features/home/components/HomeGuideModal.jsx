// src/features/home/components/HomeGuideModal.jsx
import React, {useCallback} from 'react';
import GuideModalCarousel from 'components/modal/GuideModal';
import useGuide from 'hooks/useGuide';

const KEY_HOME_GUIDE_SHOWN = '@kinover/guide/home_v2_shown';

const steps = [
  {
    key: 'family_status',
    title: '가족의 현재 상태를 한눈에',
    description:
      '홈 화면에서는 가족 구성원들의 현재 상태를 한눈에 확인할 수 있어요.\n\n' +
      '지금 누가 앱에 접속해 있는지, ' +
      '잠시 자리를 비운 상태인지도 바로 알 수 있어서 ' +
      '가족과 소통하기에 훨씬 편해져요.',
  },
  {
    key: 'family_edit',
    title: '가족 프로필 자유롭게 수정하기',
    description:
      '가족 구성원의 프로필을 길게 누르면 ' +
      '별명이나 특징을 자유롭게 수정할 수 있어요.\n\n' +
      '우리 가족만 아는 별명이나, ' +
      '그 사람을 잘 표현하는 한마디를 적어두면 ' +
      '앱을 사용할 때 더 친근하게 느껴질 거예요.',
  },
  {
    key: 'my_mood',
    title: '지금 내 기분을 표현해보세요',
    description:
      '상단의 이모티콘 버튼을 눌러 ' +
      '지금 내 감정 상태를 간단하게 설정할 수 있어요.\n\n' +
      '말로 설명하지 않아도, ' +
      '가족들이 자연스럽게 내 상태를 이해할 수 있도록 도와줘요.',
  },
  {
    key: 'family_invite',
    title: '가족 초대는 아주 간단하게',
    description:
      '가족 초대 버튼을 눌러 ' +
      '초대 코드를 복사하거나 공유할 수 있어요.\n\n' +
      '링크를 전달하면 ' +
      '가족이 바로 키노버에 들어와 함께 사용할 수 있어요.',
  },
];

export default function HomeGuideModal({
  enabled = true,
  ready = true,
  forceVisible = false,
  storageKey = KEY_HOME_GUIDE_SHOWN,
  onDone, // ✅ HomeScreen 후처리 알럿
}) {
  const {visible, closeAndRemember} = useGuide(
    storageKey,
    enabled && ready,
    {forceVisible},
  );

  const handleDone = useCallback(async () => {
    await closeAndRemember();
    onDone?.();
  }, [closeAndRemember, onDone]);

  if (!enabled) return null;

  return (
    <GuideModalCarousel
      visible={visible}
      steps={steps}
      onRequestClose={handleDone}
      onDone={handleDone}
    />
  );
}
