// src/hooks/schedule/useScheduleListByDate.js
import {useEffect, useMemo} from 'react';
import {useSelector} from 'react-redux';
import {useGetSchedulesQuery} from '../services/scheduleApi';
import {normalizeScheduleListResponse} from '../utils/scheduleFilterHelpers';
import {selectFamilyId} from 'store/selectors';
import {
  STORE_MOCK_ENABLED,
  getStoreMockScheduleList,
} from '../../home/utils/storeMockData';

export const useScheduleListByDate = (
  selectedDate,
  refreshTrigger,
  familyIdOverride,
) => {
  const reduxFamilyId = useSelector(selectFamilyId);
  const familyId = familyIdOverride ?? reduxFamilyId;
  const blockedIds = useSelector(s => s.blockedUsers?.ids ?? []);
  const blockedSet = useMemo(
    () => new Set(blockedIds.map(Number).filter(Number.isFinite)),
    [blockedIds],
  );

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
      skip: !familyId || !selectedYMD || STORE_MOCK_ENABLED,
    },
  );

  useEffect(() => {
    if (STORE_MOCK_ENABLED) return;
    if (!familyId || !selectedYMD) return;
    if (refreshTrigger == null) return;
    refetch();
  }, [familyId, selectedYMD, refreshTrigger, refetch]);

  const effectiveScheduleList = useMemo(() => {
    const base = STORE_MOCK_ENABLED
      ? getStoreMockScheduleList(selectedYMD)
      : normalizeScheduleListResponse(queriedScheduleListRaw);
    if (!blockedSet.size) return base;
    return base.filter(it => {
      const uid = it?.userId;
      const n = Number(uid);
      if (Number.isFinite(n) && blockedSet.has(n)) return false;
      const parts = it?.participantIds;
      if (!Array.isArray(parts) || parts.length === 0) return true;
      const nums = parts.map(Number).filter(Number.isFinite);
      if (nums.length === 0) return true;
      return !nums.every(id => blockedSet.has(id));
    });
  }, [queriedScheduleListRaw, blockedSet, selectedYMD]);

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
    scheduleList: effectiveScheduleList,
    selectedYMD,
    ...grouped,
  };
};
