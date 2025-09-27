// utils/dateUtils.js
/** '2025-08-28T16:08:03' → 'n분 전' 등 */
export function formatRelativeKorean(isoLike) {
    const t = new Date(isoLike).getTime();
    if (Number.isNaN(t)) return '시간 정보 없음';
  
    let diff = Math.max(0, Math.floor((Date.now() - t) / 1000)); // 초 단위 차이
  
    if (diff < 5) return '방금 전';
    if (diff < 60) return `${diff}초 전`;
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    const d = Math.floor(h / 24);
    if (d === 1) return '어제';
    if (d < 7) return `${d}일 전`;
    const w = Math.floor(d / 7);
    if (w < 5) return `${w}주 전`;
    const mo = Math.floor(d / 30);
    if (mo < 12) return `${mo}개월 전`;
    const y = Math.floor(d / 365);
    return `${y}년 전`;
  }
  