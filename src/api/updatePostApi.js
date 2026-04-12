// src/api/updatePostApi.jsx
import { apiClient } from 'utils/apiClient';
import {getToken} from '../utils/storage';

const toServerPostType = v => {
  const s = String(v || '').trim().toLowerCase();
  if (s.includes('video')) return 'video';
  return 'image';
};

const cleanUndefined = obj => {
  const out = {};
  Object.keys(obj || {}).forEach(k => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
};

/**
 * PATCH /api/posts/{postId}
 * body: { authorId, familyId?, content?, categoryId?, imageUrls?, postTypes? }
 */
export async function updatePostApi(postId, payload) {
  if (!postId) throw new Error('postId is required');
  if (!payload?.authorId) throw new Error('authorId is required');

  const token = await getToken();
  if (!token) throw new Error('token is missing');

  const raw = {
    authorId: payload.authorId,
    familyId: payload.familyId,
    content: payload.content,
    categoryId: payload.categoryId,
    imageUrls: payload.imageUrls,
    postTypes: payload.postTypes,
  };

  let body = cleanUndefined(raw);

 // postTypes 정규화
  if (body.postTypes !== undefined) {
    if (!Array.isArray(body.postTypes)) {
      throw new Error('postTypes must be an array');
    }
    body.postTypes = body.postTypes.map(toServerPostType);
  }

 // imageUrls/postTypes 둘 중 하나라도 있으면 둘 다 배열로 강제 + 길이 동일 체크
  const hasUrls = body.imageUrls !== undefined;
  const hasTypes = body.postTypes !== undefined;

  if (hasUrls || hasTypes) {
    if (!Array.isArray(body.imageUrls) || !Array.isArray(body.postTypes)) {
      throw new Error(
        'imageUrls and postTypes must be arrays (both required together)',
      );
    }
    if (body.imageUrls.length !== body.postTypes.length) {
      throw new Error('imageUrls and postTypes length must match');
    }
  }

  const apiUrl = `/posts/${postId}`;

  const res = await apiClient.patch(apiUrl, body, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return res.data;
}

export default updatePostApi;
