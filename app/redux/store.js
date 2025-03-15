import { configureStore } from "@reduxjs/toolkit";
import rootReducer from '../redux/reducers/rootReducer';

const store = configureStore({
  reducer: rootReducer, // 루트 리듀서를 설정
  // thunk는 기본으로 내장되어 있기 때문에 추가할 필요 없음
});

export default store;
