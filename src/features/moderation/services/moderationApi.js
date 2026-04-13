import {baseApi} from 'services/baseApi';
import {MODERATION} from 'config/apiEndpoints';
import {normalizeBlockedUserIdsFromApiResponse} from '../utils/normalizeBlockedUserIdsResponse';

export const moderationApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: build => ({
    /**
     * 차단 ID 목록 — GET /api/blocks, Bearer 필수. 응답은 number[] 만.
     * 신고(자동 차단)·POST/DELETE blocks 직후 재호출 시 목록이 곧바로 일치한다고 가정.
     * queryArg는 RTK 캐시 키(계정) 분리용.
     */
    getBlockedUsers: build.query({
      query: () => ({
        url: MODERATION.blocks,
        method: 'GET',
      }),
      serializeQueryArgs: ({queryArgs}) =>
        `getBlockedUsers:${queryArgs == null ? '' : String(queryArgs)}`,
      providesTags: ['BlockedUsers'],
      transformResponse: response =>
        normalizeBlockedUserIdsFromApiResponse(response),
    }),
    createReport: build.mutation({
      query: body => ({
        url: MODERATION.reports,
        method: 'POST',
        data: body,
        headers: {'Content-Type': 'application/json'},
      }),
      invalidatesTags: [
        'Memory',
        'Comment',
        'Messages',
        'ChatRoom',
        'Schedule',
        'ScheduleCount',
        'BlockedUsers',
      ],
    }),
    blockUser: build.mutation({
      query: blockedUserId => {
        const id = Number(blockedUserId);
        return {
          url: MODERATION.blocks,
          method: 'POST',
          data: {blockedUserId: id},
          headers: {'Content-Type': 'application/json'},
        };
      },
      invalidatesTags: [
        'User',
        'FamilyUser',
        'Memory',
        'Comment',
        'Messages',
        'Schedule',
        'ScheduleCount',
        'BlockedUsers',
      ],
    }),
    unblockUser: build.mutation({
      query: blockedUserId => ({
        url: MODERATION.blockOne(blockedUserId),
        method: 'DELETE',
      }),
      invalidatesTags: [
        'User',
        'FamilyUser',
        'Memory',
        'Comment',
        'Messages',
        'Schedule',
        'ScheduleCount',
        'BlockedUsers',
      ],
    }),
  }),
});

export const {
  useGetBlockedUsersQuery,
  useLazyGetBlockedUsersQuery,
  useCreateReportMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
} = moderationApi;
