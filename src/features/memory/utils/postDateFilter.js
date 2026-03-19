// src/features/memory/utils/postDateFilter.js

// dateStr: '2025-11-27T10:00:00Z' 같은 ISO 문자열이라고 가정
// startDateStr, endDateStr: '2025-11-01' 이런 형식 문자열
export function filterPostsByDateRange(posts, startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return posts; // 기간 없으면 전체 리턴

  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T23:59:59'); // 끝 날짜 포함

  return posts.filter(post => {
    if (!post.createdAt) return false; // createdAt 없는 건 제외

    const created = new Date(post.createdAt);
    return created >= start && created <= end;
  });
}

