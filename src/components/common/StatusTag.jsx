import { Tag } from '@arco-design/web-react';

const TONE_MAP = {
  passed: { className: 'tp-status--pass', label: '已通过' },
  failed: { className: 'tp-status--fail', label: '未通过' },
  running: { className: 'tp-status--run', label: '执行中' },
  draft: { className: 'tp-status--draft', label: '草稿' },
  healthy: { className: 'tp-status--pass', label: '健康' },
  warning: { className: 'tp-status--warn', label: '注意' },
  offline: { className: 'tp-status--fail', label: '离线' },
  active: { className: 'tp-status--pass', label: '在线' },
  neutral: { className: 'tp-status--draft', label: '未知' },
};

/** 统一状态标签：颜色、圆点和文案由 tone 决定，保证全站一致。 */
export default function StatusTag({ tone = 'neutral', children, pulse = false, className = '' }) {
  const preset = TONE_MAP[tone] || TONE_MAP.neutral;

  return (
    <Tag
      bordered={false}
      className={`tp-status ${preset.className} ${className}`.trim()}
    >
      <span className={`tp-status__dot ${pulse ? 'is-pulsing' : ''}`.trim()} />
      {children || preset.label}
    </Tag>
  );
}
