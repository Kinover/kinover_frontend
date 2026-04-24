// src/features/memory/store/categoryThunk.js
import {createAsyncThunk} from '@reduxjs/toolkit';
import {
  STORE_MOCK_ENABLED,
  getStoreMockCategories,
} from '../../home/utils/storeMockData';
import {memoryApi} from '../services/memoryApi';

export const fetchCategoryThunk = createAsyncThunk(
  'category/fetch',
  async (_, {rejectWithValue, dispatch}) => {
    try {

 // 스토어 목업: 여행 카테고리 포함 (부산 광안리 포스트용)
      if (STORE_MOCK_ENABLED) {
        return getStoreMockCategories();
      }

      const req = dispatch(
        memoryApi.endpoints.getCategories.initiate(undefined, {
          forceRefetch: true,
        }),
      );
      const data = await req.unwrap();
      req.unsubscribe();
      return data;
    } catch (e) {
      const payload = e?.response?.data?.message || e?.response?.data || e?.message;
      return rejectWithValue(payload);
    }
  },
);

export const createCategoryThunk = createAsyncThunk(
  'category/create',
  async ({title}, {rejectWithValue, dispatch}) => {
    try {
      const req = dispatch(memoryApi.endpoints.createCategory.initiate({title}));
      const newCategory = await req.unwrap();
      req.unsubscribe();
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
      return rejectWithValue(payload);
    }
  },
);
