import { useEffect, useRef, useState } from "react";
import { Select } from "@arco-design/web-react";
import { fetchTestCases } from "../../api/testCases";

function toOption(testCase) {
  if (!testCase) return null;
  return {
    value: testCase.id,
    label: `${testCase.case_no} · ${testCase.name}`,
  };
}

/**
 * 远程搜索的测试用例选择器。
 * 只展示业务编号与名称，不在界面上暴露 UUID。
 */
export default function TestCaseSelect({
  value,
  onChange,
  placeholder = "搜索业务编号或用例名称",
  disabled = false,
  selectedCase = null,
}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const selectedOption = toOption(selectedCase);
    if (!selectedOption) return;

    setOptions((previous) => {
      if (previous.some((item) => item.value === selectedOption.value))
        return previous;
      return [selectedOption, ...previous];
    });
  }, [selectedCase]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchTestCases({ page: 1, page_size: 20 })
      .then((result) => {
        if (cancelled) return;
        setOptions((result?.items || []).map(toOption).filter(Boolean));
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
        page_size: 20,
        keyword: keyword.trim() || undefined,
      })
        .then((result) => {
          const nextOptions = (result?.items || [])
            .map(toOption)
            .filter(Boolean);
          setOptions((previous) => {
            const selectedOption = previous.find(
              (item) => item.value === value,
            );
            if (!selectedOption) return nextOptions;
            const withoutSelected = nextOptions.filter(
              (item) => item.value !== value,
            );
            return [selectedOption, ...withoutSelected];
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
    />
  );
}
