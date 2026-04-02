import {baseApi} from 'services/baseApi';
import {USER} from 'config/apiEndpoints';

export const notificationApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: build => ({
    getNotifications: build.query({
      query: () => ({
        url: USER.notifications,
        method: 'GET',
      }),
      providesTags: ['Notification'],
    }),
    getHasUnread: build.query({
      query: () => ({
        url: USER.notificationsUnread,
        method: 'GET',
      }),
      providesTags: ['Notification'],
    }),
    getUnreadCount: build.query({
      query: () => ({
        url: USER.notificationsUnreadCount,
        method: 'GET',
      }),
      providesTags: ['Notification'],
    }),
    markNotificationsRead: build.mutation({
      query: () => ({
        url: USER.notificationsMarkRead,
        method: 'POST',
        data: {},
      }),
      invalidatesTags: ['Notification'],
    }),
    registerFcmToken: build.mutation({
      query: ({fcmToken, accessToken}) => ({
        url: '/fcm/register',
        method: 'POST',
        data: {fcmToken},
        headers: {
          ...(accessToken ? {Authorization: `Bearer ${accessToken}`} : {}),
          'Content-Type': 'application/json',
        },
      }),
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetHasUnreadQuery,
  useGetUnreadCountQuery,
  useMarkNotificationsReadMutation,
  useRegisterFcmTokenMutation,
} = notificationApi;
