import { Tag } from '@arco-design/web-react';

const TONE_MAP = {
  passed: { color: 'green', label: '已通过' },
  failed: { color: 'red', label: '未通过' },
  running: { color: 'arcoblue', label: '执行中' },
  draft: { color: 'gray', label: '草稿' },
  healthy: { color: 'green', label: '健康' },
  warning: { color: 'orange', label: '注意' },
  offline: { color: 'red', label: '离线' },
  active: { color: 'green', label: '在线' },
  neutral: { color: 'gray', label: '未知' },
};

/**
 * 统一状态标签。
 * 直接使用 Arco Tag 的原生 color 能力，不额外覆盖组件样式。
 */
export default function StatusTag({ tone = 'neutral', children }) {
  const preset = TONE_MAP[tone] || TONE_MAP.neutral;
  return <Tag color={preset.color}>{children || preset.label}</Tag>;
}
