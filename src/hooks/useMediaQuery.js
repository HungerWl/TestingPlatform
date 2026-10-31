import { useEffect, useState } from 'react';

/**
 * 响应式媒体查询 hook。
 * 默认以 1024px 为桌面 / 移动端分界，和 Tailwind 的 lg 断点保持一致。
 */
export default function useMediaQuery(query = '(min-width: 1024px)') {
  const getMatches = () => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = (event) => setMatches(event.matches);

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}
