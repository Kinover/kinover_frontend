// src/hooks/schedule/useScheduleEditor.js
import {useRef, useState, useCallback} from 'react';

export const useScheduleEditor = currentUserId => {
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [title, setTitle] = useState('');

  const bottomSheetRef = useRef(null);

  const openSheet = useCallback(
    schedule => {
      setEditingSchedule(schedule || null);
      setTitle(schedule?.title || '');
      setSelectedUserId(schedule?.userId ?? currentUserId);
      bottomSheetRef.current?.present?.();
    },
    [currentUserId],
  );

  const closeSheet = useCallback(() => {
    setEditingSchedule(null);
    setTitle('');
    setSelectedUserId(null);
    bottomSheetRef.current?.dismiss?.();
  }, []);

  const handleCancelEdit = useCallback(() => {
    if (!editingSchedule) return;
    setTitle(editingSchedule.title);
    setSelectedUserId(editingSchedule.userId ?? null);
  }, [editingSchedule]);

  return {
    editingSchedule,
    setEditingSchedule,
    selectedUserId,
    setSelectedUserId,
    title,
    setTitle,
    bottomSheetRef,
    openSheet,
    closeSheet,
    handleCancelEdit,
  };
};
