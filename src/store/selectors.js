/**
 * @fileoverview 전역 스토어 셀렉터
 * 여러 feature에서 공통으로 쓰는 state 선택자
 */

export const selectFamilyId = state => state.family?.familyId ?? null;
