// src/features/memory/store/categoryThunk.js

import {createAsyncThunk} from '@reduxjs/toolkit';
import {apiClient} from '../../../utils/apiClient';

/* ------------------ 1) 카테고리 목록 조회 API ------------------ */
/**
 * GET /api/categories/{familyId}
 */
const getCategoryApi = async familyId => {
  try {
    const url = `/categories/${familyId}`;
    console.log('🌐 [GET] URL:', url);

    const res = await apiClient.get(url);

    console.log('✅ [GET] 카테고리 응답:', res.data);
    return res.data;
  } catch (e) {
    const msg =
      e?.response?.data?.message ||
      e?.response?.data ||
      e?.message ||
      '카테고리 불러오기 실패';

    console.error('❌ [GET] 카테고리 불러오기 실패:', msg);
    throw e;
  }
};

/* ------------------ 2) 카테고리 생성 API ------------------ */
/**
 * POST /api/categories
 * body: { title, familyId }
 */
const createCategoryApi = async (title, familyId) => {
  try {
    console.log('📝 [POST] 카테고리 생성 요청 데이터:', {title, familyId});

    const url = '/categories';
    const body = {title, familyId};

    console.log('🌐 [POST] URL:', url);
    console.log('📦 [POST] BODY:', body);

    const res = await apiClient.post(url, body, {
      headers: {'Content-Type': 'application/json'},
    });

    console.log('✅ [POST] 카테고리 생성 성공:', res.data);
    return res.data; // 예: { categoryId: '...', title: '...', familyId: '...' }
  } catch (e) {
    const msg =
      e?.response?.data?.message ||
      e?.response?.data ||
      e?.message ||
      '카테고리 생성 실패';

    console.error('❌ [POST] 카테고리 생성 실패:', msg);
    throw e;
  }
};

/* ------------------ 3) 카테고리 목록 조회 Thunk ------------------ */
export const fetchCategoryThunk = createAsyncThunk(
  'category/fetch',
  async (familyId, {rejectWithValue}) => {
    try {
      console.log('📥 [fetchCategoryThunk] familyId:', familyId);
      const data = await getCategoryApi(familyId);
      return data;
    } catch (e) {
      return rejectWithValue(
        e?.response?.data?.message || e?.response?.data || e?.message,
      );
    }
  },
);

/* ------------------ 4) 카테고리 생성 Thunk ------------------ */
export const createCategoryThunk = createAsyncThunk(
  'category/create',
  async ({title, familyId}, {rejectWithValue}) => {
    try {
      console.log('📥 [createCategoryThunk] 요청:', {title, familyId});

      const newCategory = await createCategoryApi(title, familyId);

      console.log('📥 [createCategoryThunk] 응답 newCategory:', newCategory);
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

      console.log('❌ [createCategoryThunk] 에러:', payload);
      return rejectWithValue(payload);
    }
  },
);
