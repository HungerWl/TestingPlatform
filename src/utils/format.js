export function formatDateTime(date = new Date()) {
  const target = date instanceof Date ? date : new Date(date);
  const pad = (number) => String(number).padStart(2, '0');
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())} ${pad(
    target.getHours(),
  )}:${pad(target.getMinutes())}`;
}

export function formatClock(date = new Date()) {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
