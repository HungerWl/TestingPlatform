import { useEffect, useRef, useState } from 'react';
import { Button, Spin } from '@arco-design/web-react';
import { IconLink, IconRefresh } from '@arco-design/web-react/icon';
import './index.scss';

/**
 * Playwright Trace Viewer 地址。
 * 默认使用官方在线版；如需内网部署，可通过 VITE_TRACE_VIEWER_URL 指向自建地址。
 */
const TRACE_VIEWER_URL =
  import.meta.env.VITE_TRACE_VIEWER_URL || 'https://trace.playwright.dev/';

/**
 * 页面快照：铺满整个内容区的 Playwright Trace Viewer。
 * 内容区已通过 AdminLayout 的 is-flush 去掉内边距，这里只保留右上角两个按钮。
 */
export default function PageSnapshot() {
  const viewportRef = useRef(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewportHeight, setViewportHeight] = useState(560);

  // iframe 精确填满「按钮栏底部 → footer 顶部」的剩余高度。
  useEffect(() => {
    const measure = () => {
      const element = viewportRef.current;
      if (!element) return;

      const top = element.getBoundingClientRect().top;
      const footer = document.querySelector('.tp-footer');
      const footerTop = footer ? footer.getBoundingClientRect().top : window.innerHeight;
      const available = footerTop - top;

      setViewportHeight(Math.max(Math.round(available), 360));
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const handleReload = () => {
    setLoading(true);
    setReloadKey((value) => value + 1);
  };

  const handleOpenExternal = () => {
    window.open(TRACE_VIEWER_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="tp-page snapshot-page">
      <div className="snapshot-page__actions">
        <Button size="small" icon={<IconRefresh />} onClick={handleReload}>
          重新加载
        </Button>
        <Button
          size="small"
          type="primary"
          icon={<IconLink />}
          onClick={handleOpenExternal}
        >
          在新标签打开
        </Button>
      </div>

      <div
        className="snapshot-page__viewport"
        ref={viewportRef}
        style={{ height: viewportHeight }}
      >
        {loading && (
          <div className="snapshot-page__loading">
            <Spin dot />
          </div>
        )}

        <iframe
          key={reloadKey}
          className="snapshot-page__iframe"
          title="Playwright Trace Viewer"
          src={TRACE_VIEWER_URL}
          onLoad={() => setLoading(false)}
          referrerPolicy="no-referrer"
          allow="clipboard-read; clipboard-write; fullscreen"
        />
      </div>
    </div>
  );
}
