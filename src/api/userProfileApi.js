import {apiClient} from 'utils/apiClient';

/**
 * 약관·마케팅 동의 등 프로필(백엔드 UpdateProfileRequest) 갱신.
 * POST /user/modify는 marketing_agreed 등을 저장하지 않으므로 PATCH /user/profile 사용.
 */
export async function updateUserProfile(payload) {
  try {
    const res = await apiClient.patch('/user/profile', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return res.data;
  } catch (err) {
    throw err;
  }
}
