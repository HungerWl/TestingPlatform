import { useCallback, useEffect, useState } from 'react';

const BOOT_SESSION_KEY = 'testing-platform.boot-initialized';

function hasBootedInSession() {
  try {
    return sessionStorage.getItem(BOOT_SESSION_KEY) === '1';
  } catch {
    // 隐私模式或存储被禁用时，降级为每次加载都播放动画。
    return false;
  }
}

function markBootedInSession() {
  try {
    sessionStorage.setItem(BOOT_SESSION_KEY, '1');
  } catch {
    // noop：存储不可用时不影响应用继续运行。
  }
}

/**
 * 控制启动动画的三段式状态：
 * booting -> leaving（视频结束，淡出） -> ready（挂载后台应用）
 *
 * 启动动画只在当前标签页会话的首次初始化时播放：
 * - 第一次打开 / 新标签页：播放；
 * - 浏览器刷新、路由跳转：直接进入后台；
 * - 关闭标签页后重新打开：视为新的初始化，再次播放。
 *
 * 使用 sessionStorage，因此刷新不会重复播放；
 * 如果希望「整台浏览器只播放一次」，把这里的 sessionStorage 换成 localStorage 即可。
 */
export default function useBootSequence() {
  const [status, setStatus] = useState(() => (hasBootedInSession() ? 'ready' : 'booting'));

  // 首次渲染启动动画时就写入标记，避免用户在播放过程中刷新导致重复播放。
  useEffect(() => {
    if (status === 'booting') markBootedInSession();
  }, [status]);

  const finishBoot = useCallback(() => {
    setStatus((current) => (current === 'booting' ? 'leaving' : current));
  }, []);

  useEffect(() => {
    if (status !== 'leaving') return undefined;
    const timer = window.setTimeout(() => setStatus('ready'), 680);
    return () => window.clearTimeout(timer);
  }, [status]);

  return {
    status,
    isBooting: status !== 'ready',
    isLeaving: status === 'leaving',
    finishBoot,
  };
}
