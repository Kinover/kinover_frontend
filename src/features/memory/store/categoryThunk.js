// src/features/memory/store/categoryThunk.js
import {createAsyncThunk} from '@reduxjs/toolkit';
import {apiClient} from 'utils/apiClient';
import {CATEGORIES} from 'config/apiEndpoints';
import {getGuestMode} from 'utils/storage'; // 추가
import {STORE_MOCK_ENABLED} from '../../home/utils/storeMockData';

// =======================
// Guest Dummy
// =======================
const GUEST_CATEGORY_ID_ALL = 'GUEST_ALL';
const makeGuestCategories = () => [
 // 네 UI가 "전체"를 따로 만들 수도 있어서, 여기서는 실제로는 2~3개만 주는 게 안전
  {categoryId: 'GUEST_CAT_1', title: '일상'},
  {categoryId: 'GUEST_CAT_2', title: '기념일'},
  {categoryId: 'GUEST_CAT_3', title: '기록'},
];

// A안: 토큰 기반
const getCategoryApi = async () => {
  const res = await apiClient.get(CATEGORIES.list);
  return res.data;
};

const createCategoryApi = async title => {
  const body = {title};
  const res = await apiClient.post(CATEGORIES.create, body, {
    headers: {'Content-Type': 'application/json'},
  });
  return res.data;
};

export const fetchCategoryThunk = createAsyncThunk(
  'category/fetch',
  async (_, {rejectWithValue}) => {
    try {
      console.log('📥 [fetchCategoryThunk] start');

 // 스토어 목업: 여행 카테고리 포함 (부산 광안리 포스트용)
      if (STORE_MOCK_ENABLED) {
        return [
          {categoryId: 'mock-cat-travel', title: '여행'},
          {categoryId: 'mock-cat-daily', title: '일상'},
        ];
      }
 // 게스트면 서버 호출 X, 더미 반환
      const isGuest = await getGuestMode();
      if (isGuest) {
        const dummy = makeGuestCategories();
        console.log('🟡 [GUEST] fetchCategoryThunk: server skipped', dummy);
        return dummy;
      }

      const data = await getCategoryApi();
      return data;
    } catch (e) {
      const payload = e?.response?.data?.message || e?.response?.data || e?.message;
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

 // 게스트면 서버 호출 X, "생성된 척" 더미 반환
      const isGuest = await getGuestMode();
      if (isGuest) {
        const newCategory = {
          categoryId: `GUEST_CAT_${Date.now()}`,
          title: title ?? '새 카테고리',
        };
        console.log('🟡 [GUEST] createCategoryThunk: server skipped', newCategory);
        return newCategory;
      }

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
