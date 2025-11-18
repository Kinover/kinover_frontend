// src/hooks/schedule/useScheduleCrud.js
import {useCallback} from 'react';
import {useDispatch} from 'react-redux';

import { addScheduleThunk,updateScheduleThunk,deleteScheduleThunk } from '../store/scheduleThunk';

export const useScheduleCrud = ({
  familyId,
  year,
  month,
  formattedDate,
  selectedUserId,
  editingSchedule,
  bumpCount,
  setRefreshTrigger,
  closeSheet,
}) => {
  const dispatch = useDispatch();

  const onSubmit = useCallback(
    async finalTitle => {
      if (!finalTitle?.trim()) {return;}

      const payload = {
        title: finalTitle.trim(),
        date: formattedDate,
        personal: !!selectedUserId,
        userId: selectedUserId,
        familyId,
      };

      try {
        if (editingSchedule) {
          await dispatch(
            updateScheduleThunk(
              {...payload, scheduleId: editingSchedule.scheduleId},
              {
                familyId,
                date: formattedDate,
                year,
                month,
                userId: selectedUserId,
              },
            ),
          ).unwrap();
        } else {
          // 추가 시 낙관적 +1
          bumpCount(formattedDate, 1);
          await dispatch(
            addScheduleThunk(payload, {
              familyId,
              date: formattedDate,
              year,
              month,
              userId: selectedUserId,
            }),
          ).unwrap();
        }
      } finally {
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
      setRefreshTrigger,
      closeSheet,
      dispatch,
    ],
  );

  const handleDeleteSchedule = useCallback(async () => {
    if (!editingSchedule?.scheduleId) {return;}

    try {
      // 삭제 시 낙관적 -1
      bumpCount(editingSchedule.date ?? formattedDate, -1);
      await dispatch(
        deleteScheduleThunk(editingSchedule.scheduleId, {
          familyId,
          date: formattedDate,
          year,
          month,
          userId: selectedUserId,
        }),
      ).unwrap();
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
    setRefreshTrigger,
    closeSheet,
    dispatch,
  ]);

  return {
    onSubmit,
    handleDeleteSchedule,
  };
};
