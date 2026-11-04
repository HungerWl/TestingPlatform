const COLORS = ['#ff5c35', '#10120f', '#5b7fa6', '#7d9b3f', '#a34b5a', '#c9a227', '#3f7f74', '#8d8a7c'];

export const DONUT_COLORS = COLORS;

/**
 * 环形图（SVG 实现，无第三方图表依赖）。
 */
export default function DonutChart({ items = [], size = 172, thickness = 18 }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const radius = (size - thickness) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = items.map((item, index) => {
    const fraction = total > 0 ? item.count / total : 0;
    const length = fraction * circumference;
    const arc = (
      <circle
        key={item.label}
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={COLORS[index % COLORS.length]}
        strokeWidth={thickness}
        strokeDasharray={`${length} ${circumference - length}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${center} ${center})`}
      >
        <title>{`${item.label}：${item.count} 条`}</title>
      </circle>
    );
    offset += length;
    return arc;
  });

  return (
    <div className="tp-donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label="结单状态分布">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(16, 18, 15, 0.07)" strokeWidth={thickness} />
        {arcs}
      </svg>
      <div className="tp-donut__center">
        <span className="tp-donut__value">{total}</span>
        <span className="tp-donut__label">用例</span>
      </div>
    </div>
  );
}
