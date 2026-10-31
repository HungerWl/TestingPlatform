import { useEffect } from 'react';

/** 同步浏览器标题，让路由 meta.title 成为单一数据源。 */
export default function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · Testing Platform` : 'Testing Platform · 质量控制台';
    return () => {
      document.title = previous;
    };
  }, [title]);
}
