/** 品牌图形：由 T / P 的几何笔画组成，纯 SVG，避免额外图片资源。 */
export default function BrandMark({ className = '' }) {
  return (
    <span className={`brand-mark ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none" role="presentation">
        <path
          d="M9.5 12.5h21M20 12.5v16M9.5 28.5h10.5"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinecap="square"
        />
        <circle cx="30.5" cy="28.5" r="2.8" fill="currentColor" />
      </svg>
    </span>
  );
}
