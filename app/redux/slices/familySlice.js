// familySlice.js
import { createSlice } from '@reduxjs/toolkit';

const relationshipMap = {
  "AWKWARD_START": "어색한 사이",
  "GETTING_TO_KNOW": "알아가는 사이",
  "GENTLE_APPROACH": "다가가는 사이",
  "COMFORTABLE_DISTANCE": "편안한 사이",
  "SHARING_HEARTS": "진심을 나누는 사이",
  "SOLID_BOND": "단단한 사이",
  "FAMILY_OF_TRUST": "믿음의 사이",
  "UNIFIED_HEARTS": "하나된 사이"
};


const relationshipMapKoreanToEnglish = {
    "어색한 사이": "AWKWARD_START",
    "알아가는 사이": "GETTING_TO_KNOW",
    "다가가는 사이": "GENTLE_APPROACH",
    "편안한 사이": "COMFORTABLE_DISTANCE",
    "진심을 나누는 사이": "SHARING_HEARTS",
    "단단한 사이": "SOLID_BOND",
    "믿음의 사이": "FAMILY_OF_TRUST",
    "하나된 사이": "UNIFIED_HEARTS"
  };
  

const initialFamilyState = {
  familyId: null,
  name: null,
  notice: null,
  createdAt: null,
  updatedAt: null,
  relationship: null,
  loading: false,
  error: null,
};

const familySlice = createSlice({
  name: 'family',
  initialState: initialFamilyState,
  reducers: {
    setFamily(state, action) {
      const { familyId, name, notice, relationship } = action.payload || {};
      state.familyId = familyId ?? state.familyId;
      state.name = name ?? state.name;
      state.notice = notice ?? state.notice;
      state.relationship = relationshipMap[relationship] || state.relationship;
    },
    setFamilyLoading(state, action) {
      state.loading = action.payload;
    },
    setFamilyError(state, action) {
      state.error = action.payload;
    },
    
  },
});

export const { setFamily, setFamilyLoading, setFamilyError } = familySlice.actions;
export default familySlice.reducer;
