/**
 * @fileoverview 날짜/시간 포맷팅 유틸리티
 * 
 * 상대 시간 표시를 위한 한국어 포맷팅 함수를 제공합니다.
 */

// ==================== Constants ====================

const TIME_UNITS = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
  MONTH: 2592000, // 약 30일
  YEAR: 31536000, // 약 365일
};

// ==================== Public API ====================

/**
 * ISO 형식의 날짜를 한국어 상대 시간 문자열로 변환
 * 
 * @param {string|Date} isoLike - ISO 형식 날짜 문자열 또는 Date 객체
 * @returns {string} 상대 시간 문자열 (예: '방금 전', '5분 전', '어제', '2주 전')
 * 
 * @example
 * formatRelativeKorean('2025-08-28T16:08:03');
 * // => '5분 전'
 * 
 * formatRelativeKorean(new Date());
 * // => '방금 전'
 */
export function formatRelativeKorean(isoLike) {
  const t = new Date(isoLike).getTime();
  if (Number.isNaN(t)) {
    return '시간 정보 없음';
  }

  const now = Date.now();
  const diffSeconds = Math.max(0, Math.floor((now - t) / 1000));

  // 방금 전 (5초 미만)
  if (diffSeconds < 5) {
    return '방금 전';
  }

  // 초 단위
  if (diffSeconds < TIME_UNITS.MINUTE) {
    return `${diffSeconds}초 전`;
  }

  // 분 단위
  const minutes = Math.floor(diffSeconds / TIME_UNITS.MINUTE);
  if (minutes < 60) {
    return `${minutes}분 전`;
  }

  // 시간 단위
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}시간 전`;
  }

  // 일 단위
  const days = Math.floor(hours / 24);
  if (days === 1) {
    return '어제';
  }
  if (days < 7) {
    return `${days}일 전`;
  }

  // 주 단위
  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return `${weeks}주 전`;
  }

  // 개월 단위
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}개월 전`;
  }

  // 년 단위
  const years = Math.floor(days / 365);
  return `${years}년 전`;
}
  