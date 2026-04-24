/** 약관·프로필 API 전송용 YYYY-MM-DD */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);

  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}
