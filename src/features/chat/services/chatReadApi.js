import {baseApi} from 'services/baseApi';

export const chatReadApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: build => ({
    getReadPointersSync: build.query({
      query: chatRoomId => ({
        url: `/chatRoom/${chatRoomId}/readPointers`,
        method: 'GET',
      }),
      providesTags: (result, error, chatRoomId) => [
        {type: 'ReadPointers', id: String(chatRoomId)},
      ],
    }),
    markReadRestSync: build.mutation({
      query: ({chatRoomId, lastReadAt}) => ({
        url: `/chatRoom/${chatRoomId}/read`,
        method: 'POST',
        data: {lastReadAt},
        headers: {'Content-Type': 'application/json'},
      }),
    }),
  }),
});

export const {useGetReadPointersSyncQuery, useMarkReadRestSyncMutation} =
  chatReadApi;
