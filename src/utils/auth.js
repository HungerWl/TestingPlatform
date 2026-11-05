const TOKEN_KEY = 'testing-platform.token';

/**
 * 纯前端演示没有真实登录流程，但依然写入一枚演示 token。
 * request.js 的请求拦截器会从这里读取并添加到 Authorization 头，
 * 后续接入后端时只需替换成真实登录接口返回的 token 即可。
 */
export const DEMO_TOKEN = 'tp_demo_9f2c41a7b83e';

export const DEMO_USER = {
  id: 'U-2048',
  name: '万里',
  englishName: 'Jasmine Lin',
  role: '质量平台负责人',
  department: 'Quality Engineering',
  email: 'jasmine.lin@testing.platform',
  phone: '+86 138 0000 2048',
  location: 'Shanghai · CN',
  joinedAt: '2023-04-18',
  avatarColor: 'from-[#d8fb4f] to-[#9ed522]',
};

/**
 * 演示权限集。路由 meta.permission 会与这里比对，
 * 没有权限的路由不会出现在侧边菜单中。
 */
export const DEMO_PERMISSIONS = [
  'case:view',
  'script:view',
  'dictionary:view',
  'snapshot:view',
  'profile:view',
  'ai:view',
];

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // 浏览器隐私模式下 localStorage 可能不可用，演示环境静默降级。
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // noop
  }
}

export function ensureDemoToken() {
  if (!getToken()) setToken(DEMO_TOKEN);
}

export function getCurrentUser() {
  return DEMO_USER;
}

export function getPermissions() {
  return DEMO_PERMISSIONS;
}

export function hasPermission(permission) {
  if (!permission) return true;
  return getPermissions().includes(permission);
}
