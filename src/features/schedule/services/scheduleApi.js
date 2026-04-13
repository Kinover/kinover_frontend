import {baseApi} from 'services/baseApi';
import {SCHEDULES} from 'config/apiEndpoints';

export const scheduleApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: build => ({
    getSchedules: build.query({
      query: ({familyId, date, userId}) => ({
        url: SCHEDULES.get,
        method: 'POST',
        data: {familyId, date, ...(userId != null ? {userId} : {})},
        headers: {'Content-Type': 'application/json'},
      }),
      providesTags: (result, error, arg) => [
        {type: 'Schedule', id: `LIST_${arg?.familyId ?? 'NA'}_${arg?.date ?? 'NA'}_${arg?.userId ?? 'ALL'}`},
      ],
    }),
    addSchedule: build.mutation({
      query: body => ({
        url: SCHEDULES.add,
        method: 'POST',
        data: body,
        headers: {'Content-Type': 'application/json'},
      }),
      invalidatesTags: ['Schedule', 'ScheduleCount'],
    }),
    updateSchedule: build.mutation({
      query: body => ({
        url: SCHEDULES.modify,
        method: 'PUT',
        data: body,
        headers: {'Content-Type': 'application/json'},
      }),
      invalidatesTags: ['Schedule', 'ScheduleCount'],
    }),
    deleteSchedule: build.mutation({
      query: scheduleId => ({
        url: SCHEDULES.remove(scheduleId),
        method: 'DELETE',
      }),
      invalidatesTags: ['Schedule', 'ScheduleCount'],
    }),
    getScheduleCountPerDay: build.query({
      query: ({familyId, year, month, viewerUserId}) => {
        const params = {familyId, year, month};
        const v = Number(viewerUserId);
        if (Number.isFinite(v)) {
          params.viewerUserId = v;
        }
        return {
          url: SCHEDULES.countPerDay,
          method: 'GET',
          params,
        };
      },
      providesTags: (result, error, arg) => [
        {
          type: 'ScheduleCount',
          id: `${arg?.familyId ?? 'NA'}_${arg?.year ?? 'NA'}_${arg?.month ?? 'NA'}_${
            arg?.viewerUserId != null && Number.isFinite(Number(arg.viewerUserId))
              ? Number(arg.viewerUserId)
              : 'guest'
          }`,
        },
      ],
    }),
  }),
});

export const {
  useGetSchedulesQuery,
  useLazyGetSchedulesQuery,
  useAddScheduleMutation,
  useUpdateScheduleMutation,
  useDeleteScheduleMutation,
  useGetScheduleCountPerDayQuery,
  useLazyGetScheduleCountPerDayQuery,
} = scheduleApi;
