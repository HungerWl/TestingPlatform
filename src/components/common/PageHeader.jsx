export default function PageHeader({ eyebrow, title, description, actions, meta }) {
  return (
    <header className="tp-page-header">
      <div className="min-w-0">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-8 bg-ink/80" />
          <span className="eyebrow">{eyebrow || 'TESTING PLATFORM'}</span>
          {meta && <span className="tp-page-header__meta">{meta}</span>}
        </div>
        <h1 className="font-display text-[clamp(27px,3vw,40px)] font-semibold leading-[1.06] tracking-[-0.045em] text-ink">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
