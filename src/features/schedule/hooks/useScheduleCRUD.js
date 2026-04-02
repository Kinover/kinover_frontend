// src/hooks/schedule/useScheduleCrud.js
import {useCallback} from 'react';
import {
  useAddScheduleMutation,
  useDeleteScheduleMutation,
  useUpdateScheduleMutation,
} from '../services/scheduleApi';

export const useScheduleCrud = ({
  familyId,
  year,
  month,
  formattedDate,    // 화면/서버용 날짜 문자열
  selectedUserId,
  editingSchedule,
  bumpCount,        // 날짜별 일정 개수 낙관적 업데이트
  setRefreshTrigger,
  closeSheet,
  selectedDateKey,  // "YYYY-MM-DD" 포맷 (달력 key랑 동일)
}) => {
  const [addSchedule] = useAddScheduleMutation();
  const [updateSchedule] = useUpdateScheduleMutation();
  const [deleteSchedule] = useDeleteScheduleMutation();

  const onSubmit = useCallback(
    async finalTitle => {
      if (!finalTitle?.trim()) return;

      const payload = {
        title: finalTitle.trim(),
        date: formattedDate,       // 서버에서 쓰는 날짜 포맷 (기존 그대로)
        personal: !!selectedUserId,
        userId: selectedUserId,
        familyId,
      };

      try {
        if (editingSchedule) {
          await updateSchedule({
            ...payload,
            scheduleId: editingSchedule.scheduleId,
          }).unwrap();

 // 수정은 보통 같은 날짜 안에서 내용만 바꾸니까
 // 날짜가 바뀌지 않는 한 bumpCount 필요 없음
 // (날짜 이동 기능 넣으면 oldKey/newKey 비교해서 -1/+1 해주면 됨)
        } else {
          bumpCount(selectedDateKey, 1);

          await addSchedule(payload).unwrap();
        }
      } finally {
 // 서버 데이터도 다시 불러와서 정합성 맞추기
        setRefreshTrigger(prev => prev + 1);
        closeSheet();
      }
    },
    [
      familyId,
      year,
      month,
      formattedDate,
      selectedUserId,
      editingSchedule,
      bumpCount,
      selectedDateKey,
      setRefreshTrigger,
      closeSheet,
      addSchedule,
      updateSchedule,
    ],
  );

  const handleDeleteSchedule = useCallback(async () => {
    if (!editingSchedule?.scheduleId) return;

    try {
 // 삭제되는 일정의 날짜 key 결정
 // editingSchedule.date가 "YYYY-MM-DD"라면 그걸 우선 사용
      const deleteKey =
        editingSchedule.date && editingSchedule.date.includes('-')
          ? editingSchedule.date
          : selectedDateKey;

 // 낙관적 -1 (달력 색 바로 반영)
      bumpCount(deleteKey, -1);

      await deleteSchedule(editingSchedule.scheduleId).unwrap();
    } finally {
      setRefreshTrigger(prev => prev + 1);
      closeSheet();
    }
  }, [
    editingSchedule,
    formattedDate,
    familyId,
    year,
    month,
    selectedUserId,
    bumpCount,
    selectedDateKey,
    setRefreshTrigger,
    closeSheet,
    deleteSchedule,
  ]);

  return {
    onSubmit,
    handleDeleteSchedule,
  };
};
