/**
 * 表单标签：为必填/非必填字段保留相同的星号占位，
 * 避免 Arco 必填星号导致标签文字起始位置不一致。
 */
export default function FormLabel({ required = false, children }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span
        aria-hidden="true"
        className="inline-block w-2 shrink-0 font-semibold leading-none text-[#f53f3f]"
      >
        {required ? '*' : ''}
      </span>
      <span>{children}</span>
    </span>
  );
}
