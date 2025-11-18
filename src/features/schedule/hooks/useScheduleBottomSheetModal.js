// src/hooks/schedule/useScheduleBottomSheetModal.js
import {useMemo, useRef, useState, useEffect, useCallback} from 'react';

export const useScheduleBottomSheetModal = ({
  editingSchedule,
  title,
  setTitle,
  onSubmit,
  onDelete,
  onRefresh,
}) => {
  const modalRef = useRef(null);
  const snapPoints = useMemo(() => ['55%', '80%'], []);

  const scheduleRef = useRef(title ?? '');
  const [inputKey, setInputKey] = useState(0);

  // editingSchedule or title 변경 시 Ref, key 리셋
  useEffect(() => {
    scheduleRef.current = title ?? '';
    setInputKey(k => k + 1);
  }, [editingSchedule, title]);

  const handleSave = useCallback(async () => {
    const final = scheduleRef.current?.trim();
    if (!final) return;
    setTitle(final);
    await onSubmit(final);
    await onRefresh?.();
    modalRef.current?.dismiss();
  }, [onSubmit, onRefresh, setTitle]);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    await onDelete();
    await onRefresh?.();
    modalRef.current?.dismiss();
  }, [onDelete, onRefresh]);

  const canSave = (scheduleRef.current?.trim().length ?? 0) > 0;

  return {
    modalRef,
    snapPoints,
    scheduleRef,
    inputKey,
    handleSave,
    handleDelete,
    canSave,
  };
};
