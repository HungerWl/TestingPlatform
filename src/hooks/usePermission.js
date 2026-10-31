import { useMemo } from 'react';
import { getPermissions } from '../utils/auth';

/**
 * 读取演示权限，并提供稳定的 hasPermission 方法。
 * 真实项目中可替换为 AuthContext / 后端返回的权限列表。
 */
export default function usePermission() {
  const permissions = useMemo(() => getPermissions(), []);

  const hasPermission = useMemo(
    () => (permission) => !permission || permissions.includes(permission),
    [permissions],
  );

  return { permissions, hasPermission };
}
