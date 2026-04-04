// src/hooks/schedule/useScheduleListByDate.js
import {useEffect, useMemo} from 'react';
import {useSelector} from 'react-redux';
import {useGetSchedulesQuery} from '../services/scheduleApi';
import {normalizeScheduleListResponse} from '../utils/scheduleFilterHelpers';
import {selectFamilyId} from 'store/selectors';

export const useScheduleListByDate = (
  selectedDate,
  refreshTrigger,
  familyIdOverride,
) => {
  const reduxFamilyId = useSelector(selectFamilyId);
  const familyId = familyIdOverride ?? reduxFamilyId;

  const formatLocalYMD = d => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const selectedYMD = useMemo(
    () => (selectedDate ? formatLocalYMD(selectedDate) : ''),
    [selectedDate],
  );

  const {data: queriedScheduleListRaw, refetch} = useGetSchedulesQuery(
    {familyId, date: selectedYMD},
    {
      skip: !familyId || !selectedYMD,
    },
  );

  useEffect(() => {
    if (!familyId || !selectedYMD) return;
    if (refreshTrigger == null) return;
    refetch();
  }, [familyId, selectedYMD, refreshTrigger, refetch]);

 // ----------------------------
 // 더미 데이터 (UI 테스트용)
 // - scheduleList가 비어있을 때만 주입
 // - selectedYMD에 맞춰 날짜 일관성 유지
 // ----------------------------
  const dummyList = useMemo(() => {
    if (!selectedYMD) return [];

 // userId / userName / kind(type) 만 UI 확인에 충분
 // kind: 'personal' | 'shared' | 'anniversary'
    return [
      {
        scheduleId: `dummy-${selectedYMD}-1`,
        date: selectedYMD,
        kind: 'anniversary',
        title: '결혼기념일 💍',
        userId: null,
        userName: null,
        isAnniversary: true,
      },
      {
        scheduleId: `dummy-${selectedYMD}-2`,
        date: selectedYMD,
        kind: 'shared',
        title: '가족 외식 약속 🍽️',
        userId: null,
        userName: '함께',
        isShared: true,
      },
      {
        scheduleId: `dummy-${selectedYMD}-3`,
        date: selectedYMD,
        kind: 'personal',
        title: '병원 예약',
        userId: '101',
        userName: '지윤',
      },
      {
        scheduleId: `dummy-${selectedYMD}-4`,
        date: selectedYMD,
        kind: 'personal',
        title: 'PT 수업 🏋️‍♀️',
        userId: '102',
        userName: '아빠',
      },
    ];
  }, [selectedYMD]);

  const effectiveScheduleList = useMemo(() => {
    const base = normalizeScheduleListResponse(queriedScheduleListRaw);
 // 서버 데이터 있으면 서버 데이터 우선, 없으면 더미
 // return base.length > 0 ? base : dummyList;
    return base;

  }, [queriedScheduleListRaw, dummyList]);

 // ----------------------------
 // 타입 분류(백엔드 필드가 뭐든 최대한 흡수)
 // ----------------------------
  const getKind = item => {
    const raw =
      item?.kind ??
      item?.type ??
      item?.scheduleType ??
      item?.category ??
      item?.eventType ??
      null;

    const t = String(raw || '').toLowerCase();

    if (item?.isAnniversary === true) return 'anniversary';
    if (t.includes('anniv') || t.includes('기념') || t.includes('anniversary'))
      return 'anniversary';

    if (item?.isShared === true) return 'shared';
    if (item?.shared === true) return 'shared';
    if (item?.ownerType && String(item.ownerType).toLowerCase() === 'family')
      return 'shared';
    if (t.includes('shared') || t.includes('family') || t.includes('공동'))
      return 'shared';

    if (item?.userId == null) return 'shared';

    return 'personal';
  };

  const grouped = useMemo(() => {
    const base = Array.isArray(effectiveScheduleList)
      ? effectiveScheduleList
      : [];

    const personal = [];
    const shared = [];
    const anniversary = [];

    base.forEach(it => {
      const k = getKind(it);
      if (k === 'anniversary') anniversary.push(it);
      else if (k === 'shared') shared.push(it);
      else personal.push(it);
    });

    return {personal, shared, anniversary};
  }, [effectiveScheduleList]);

  return {
    scheduleList: effectiveScheduleList, // 이제 화면은 이걸 쓰면 더미까지 포함됨
    selectedYMD,
    ...grouped,
  };
};
