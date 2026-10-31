import { ConfigProvider } from '@arco-design/web-react';
import zhCN from '@arco-design/web-react/es/locale/zh-CN';
import { BrowserRouter } from 'react-router-dom';
import BootScreen from './components/boot/BootScreen';
import useBootSequence from './hooks/useBootSequence';
import AppRouter from './router';

/**
 * 应用根节点：
 * 启动视频播放完成后才挂载 Router 和后台管理页面，
 * 满足“无登录页、boot.mp4 前置于后台”的要求。
 */
export default function App() {
  const { status, isLeaving, finishBoot } = useBootSequence();

  return (
    <>
      {status !== 'ready' && <BootScreen isLeaving={isLeaving} onFinish={finishBoot} />}
      {status === 'ready' && (
        <ConfigProvider locale={zhCN}>
          <BrowserRouter
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <AppRouter />
          </BrowserRouter>
        </ConfigProvider>
      )}
    </>
  );
}
