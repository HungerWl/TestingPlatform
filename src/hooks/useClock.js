import { useEffect, useState } from 'react';
import { formatClock } from '../utils/format';

/** 顶栏实时时钟，每分钟刷新一次，避免多余的渲染。 */
export default function useClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  return {
    now,
    clock: formatClock(now),
    date: now.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
  };
}
