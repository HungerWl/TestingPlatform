import { appRoutes, findRouteTrail } from './router';

/**
 * 自动菜单构建器
 * ------------------------------------------------------------------
 * 不仅仅过滤 hidden，还会：
 * 1. 根据 meta.permission 过滤无权限菜单；
 * 2. 如果分组下所有子项都不可见，则连分组一起隐藏；
 * 3. 输出带 key / path / icon / children 的菜单树。
 */
export function buildMenuTree(routes = appRoutes, hasPermission = () => true) {
  return routes
    .filter((route) => !route.meta?.hidden)
    .filter((route) => hasPermission(route.meta?.permission))
    .map((route) => {
      const children = route.children
        ? buildMenuTree(route.children, hasPermission)
        : undefined;

      if (route.children && children.length === 0) return null;

      return {
        key: route.path,
        path: route.path,
        meta: route.meta || {},
        children,
      };
    })
    .filter(Boolean);
}

/** 收集所有父级 key，用于自动展开当前路由所属子菜单。 */
export function findParentMenuKeys(menuTree, targetPath, parents = []) {
  for (const node of menuTree) {
    if (node.path === targetPath) return parents;
    if (node.children?.length) {
      const found = findParentMenuKeys(node.children, targetPath, [...parents, node.key]);
      if (found !== null) return found;
    }
  }
  return null;
}

/** 当前路由在配置中的标题链路；登录等隐藏路由也能正确显示。 */
export function getRouteTrail(pathname) {
  return findRouteTrail(pathname);
}
