// src/features/schedule/hooks/useScheduleBottomSheetModal.js
import { useRef, useState, useEffect, useCallback} from 'react';

export const useScheduleBottomSheetModal = ({
  editingSchedule,
  title,
  setTitle,
  onSubmit,
  onDelete,
  onRefresh,

  // ✅ 추가
  scheduleType, // 'INDIVIDUAL' | 'FAMILY' | 'ANNIVERSARY'
  participantIds, // number[] | undefined
  basePayload, // { familyId, date, memo?, scheduleId? }
}) => {
  const modalRef = useRef(null);

  // (참고) 너는 BottomSheetLayout에서 dynamicSnap 쓰니까 snapPoints는 여기서 안 써도 됨
  const scheduleRef = useRef(title ?? '');
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => {
    scheduleRef.current = title ?? '';
    setInputKey(k => k + 1);
  }, [editingSchedule, title]);

  const buildPayload = useCallback(() => {
    const finalTitle = scheduleRef.current?.trim();
    if (!finalTitle) return null;

    return {
      ...(basePayload ?? {}),
      title: finalTitle,
      type: scheduleType, // ✅ ScheduleScreen이 payload.type을 봄
      ...(participantIds !== undefined ? {participantIds} : {}),
    };
  }, [basePayload, scheduleType, participantIds]);

  const handleSave = useCallback(async () => {
    const payload = buildPayload();
    if (!payload) return;

    setTitle(payload.title);

    // ✅ 여기서 문자열이 아니라 객체로 보냄
    await onSubmit(payload);

    await onRefresh?.();
    modalRef.current?.dismiss();
  }, [buildPayload, onSubmit, onRefresh, setTitle]);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    await onDelete();
    await onRefresh?.();
    modalRef.current?.dismiss();
  }, [onDelete, onRefresh]);

  const canSave = (scheduleRef.current?.trim().length ?? 0) > 0;

  return {
    modalRef,
    scheduleRef,
    inputKey,
    handleSave,
    handleDelete,
    canSave,
  };
};
