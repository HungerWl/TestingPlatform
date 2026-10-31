import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import useMediaQuery from '../hooks/useMediaQuery';

/**
 * 经典后台壳：
 * 固定侧栏 + 顶部导航 + 可滚动内容区 + 版权页脚。
 * 桌面端支持折叠，移动端自动切换为抽屉式侧栏。
 */
export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  return (
    <div className={`tp-shell ${collapsed ? 'is-collapsed' : ''}`.trim()}>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((value) => !value)}
      />

      {mobileOpen && (
        <button
          type="button"
          className="tp-mobile-scrim lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="关闭导航"
        />
      )}

      <div className="tp-main">
        <Header
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((value) => !value)}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main className="tp-content">
          <div className="tp-content__inner">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
