/**
 * 横向条形列表：标签 + 进度条 + 数量。
 */
export default function BarList({ items = [], max = 6 }) {
  const list = items.slice(0, max);
  const maxValue = Math.max(...list.map((item) => item.count), 1);

  if (!list.length) {
    return <p className="tp-barlist__empty">暂无数据</p>;
  }

  return (
    <ul className="tp-barlist">
      {list.map((item) => (
        <li key={item.label} className="tp-barlist__item">
          <span className="tp-barlist__label" title={item.label}>
            {item.label}
          </span>
          <span className="tp-barlist__track">
            <span
              className="tp-barlist__fill"
              style={{ width: `${Math.max((item.count / maxValue) * 100, 2)}%` }}
            />
          </span>
          <span className="tp-barlist__value">{item.count}</span>
        </li>
      ))}
    </ul>
  );
}
