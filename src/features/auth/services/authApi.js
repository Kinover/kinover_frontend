import {baseApi} from 'services/baseApi';

export const authApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: build => ({
    loginKakao: build.mutation({
      query: requestBody => ({
        url: '/login/kakao',
        method: 'POST',
        data: requestBody,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }),
      invalidatesTags: ['Auth', 'User', 'Family', 'FamilyUser'],
    }),
    loginApple: build.mutation({
      query: ({identityToken}) => ({
        url: '/login/apple',
        method: 'POST',
        data: {identityToken},
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }),
      invalidatesTags: ['Auth', 'User', 'Family', 'FamilyUser'],
    }),
    verifyPhone: build.mutation({
      query: ({idToken}) => ({
        url: '/auth/phone/verify',
        method: 'POST',
        data: {idToken},
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginKakaoMutation,
  useLoginAppleMutation,
  useVerifyPhoneMutation,
} = authApi;
