import { Button } from '@arco-design/web-react';
import { IconArrowLeft, IconArrowRight, IconHome } from '@arco-design/web-react/icon';
import { useLocation, useNavigate } from 'react-router-dom';

/** 404 页面：保持后台壳不变，提供明确返回路径。 */
export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="tp-notfound">
      <div className="tp-notfound__grid" aria-hidden="true" />

      <div className="relative z-10 grid min-h-[520px] gap-10 p-6 sm:p-10 xl:grid-cols-[1.2fr_.8fr] xl:items-center">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-acid" />
            <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-acid">
              SIGNAL LOST / 404
            </span>
          </div>

          <div className="relative mt-6">
            <p className="tp-notfound__code" aria-hidden="true">404</p>
            <span className="absolute -left-1 top-8 h-px w-24 bg-ember sm:top-12 sm:w-36" />
          </div>

          <h1 className="mt-6 font-display text-[clamp(30px,3.5vw,48px)] font-semibold leading-[1.05] tracking-[-0.05em] text-paper">
            这条路径不在
            <br />
            当前质量管理空间内。
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/45">
            页面可能已被移动、删除，或你访问了一个尚未注册的模块。请返回个人中心，或从左侧菜单重新选择入口。
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <Button
              type="primary"
              className="btn-acid"
              icon={<IconHome />}
              onClick={() => navigate('/profile')}
            >
              回到个人中心
            </Button>
            <Button
              className="tp-button-ghost-dark"
              icon={<IconArrowLeft />}
              onClick={() => navigate(-1)}
            >
              返回上一页
            </Button>
          </div>
        </div>

        <div className="tp-notfound__console">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
              route trace
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-ember">
              <i className="h-1.5 w-1.5 rounded-full bg-ember" />
              unresolved
            </span>
          </div>

          <div className="space-y-3 p-4 font-mono text-[10px] leading-5 text-white/45">
            <p>
              <span className="text-acid">$</span> resolve --path
            </p>
            <p className="break-all rounded bg-white/[0.04] px-2.5 py-2 text-white/75">
              {location.pathname}
            </p>
            <p>
              <span className="text-white/25">status</span> &nbsp;404 NOT_FOUND
            </p>
            <p>
              <span className="text-white/25">node</span> &nbsp;&nbsp;&nbsp;edge-sh-04
            </p>
            <p>
              <span className="text-white/25">action</span> &nbsp;return_to_console
            </p>
            <p className="pt-2 text-acid/80">→ awaiting operator decision_</p>
          </div>

          <div className="border-t border-white/10 p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/30">
              Suggested routes
            </p>
            <div className="mt-3 space-y-2">
              {[
                { label: '测试用例', path: '/test-cases' },
                { label: '个人中心', path: '/profile' },
                { label: '登录页', path: '/login' },
              ].map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="flex w-full items-center justify-between border-b border-white/[0.07] pb-2 text-left font-mono text-[10px] text-white/50 transition-colors hover:text-acid"
                >
                  {item.label}
                  <IconArrowRight />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
