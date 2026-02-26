// src/hooks/schedule/useScheduleEditor.js
import {useRef, useState, useCallback} from 'react';

const TYPE = {
  INDIVIDUAL: 'INDIVIDUAL',
  FAMILY: 'FAMILY',
  ANNIVERSARY: 'ANNIVERSARY',
};

// 어떤 입력이 와도 TYPE으로 정규화
const normalizeType = raw => {
  const t = String(raw ?? '').toUpperCase();

  const isAnniv =
    t === TYPE.ANNIVERSARY ||
    t.includes('ANNIV') ||
    t.includes('ANNIVERSARY') ||
    String(raw ?? '').toLowerCase().includes('기념');

  if (isAnniv) return TYPE.ANNIVERSARY;

  const isFamily =
    t === TYPE.FAMILY ||
    t.includes('FAMILY') ||
    String(raw ?? '').toLowerCase().includes('공동') ||
    t.includes('SHARED');

  if (isFamily) return TYPE.FAMILY;

  return TYPE.INDIVIDUAL;
};

export const useScheduleEditor = currentUserId => {
  const [editingSchedule, setEditingSchedule] = useState(null);

  const [selectedUserId, setSelectedUserId] = useState(null);

  const [title, setTitle] = useState('');
  const bottomSheetRef = useRef(null);

  const openSheet = useCallback(
    schedule => {
      const s = schedule || null;

 // 카드에서 확정해준 타입이 있으면 최우선
      const forced =
        s?.__forcedKind ?? s?.__forcedType ?? s?.forcedType ?? null;

      const rawType = forced ?? s?.type ?? s?.scheduleType ?? s?.kind ?? null;
      const finalType = normalizeType(rawType);

 // 편집용 schedule 객체를 "일관된 형태"로 보정
      const nextEditing =
        s == null
          ? null
          : {
              ...s,
 // 이후 로직이 type/scheduleType 어느 걸 보더라도 안정적으로
              type: finalType,
              scheduleType: finalType,
              __forcedKind: forced ?? finalType, // 디버깅/추적용
            };

      setEditingSchedule(nextEditing);
      setTitle(nextEditing?.title || '');

 // selectedUserId는 "조회/필터용"이라 타입별로 보정
 // - ANNIVERSARY: 의미 없으니 null (필요하면 familyId 기반 조회로)
 // - FAMILY: userId가 없을 수 있으니 null
 // - INDIVIDUAL: userId가 있으면 그걸, 없으면 currentUserId
      if (!nextEditing) {
        setSelectedUserId(null);
      } else if (finalType === TYPE.ANNIVERSARY) {
        setSelectedUserId(null);
      } else if (finalType === TYPE.FAMILY) {
        setSelectedUserId(null);
      } else {
        setSelectedUserId(nextEditing?.userId ?? currentUserId);
      }

 // setState 직후 같은 틱에 present() 호출하면 바텀시트가 아직 새 props로 리렌더되기 전에 열려서 2번 눌러야 뜨는 현상 발생 → 리렌더 커밋 후 present 호출
      setTimeout(() => {
        bottomSheetRef.current?.present?.();
      }, 0);
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

 // 취소도 타입별로 동일한 규칙 적용
    const rawType =
      editingSchedule?.__forcedKind ??
      editingSchedule?.type ??
      editingSchedule?.scheduleType ??
      editingSchedule?.kind ??
      null;

    const finalType = normalizeType(rawType);

    if (finalType === TYPE.INDIVIDUAL) {
      setSelectedUserId(editingSchedule.userId ?? null);
    } else {
      setSelectedUserId(null);
    }
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
