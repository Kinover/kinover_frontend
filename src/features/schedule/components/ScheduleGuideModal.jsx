// src/features/schedule/components/ScheduleGuideModal.jsx
import React, {useMemo} from 'react';
import GuideModalCarousel from 'components/modal/GuideModal';
import useGuide from 'hooks/useGuide';

const KEY_SCHEDULE_GUIDE_SHOWN = '@kinover/guide/schedule_v1_shown';

const defaultSteps = [
  {
    key: 'month_view',
    title: '월별 일정을 한눈에 보기',
    description:
      '상단 달력은 “월별 보기” 모드로 한 달 전체 일정을 빠르게 훑어볼 수 있어요.\n\n'
      + '날짜마다 표시되는 점/색(또는 진하기)을 통해 '
      + '어느 날이 바쁜 날인지 미리 감 잡을 수 있어서 '
      + '가족 일정 조율이 훨씬 쉬워져요.',
  },
  {
    key: 'pick_date',
    title: '날짜를 눌러 그날 일정만 모아보기',
    description:
      '달력에서 원하는 날짜를 톡 눌러보세요.\n\n'
      + '선택한 날짜 기준으로 아래 일정 카드가 바로 바뀌면서 '
      + '그날에 등록된 일정만 깔끔하게 모아서 보여줘요.\n'
      + '오늘/내일 일정 확인할 때 특히 편해요.',
  },
  {
    key: 'add_schedule',
    title: '일정 추가는 버튼 한 번이면 끝',
    description:
      '오른쪽 아래의 “추가” 버튼을 누르면 새 일정을 만들 수 있어요.\n\n'
      + '가족 일정인지, 개인 일정인지 선택하고 '
      + '필요하면 참여 가족을 지정해서 공유할 수 있어요.\n'
      + '자주 쓰는 일정은 빠르게 추가해서 관리해보세요.',
  },
];

export default function ScheduleGuideModal({
  enabled = true,
  ready = true,
  forceVisible = false,
  storageKey = KEY_SCHEDULE_GUIDE_SHOWN,
  steps: stepsProp,
}) {
  const steps = useMemo(() => {
    if (Array.isArray(stepsProp) && stepsProp.length) return stepsProp;
    return defaultSteps;
  }, [stepsProp]);

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
      secondaryText="다시 보지 않기"
      onSecondaryPress={closeAndRemember}
      onRequestClose={closeAndRemember}
      onDone={closeAndRemember}
    />
  );
}
