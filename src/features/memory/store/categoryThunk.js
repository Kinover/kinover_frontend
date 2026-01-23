// src/features/memory/store/categoryThunk.js
import {createAsyncThunk} from '@reduxjs/toolkit';
import {apiClient} from '../../../utils/apiClient';

// ✅ A안: 토큰 기반
const getCategoryApi = async () => {
  const url = '/categories'; // baseURL에 /api가 붙어있다는 전제
  // 만약 baseURL이 /api가 아니라면 '/api/categories'로 바꿔
  console.log('🌐 [GET] URL:', url);

  const res = await apiClient.get(url);
  return res.data;
};

const createCategoryApi = async title => {
  const url = '/categories';
  const body = {title};

  console.log('🌐 [POST] URL:', url, 'BODY:', body);

  const res = await apiClient.post(url, body, {
    headers: {'Content-Type': 'application/json'},
  });
  return res.data;
};

export const fetchCategoryThunk = createAsyncThunk(
  'category/fetch',
  async (_, {rejectWithValue}) => {
    try {
      console.log('📥 [fetchCategoryThunk] start');
      const data = await getCategoryApi();
      return data;
    } catch (e) {
      const payload =
        e?.response?.data?.message || e?.response?.data || e?.message;
      console.log('❌ [fetchCategoryThunk] error:', payload);
      return rejectWithValue(payload);
    }
  },
);

export const createCategoryThunk = createAsyncThunk(
  'category/create',
  async ({title}, {rejectWithValue}) => {
    try {
      console.log('📥 [createCategoryThunk] 요청:', {title});
      const newCategory = await createCategoryApi(title);
      return newCategory;
    } catch (e) {
      const payload = {
        status: e?.response?.status || 500,
        message:
          e?.response?.data?.message ||
          e?.response?.data ||
          e?.message ||
          '카테고리 생성 실패',
      };
      console.log('❌ [createCategoryThunk] error:', payload);
      return rejectWithValue(payload);
    }
  },
);
