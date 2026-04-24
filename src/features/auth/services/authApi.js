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
      query: body => {
        const {identityToken, email, familyName, givenName, birth} = body || {};
        const data = {identityToken};
        if (typeof email === 'string' && email.trim()) {
          data.email = email.trim();
        }
        if (typeof familyName === 'string' && familyName.trim()) {
          data.familyName = familyName.trim();
        }
        if (typeof givenName === 'string' && givenName.trim()) {
          data.givenName = givenName.trim();
        }
        if (typeof birth === 'string' && birth.trim()) {
          data.birth = birth.trim();
        }
        return {
          url: '/login/apple',
          method: 'POST',
          data,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        };
      },
      invalidatesTags: ['Auth', 'User', 'Family', 'FamilyUser'],
    }),
    verifyPhone: build.mutation({
      query: payload => ({
        url: '/auth/phone/verify',
        method: 'POST',
        data: payload,
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
