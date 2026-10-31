import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { appRoutes, findRouteTrail, flattenRoutes } from './router';
import AdminLayout from '../layouts/AdminLayout';
import useDocumentTitle from '../hooks/useDocumentTitle';
import usePermission from '../hooks/usePermission';
import BootLoader from '../components/common/BootLoader';

const flatRoutes = flattenRoutes(appRoutes);
const blankRoutes = flatRoutes.filter((route) => route.meta?.blank);
const consoleRoutes = flatRoutes.filter((route) => !route.meta?.blank);
const NotFoundPage = lazy(() => import('../views/NotFound'));

function LazyPage({ component: Component }) {
  return (
    <Suspense fallback={<BootLoader label="正在载入模块" />}>
      <Component />
    </Suspense>
  );
}

/**
 * 路由权限守卫：菜单过滤与直接访问保持同一套 meta.permission。
 * 无权限用户即使手动输入地址，也只会看到 404。
 */
function GuardedPage({ component, permission }) {
  const { hasPermission } = usePermission();
  if (!hasPermission(permission)) return <Navigate to="/404" replace />;
  return <LazyPage component={component} />;
}

/**
 * 路由出口。
 * - 登录页使用 blank 布局，不套后台壳；
 * - 其余页面统一进入 AdminLayout；
 * - 未匹配路径在后台壳内展示 404，便于用户直接返回控制台。
 */
export default function AppRouter() {
  const location = useLocation();
  const trail = findRouteTrail(location.pathname);
  const pageTitle = trail.at(-1)?.meta?.title || '页面未找到';
  useDocumentTitle(pageTitle);

  return (
    <Routes>
      {blankRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<LazyPage component={route.component} />}
        />
      ))}

      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="/profile" replace />} />
        {consoleRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <GuardedPage
                component={route.component}
                permission={route.meta?.permission}
              />
            }
          />
        ))}
        <Route path="/404" element={<LazyPage component={NotFoundPage} />} />
        <Route path="*" element={<LazyPage component={NotFoundPage} />} />
      </Route>
    </Routes>
  );
}
