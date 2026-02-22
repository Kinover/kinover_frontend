// src/features/schedule/components/ScheduleGuideModal.jsx
import React, {useMemo} from 'react';
import GuideModalCarousel from 'components/modal/GuideModal';
import useGuide from 'hooks/useGuide';

const KEY_SCHEDULE_GUIDE_SHOWN = '@kinover/guide/schedule_v1_shown';

/** 행동 유도형: 이 화면에서 뭘 누르면 되는지 안내 */
const defaultSteps = [
  {
    key: 'pick_date',
    title: '일정',
    description: '**날짜를 누르면** 그날 일정만 보여요.\n**오른쪽 아래 추가 버튼**으로 새 일정을 만드세요.',
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
      onRequestClose={closeAndRemember}
      onDone={closeAndRemember}
    />
  );
}
