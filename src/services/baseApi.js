// src/services/baseApi.js
// RTK Query 기반 API 인프라
// - axiosBaseQuery: 기존 apiClient 래핑 (토큰 주입·401 처리·게스트 모드는 apiClient 인터셉터가 담당)
// - 각 feature API는 baseApi.injectEndpoints()로 확장

import {createApi} from '@reduxjs/toolkit/query/react';
import {apiClient} from 'utils/apiClient';

/**
 * RTK Query 전용 baseQuery
 * apiClient(axios) 인터셉터가 이미 처리하는 것:
 *   - Authorization 헤더 주입
 *   - 게스트 모드 차단 (isGuestBlocked)
 *   - 401 → 자동 로그아웃
 *   - 공통 에러 Alert
 */

const axiosBaseQuery = async ({
  url,
  method = 'GET',
  data,
  params,
  headers,
} = {}) => {
  try {
    const result = await apiClient({url, method, data, params, headers});
    return {data: result.data};
  } catch (err) {
    // 게스트 모드: RTK Query 에러 없이 빈 데이터 반환 (UI는 빈 상태로 표시)
    if (err?.isGuestBlocked) {
      return {data: null};
    }
    return {
      error: {
        status: err?.response?.status,
        data: err?.response?.data || err?.message || '알 수 없는 오류',
      },
    };
  }
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery,
  // 🏷️ 자동 새로고침(캐시 무효화)을 위한 '꼬리표(Tags)'들의 전체 명단

  tagTypes: [
    'ChatRoom',
    'ChatRoomUsers',
    'Messages',
    'ChatRoomMedia',
    'ReadPointers',
    'User',
    'Family',
    'FamilyUser',
    'FamilyStatus',
    'Notification',
    'Schedule',
    'ScheduleCount',
    'Memory',
    'Category',
    'Comment',
    'Auth',
    'BlockedUsers',
  ],
  endpoints: () => ({}),
});
