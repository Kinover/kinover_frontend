export default function formatTime(time) {
  const date = new Date(time);
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours < 12 ? '오전' : '오후';

  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;

  return `${ampm} ${hours}:${minutes}`;
}

