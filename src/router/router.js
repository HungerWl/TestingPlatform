import { lazy } from 'react';
import { IconLock, IconUser } from '@arco-design/web-react/icon';

/**
 * 全站唯一的路由配置源。
 * ------------------------------------------------------------------
 * meta 约定：
 *  - title       页面标题 / 菜单文案 / 浏览器标题
 *  - icon        Arco 图标组件，用于自动生成菜单
 *  - hidden      是否在侧边菜单中隐藏
 *  - permission  权限标识，没有该权限时菜单自动过滤
 *  - blank       是否使用无侧边栏布局（登录页）
 *
 * 当前只保留个人中心与登录页两个模块。
 */
export const appRoutes = [
  {
    path: '/profile',
    component: lazy(() => import('../views/Profile')),
    meta: {
      title: '个人中心',
      icon: IconUser,
      permission: 'profile:view',
      eyebrow: 'OPERATOR PROFILE / 01',
    },
  },
  {
    path: '/login',
    component: lazy(() => import('../views/Login')),
    meta: {
      title: '登录页',
      icon: IconLock,
      hidden: true,
      blank: true,
    },
  },
];

/**
 * 将嵌套配置拍平为 React Router 可消费的叶子路由。
 * 分组节点（没有 component）只用于菜单展示，不生成路由。
 */
export function flattenRoutes(routes = appRoutes) {
  return routes.flatMap((route) => {
    const current = route.component ? [route] : [];
    const children = route.children ? flattenRoutes(route.children) : [];
    return [...current, ...children];
  });
}

/** 根据 pathname 找到完整的配置链路（用于面包屑和标题）。 */
export function findRouteTrail(pathname, routes = appRoutes, trail = []) {
  for (const route of routes) {
    const nextTrail = [...trail, route];

    if (route.children?.length) {
      const childTrail = findRouteTrail(pathname, route.children, nextTrail);
      if (childTrail.length) return childTrail;
    }

    if (route.path === pathname) return nextTrail;
  }
  return [];
}
