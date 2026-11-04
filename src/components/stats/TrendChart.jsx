import { useEffect, useRef, useState } from 'react';

const PADDING = { top: 16, right: 18, bottom: 26, left: 40 };

function formatPeriod(period, granularity) {
  if (!period) return '';
  return granularity === 'month' ? period : period.slice(5);
}

/**
 * 创建时间趋势图（SVG 面积图，无第三方图表依赖）。
 *
 * 宽度按容器实测值计算，避免 viewBox 拉伸导致文字变形。
 */
export default function TrendChart({ data = [], granularity = 'day', height = 220 }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(640);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const update = () => setWidth(element.clientWidth || 640);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const innerWidth = Math.max(width - PADDING.left - PADDING.right, 20);
  const innerHeight = Math.max(height - PADDING.top - PADDING.bottom, 20);
  const maxValue = Math.max(...data.map((item) => item.count), 1);
  const isSingle = data.length === 1;
  const stepX = !isSingle && data.length > 1 ? innerWidth / (data.length - 1) : 0;

  const points = data.map((item, index) => ({
    ...item,
    // 只有一个时间桶时居中展示，避免点贴在左侧边缘
    x: isSingle ? PADDING.left + innerWidth / 2 : PADDING.left + index * stepX,
    y: PADDING.top + innerHeight - (item.count / maxValue) * innerHeight,
  }));

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(' ');
  const areaPath = points.length
    ? `${linePath} L${(PADDING.left + innerWidth).toFixed(1)},${PADDING.top + innerHeight} L${PADDING.left},${PADDING.top + innerHeight} Z`
    : '';

  const yTicks = [0, 0.5, 1].map((ratio) => ({
    value: Math.round(maxValue * ratio),
    y: PADDING.top + innerHeight - ratio * innerHeight,
  }));

  const labelStep = Math.max(Math.ceil(points.length / 6), 1);
  const xLabels = points.filter((_, index) => index % labelStep === 0 || index === points.length - 1);

  return (
    <div className="tp-trend" ref={containerRef} style={{ height }}>
      <svg width={width} height={height} role="img" aria-label="用例创建趋势">
        <defs>
          <linearGradient id="tp-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff5c35" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#ff5c35" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => (
          <g key={`y-${tick.y}`}>
            <line
              x1={PADDING.left}
              y1={tick.y}
              x2={PADDING.left + innerWidth}
              y2={tick.y}
              stroke="rgba(16, 18, 15, 0.08)"
              strokeWidth="1"
            />
            <text x={PADDING.left - 8} y={tick.y + 3} textAnchor="end" fontSize="10" fill="#79766c">
              {tick.value}
            </text>
          </g>
        ))}

        {points.length > 1 && <path d={areaPath} fill="url(#tp-trend-fill)" />}
        {points.length > 1 && (
          <path d={linePath} fill="none" stroke="#ff5c35" strokeWidth="1.6" strokeLinejoin="round" />
        )}

        {isSingle &&
          points.map((point) => {
            const barWidth = 44;
            const baseY = PADDING.top + innerHeight;
            return (
              <g key={point.period}>
                <rect
                  x={point.x - barWidth / 2}
                  y={point.y}
                  width={barWidth}
                  height={Math.max(baseY - point.y, 2)}
                  rx="4"
                  fill="#ff5c35"
                  fillOpacity="0.85"
                >
                  <title>{`${point.period}：${point.count} 条`}</title>
                </rect>
                <text x={point.x} y={point.y - 8} textAnchor="middle" fontSize="11" fill="#10120f">
                  {point.count}
                </text>
              </g>
            );
          })}

        {!isSingle &&
          points.map((point) => (
            <g key={point.period}>
              <circle cx={point.x} cy={point.y} r="2.4" fill="#fbfaf6" stroke="#ff5c35" strokeWidth="1.4">
                <title>{`${point.period}：${point.count} 条`}</title>
              </circle>
            </g>
          ))}

        {xLabels.map((point) => (
          <text
            key={`x-${point.period}`}
            x={point.x}
            y={height - 8}
            textAnchor={point.x <= PADDING.left + 4 ? 'start' : point.x >= PADDING.left + innerWidth - 4 ? 'end' : 'middle'}
            fontSize="10"
            fill="#79766c"
          >
            {formatPeriod(point.period, granularity)}
          </text>
        ))}
      </svg>
    </div>
  );
}
