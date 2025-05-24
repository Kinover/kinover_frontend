import {createAsyncThunk} from '@reduxjs/toolkit';
import axios from 'axios';
import {getToken} from '../../utils/storage';

// ✅ 카테고리 불러오기 API 함수
const getCategoryApi = async familyId => {
  try {
    const token = await getToken();
    console.log('🔐 [GET] 토큰:', token);

    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const url = `https://kinover.shop/api/categories/${familyId}`;
    console.log('🌐 [GET] 요청 URL:', url);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ [GET] 카테고리 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      '❌ [GET] 카테고리 불러오기 실패:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

// ✅ 카테고리 생성 API 함수
const createCategory = async (title, familyId) => {
  try {
    const token = await getToken();
    console.log('🔐 [POST] 토큰:', token);
    console.log('타이틀', title, '가족아이디', familyId);

    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const url = 'http://kinover.shop/api/categories';
    const body = {
      title,
      familyId,
    };

    console.log('🌐 [POST] 요청 URL:', url);
    console.log('📦 [POST] 요청 바디:', body);

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ [POST] 카테고리 생성 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      '❌ [POST] 카테고리 생성 실패:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

// ✅ 카테고리 리스트 불러오기 Thunk
export const fetchCategoryThunk = createAsyncThunk(
  'category/fetch',
  async (familyId, {rejectWithValue}) => {
    try {
      const data = await getCategoryApi(familyId);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// ✅ 카테고리 생성 Thunk
export const createCategoryThunk = createAsyncThunk(
  'category/create',
  async ({title, familyId}, {rejectWithValue}) => {
    try {
      const data = await createCategory(title, familyId);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);
