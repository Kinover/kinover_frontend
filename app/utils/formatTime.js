export default function formatTime(time) {
  const date = new Date(time);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true, // 12시간 형식
  });
}
