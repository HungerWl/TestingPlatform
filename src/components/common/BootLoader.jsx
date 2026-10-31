import BrandMark from './BrandMark';

/** 路由懒加载 / 模块载入时的统一占位。 */
export default function BootLoader({ label = '正在载入' }) {
  return (
    <div className="flex min-h-[320px] w-full flex-col items-center justify-center gap-5 py-16">
      <div className="loader-orbit">
        <BrandMark className="h-10 w-10" />
      </div>
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">{label}</p>
        <div className="mx-auto mt-3 h-px w-24 overflow-hidden bg-line">
          <span className="loader-line block h-full w-1/2 bg-ink" />
        </div>
      </div>
    </div>
  );
}
