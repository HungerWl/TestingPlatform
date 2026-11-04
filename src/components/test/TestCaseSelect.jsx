import { useEffect, useMemo, useRef, useState } from 'react';
import { Select } from '@arco-design/web-react';
import { fetchTestCases } from '../../api/testCases';

function toOption(testCase) {
  if (!testCase) return null;
  // 用例名称非必填，为空时统一展示占位文案
  const caseName = testCase.name?.trim() ? testCase.name : '未命名用例';
  return {
    value: testCase.id,
    label: `${testCase.case_no} · ${caseName}`,
  };
}

/**
 * 远程搜索的测试用例选择器。
 *
 * mode="single" 时 value 是单个 UUID；
 * mode="multiple" 时 value 是 UUID 数组。
 * 只展示业务编号与名称，不在界面上暴露 UUID。
 */
export default function TestCaseSelect({
  value,
  onChange,
  placeholder = '搜索业务编号或用例名称',
  disabled = false,
  selectedCase = null,
  selectedCases = [],
  mode = 'single',
}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const selectedSeed = useMemo(() => {
    const cases = mode === 'multiple'
      ? (selectedCases || [])
      : selectedCase
        ? [selectedCase]
        : [];
    return cases.map(toOption).filter(Boolean);
  }, [mode, selectedCase, selectedCases]);

  const selectedSeedKey = selectedSeed.map((item) => item.value).join(',');

  const selectedValueRef = useRef(new Set());
  useEffect(() => {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    selectedValueRef.current = new Set(values);
  }, [value]);

  useEffect(() => {
    if (!selectedSeed.length) return;
    setOptions((previous) => {
      const seedIds = new Set(selectedSeed.map((item) => item.value));
      return [
        ...selectedSeed,
        ...previous.filter((item) => !seedIds.has(item.value)),
      ];
    });
  }, [selectedSeedKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchTestCases({ page: 1, page_size: 100 })
      .then((result) => {
        if (cancelled) return;
        const nextOptions = (result?.items || []).map(toOption).filter(Boolean);
        setOptions((previous) => {
          const selectedOptions = previous.filter((item) =>
            selectedValueRef.current.has(item.value),
          );
          const selectedIds = new Set(selectedOptions.map((item) => item.value));
          return [
            ...selectedOptions,
            ...nextOptions.filter((item) => !selectedIds.has(item.value)),
          ];
        });
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleSearch = (keyword) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(() => {
      setLoading(true);
      fetchTestCases({
        page: 1,
        page_size: 100,
        keyword: keyword.trim() || undefined,
      })
        .then((result) => {
          const nextOptions = (result?.items || [])
            .map(toOption)
            .filter(Boolean);
          setOptions((previous) => {
            const selectedOptions = previous.filter((item) =>
              selectedValueRef.current.has(item.value),
            );
            const selectedIds = new Set(
              selectedOptions.map((item) => item.value),
            );
            return [
              ...selectedOptions,
              ...nextOptions.filter((item) => !selectedIds.has(item.value)),
            ];
          });
        })
        .catch(() => setOptions([]))
        .finally(() => setLoading(false));
    }, 300);
  };

  return (
    <Select
      showSearch
      allowClear
      filterOption={false}
      loading={loading}
      placeholder={placeholder}
      options={options}
      value={value}
      onChange={onChange}
      onSearch={handleSearch}
      disabled={disabled}
      mode={mode === 'multiple' ? 'multiple' : undefined}
      maxTagCount={mode === 'multiple' ? 3 : undefined}
    />
  );
}
