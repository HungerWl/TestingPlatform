export function formatDateTime(date = new Date()) {
  const target = date instanceof Date ? date : new Date(date);
  const pad = (number) => String(number).padStart(2, '0');
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())} ${pad(
    target.getHours(),
  )}:${pad(target.getMinutes())}`;
}

/**
 * 把日期值统一转成 YYYY-MM-DD。
 * 兼容 DatePicker 回传的字符串、dayjs 对象与原生 Date。
 */
export function toDateString(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (typeof value.format === 'function') return value.format('YYYY-MM-DD');
  if (value instanceof Date) {
    const pad = (number) => String(number).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  return '';
}

export function formatClock(date = new Date()) {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatFileSize(bytes = 0) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** index;
  return `${size >= 10 || index === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[index]}`;
}
