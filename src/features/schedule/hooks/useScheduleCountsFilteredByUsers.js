import {useEffect, useMemo, useState} from 'react';
import appStore from 'store';
import {scheduleApi} from '../services/scheduleApi';
import {scheduleItemMatchesViewFilter} from '../utils/scheduleFilterHelpers';

const pad2 = n => String(n).padStart(2, '0');

function getYmdListForMonth(year, month) {
  const last = new Date(year, month, 0).getDate();
  const list = [];
  for (let d = 1; d <= last; d++) {
    list.push(`${year}-${pad2(month)}-${pad2(d)}`);
  }
  return list;
}

async function fetchSchedulesForFamilyAndDateApi(familyId, date) {
  const req = appStore.dispatch(
    scheduleApi.endpoints.getSchedules.initiate(
      {familyId, date},
      {forceRefetch: true},
    ),
  );
  try {
    return await req.unwrap();
  } finally {
    req.unsubscribe();
  }
}

/**
 * 사람 필터가 켜진 달: 해당 월의 각 날짜 일정을 조회해 필터에 맞는 날짜별 개수 맵 생성.
 * 필터가 없으면 baseCountPerDay 그대로 사용.
 */
export function useScheduleCountsFilteredByUsers({
  familyId,
  year,
  month,
  baseCountPerDay,
  filterUserIds,
  refreshTrigger,
}) {
  const [filteredMap, setFilteredMap] = useState(null);
  const [loadingFiltered, setLoadingFiltered] = useState(false);

  const filterKey = useMemo(() => {
    if (!filterUserIds?.length) return '';
    return [...filterUserIds].map(String).sort().join(',');
  }, [filterUserIds]);

  useEffect(() => {
    if (!familyId || !filterUserIds?.length) {
      setFilteredMap(null);
      setLoadingFiltered(false);
      return;
    }

    let cancelled = false;
    setLoadingFiltered(true);
    const ymList = getYmdListForMonth(year, month);

    (async () => {
      try {
        const pairs = await Promise.all(
          ymList.map(async ymd => {
            const list = await fetchSchedulesForFamilyAndDateApi(familyId, ymd);
            const arr = Array.isArray(list) ? list : [];
            const n = arr.filter(it =>
              scheduleItemMatchesViewFilter(it, filterUserIds),
            ).length;
            return [ymd, n];
          }),
        );
        if (cancelled) return;
        const next = {};
        pairs.forEach(([ymd, n]) => {
          if (n > 0) next[ymd] = n;
        });
        setFilteredMap(next);
      } catch {
        if (!cancelled) setFilteredMap(null);
      } finally {
        if (!cancelled) setLoadingFiltered(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [familyId, year, month, filterKey, refreshTrigger]);

  const scheduleCountPerDay = useMemo(() => {
    if (!filterUserIds?.length) return baseCountPerDay;
    return filteredMap ?? {};
  }, [filterUserIds, baseCountPerDay, filteredMap]);

  return {scheduleCountPerDay, loadingFiltered};
}
