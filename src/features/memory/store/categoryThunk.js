// src/features/memory/store/categoryThunk.js

import {createAsyncThunk} from '@reduxjs/toolkit';
import axios from 'axios';
import {getToken} from '../../../utils/storage';

const BASE_URL = 'https://kinover.shop/api';

/* ------------------ 1) 카테고리 목록 조회 API ------------------ */
const getCategoryApi = async familyId => {
  try {
    const token = await getToken();
    console.log('🔐 [GET] 토큰:', token);

    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const url = `${BASE_URL}/categories/${familyId}`;
    console.log('🌐 [GET] URL:', url);

    const res = await axios.get(url, {
      headers: {Authorization: `Bearer ${token}`},
    });

    console.log('✅ [GET] 카테고리 응답:', res.data);
    return res.data;
  } catch (e) {
    console.error(
      '❌ [GET] 카테고리 불러오기 실패:',
      e.response?.data || e.message,
    );
    throw e;
  }
};

/* ------------------ 2) 카테고리 생성 API ------------------ */
const createCategoryApi = async (title, familyId) => {
  try {
    const token = await getToken();
    console.log('🔐 [POST] 토큰:', token);
    console.log('📝 [POST] 카테고리 생성 요청 데이터:', {
      title,
      familyId,
    });

    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const url = `${BASE_URL}/categories`;
    const body = { title, familyId: familyId};

    console.log('🌐 [POST] URL:', url);
    console.log('📦 [POST] BODY:', body);

    const res = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ [POST] 카테고리 생성 성공:', res.data);
    // 예: { categoryId: '...', title: '...', familyId: '...' }
    return res.data;
  } catch (e) {
    console.error(
      '❌ [POST] 카테고리 생성 실패:',
      e.response?.data || e.message,
    );
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
      return rejectWithValue(e.response?.data || e.message);
    }
  },
);

/* ------------------ 4) 카테고리 생성 Thunk ------------------ */
export const createCategoryThunk = createAsyncThunk(
  'category/create',
  async ({title, familyId}, {rejectWithValue}) => {
    try {
      console.log('📥 [createCategoryThunk] 요청:', {
        title,
        familyId,
      });
      const newCategory = await createCategoryApi(title, familyId);
      console.log('📥 [createCategoryThunk] 응답 newCategory:', newCategory);
      return newCategory; // { categoryId, title, ... } 형태
    } catch (e) {
      const payload = {
        status: e.response?.status || 500,
        message: e.response?.data?.message || e.message,
      };
      console.log('❌ [createCategoryThunk] 에러:', payload);
      return rejectWithValue(payload);
    }
  },
);
