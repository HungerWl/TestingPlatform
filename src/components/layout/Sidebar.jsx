import { useEffect, useMemo, useState } from 'react';
import { Menu } from '@arco-design/web-react';
import { IconMenuFold, IconMenuUnfold } from '@arco-design/web-react/icon';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BrandMark from '../common/BrandMark';
import { appRoutes } from '../../router/router';
import { buildMenuTree, findParentMenuKeys } from '../../router/menu';
import usePermission from '../../hooks/usePermission';

function renderMenuNodes(nodes, renderNode) {
  return nodes.map((node) => renderNode(node));
}

export default function Sidebar({ collapsed, mobileOpen, onNavigate, onToggleCollapse }) {
  const { hasPermission } = usePermission();
  const location = useLocation();
  const navigate = useNavigate();
  const [openKeys, setOpenKeys] = useState([]);

  const menuTree = useMemo(
    () => buildMenuTree(appRoutes, hasPermission),
    [hasPermission],
  );

  const isCollapsed = collapsed && !mobileOpen;
  const selectedKeys =
    location.pathname === '/404' || location.pathname === '/' ? [] : [location.pathname];

  useEffect(() => {
    const parentKeys = findParentMenuKeys(menuTree, location.pathname) || [];
    setOpenKeys((previous) => Array.from(new Set([...previous, ...parentKeys])));
  }, [location.pathname, menuTree]);

  const handleMenuClick = (key) => {
    navigate(key);
    onNavigate?.();
  };

  const renderNode = (node) => {
    const Icon = node.meta.icon;

    if (node.children?.length) {
      return (
        <Menu.SubMenu key={node.key} title={node.meta.title}>
          {renderMenuNodes(node.children, renderNode)}
        </Menu.SubMenu>
      );
    }

    return (
      <Menu.Item key={node.key}>
        {Icon ? <Icon /> : null}
        {node.meta.title}
      </Menu.Item>
    );
  };

  return (
    <aside
      className={`tp-sidebar ${isCollapsed ? 'is-collapsed' : ''} ${
        mobileOpen ? 'is-mobile-open' : ''
      }`.trim()}
      aria-label="主导航"
    >
      <div className="tp-sidebar__grid" aria-hidden="true" />

      <Link to="/test-cases" className="tp-brand" onClick={onNavigate} aria-label="Testing Platform 首页">
        <BrandMark className="tp-brand__mark" />
        <span className="tp-brand__copy">
          <span className="tp-brand__title">TESTING PLATFORM</span>
          <span className="tp-brand__sub">质量工程控制台</span>
        </span>
      </Link>

      <div className="tp-sidebar__rule" />

      <div className="tp-sidebar__section-label">
        <span>Navigation</span>
        <span className="tp-sidebar__section-rule" />
      </div>

      <nav className="tp-sidebar__nav">
        <Menu
          mode="vertical"
          theme="dark"
          collapse={isCollapsed}
          selectedKeys={selectedKeys}
          openKeys={isCollapsed ? [] : openKeys}
          onClickMenuItem={handleMenuClick}
          onClickSubMenu={(key, keys) => setOpenKeys(keys)}
          autoScrollIntoView
        >
          {renderMenuNodes(menuTree, renderNode)}
        </Menu>
      </nav>

      <div className="tp-sidebar__footer">
        <div className="tp-sidebar__status">
          <span className="tp-sidebar__status-dot" />
          <div className="tp-sidebar__status-copy">
            <span>SYSTEM READY</span>
            <small>运行状态正常</small>
          </div>
          <span className="tp-sidebar__version">v2.4</span>
        </div>
        <button
          type="button"
          className="tp-sidebar__collapse-hint"
          onClick={onToggleCollapse}
          aria-label={collapsed ? '展开导航' : '收起导航'}
        >
          <span>{collapsed ? 'EXPAND' : 'COLLAPSE NAV'}</span>
          <span className="tp-sidebar__collapse-icon">
            {collapsed ? <IconMenuUnfold /> : <IconMenuFold />}
          </span>
        </button>
      </div>
    </aside>
  );
}
