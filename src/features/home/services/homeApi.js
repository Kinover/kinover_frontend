import {baseApi} from 'services/baseApi';

export const homeApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: build => ({
    getUser: build.query({
      query: () => ({
        url: '/user/userinfo',
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
      }),
      providesTags: ['User'],
    }),
    modifyUser: build.mutation({
      query: body => ({
        url: '/user/modify',
        method: 'POST',
        data: body,
        headers: {'Content-Type': 'application/json'},
      }),
      invalidatesTags: ['User', 'FamilyUser'],
    }),
    deleteUser: build.mutation({
      query: () => ({
        url: '/user/delete',
        method: 'DELETE',
      }),
      invalidatesTags: ['User', 'Family', 'FamilyUser'],
    }),
    getFamily: build.query({
      query: familyId => ({
        url: `/family/${familyId}`,
        method: 'POST',
        data: {},
        headers: {'Content-Type': 'application/json'},
      }),
      providesTags: (result, error, familyId) => [{type: 'Family', id: String(familyId)}],
    }),
    modifyFamily: build.mutation({
      query: body => ({
        url: '/family/modify',
        method: 'POST',
        data: body,
        headers: {'Content-Type': 'application/json'},
      }),
      invalidatesTags: ['Family'],
    }),
    getFamilyStatus: build.query({
      query: familyId => ({
        url: '/family/family-status',
        method: 'GET',
        params: {familyId},
      }),
      providesTags: (result, error, familyId) => [{type: 'FamilyStatus', id: String(familyId)}],
    }),
    joinFamily: build.mutation({
      query: familyId => ({
        url: `/family/join/${familyId}`,
        method: 'POST',
        data: null,
      }),
      invalidatesTags: ['Family', 'FamilyUser'],
    }),
    createFamilyAndJoin: build.mutation({
      query: () => ({
        url: '/family/create-and-join',
        method: 'POST',
        data: null,
        headers: {'Content-Type': 'application/json'},
      }),
      invalidatesTags: ['Family', 'FamilyUser'],
    }),
    createFamily: build.mutation({
      query: () => ({
        url: '/family/add',
        method: 'POST',
        data: null,
        headers: {'Content-Type': 'application/json'},
      }),
      invalidatesTags: ['Family'],
    }),
    getFamilyUsers: build.query({
      query: familyId => ({
        url: `/userFamily/familyUsers/${familyId}`,
        method: 'POST',
        data: {},
        headers: {'Content-Type': 'application/json'},
      }),
      providesTags: (result, error, familyId) => [{type: 'FamilyUser', id: String(familyId)}],
    }),
  }),
});

export const {
  useGetUserQuery,
  useModifyUserMutation,
  useDeleteUserMutation,
  useGetFamilyQuery,
  useLazyGetFamilyQuery,
  useModifyFamilyMutation,
  useGetFamilyStatusQuery,
  useJoinFamilyMutation,
  useCreateFamilyAndJoinMutation,
  useCreateFamilyMutation,
  useGetFamilyUsersQuery,
} = homeApi;
