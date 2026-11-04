/**
 * 横向条形列表：标签 + 进度条 + 数量。
 *
 * 传入 onItemClick 时整行可点击，用于跳转到用例列表查看明细。
 */
export default function BarList({ items = [], max = 6, onItemClick }) {
  const list = items.slice(0, max);
  const maxValue = Math.max(...list.map((item) => item.count), 1);

  if (!list.length) {
    return <p className="tp-barlist__empty">暂无数据</p>;
  }

  return (
    <ul className="tp-barlist">
      {list.map((item) => (
        <li
          key={item.label}
          className={`tp-barlist__item${onItemClick ? ' is-clickable' : ''}`}
          title={onItemClick ? `查看「${item.label}」的相关用例` : item.label}
          role={onItemClick ? 'button' : undefined}
          tabIndex={onItemClick ? 0 : undefined}
          onClick={onItemClick ? () => onItemClick(item) : undefined}
          onKeyDown={
            onItemClick
              ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onItemClick(item);
                  }
                }
              : undefined
          }
        >
          <span className="tp-barlist__label">{item.label}</span>
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
