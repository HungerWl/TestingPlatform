import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  DatePicker,
  Empty,
  Select,
  Space,
  Spin,
  Table,
  Tooltip,
  Typography,
} from '@arco-design/web-react';
import { IconRefresh } from '@arco-design/web-react/icon';
import PageHeader from '../../components/common/PageHeader';
import BarList from '../../components/stats/BarList';
import DonutChart, { DONUT_COLORS } from '../../components/stats/DonutChart';
import TrendChart from '../../components/stats/TrendChart';
import { fetchDictionaryOptions } from '../../api/dictionaries';
import { fetchTestCaseStats } from '../../api/testCases';
import './index.scss';

const INITIAL_FILTERS = {
  range: undefined,
  closeStatus: undefined,
  unit: undefined,
  systemName: undefined,
};

const INITIAL_QUERY = {
  startDate: '',
  endDate: '',
  closeStatus: '',
  unit: '',
  systemName: '',
};

const EMPTY_STATS = {
  granularity: 'day',
  start_date: null,
  end_date: null,
  summary: { total: 0, closed: 0, open: 0, system_count: 0, unit_count: 0 },
  by_status: [],
  by_system: [],
  by_unit: [],
  by_executor: [],
  trend: [],
  options: { systems: [], units: [] },
};

const percent = (count, total) =>
  total > 0 ? `${((count / total) * 100).toFixed(1)}%` : '0%';

/**
 * 测试用例外数据统计。
 * ---------------------------------------------------------------
 * 筛选：创建时间范围、结单状态、单位、所属系统；
 * 展示：指标卡 + 趋势面积图 + 状态环形图 + 系统/执行人条形图 + 明细表格。
 */
export default function TestCaseStats() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [query, setQuery] = useState(INITIAL_QUERY);
  const [data, setData] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusDictionary, setStatusDictionary] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchDictionaryOptions('close_status')
      .then((result) => {
        if (!cancelled) setStatusDictionary(result?.items || []);
      })
      .catch(() => {
        if (!cancelled) setStatusDictionary([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = {};
    if (query.startDate) params.start_date = query.startDate;
    if (query.endDate) params.end_date = query.endDate;
    if (query.closeStatus) params.close_status = query.closeStatus;
    if (query.unit) params.unit = query.unit;
    if (query.systemName) params.system_name = query.systemName;

    fetchTestCaseStats(params)
      .then((result) => {
        if (!cancelled) setData(result || EMPTY_STATS);
      })
      .catch(() => {
        if (!cancelled) setData(EMPTY_STATS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, refreshKey]);

  const systemOptions = useMemo(
    () => (data.options.systems || []).map((value) => ({ label: value, value })),
    [data.options.systems],
  );

  const unitOptions = useMemo(
    () => (data.options.units || []).map((value) => ({ label: value, value })),
    [data.options.units],
  );

  const summary = data.summary;
  const total = summary.total || 0;

  const metrics = [
    { label: '用例总数', value: total, unit: '条' },
    { label: '已结单', value: summary.closed || 0, unit: '条' },
    { label: '未结单', value: summary.open || 0, unit: '条', accent: (summary.open || 0) > 0 },
    { label: '涉及系统', value: summary.system_count || 0, unit: '个' },
    { label: '涉及单位', value: summary.unit_count || 0, unit: '个' },
  ];

  const statusItems = data.by_status || [];

  const applyFilters = () => {
    const [start, end] = filters.range || [];
    setQuery({
      startDate: start ? start.format('YYYY-MM-DD') : '',
      endDate: end ? end.format('YYYY-MM-DD') : '',
      closeStatus: filters.closeStatus || '',
      unit: filters.unit || '',
      systemName: filters.systemName || '',
    });
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setQuery({ ...INITIAL_QUERY });
    setRefreshKey((key) => key + 1);
  };

  const statusColumns = [
    {
      title: '结单状态',
      dataIndex: 'label',
      key: 'label',
      render: (value, record, index) => (
        <span className="tcs-cell">
          <span
            className="tcs-dot"
            style={{ background: DONUT_COLORS[index % DONUT_COLORS.length] }}
          />
          {value}
        </span>
      ),
    },
    {
      title: '用例数',
      dataIndex: 'count',
      key: 'count',
      width: 88,
      align: 'right',
      render: (value) => <span className="tcs-number">{value}</span>,
    },
    {
      title: '占比',
      dataIndex: 'count',
      key: 'percent',
      width: 78,
      align: 'right',
      render: (value) => <span className="tcs-muted">{percent(value, total)}</span>,
    },
  ];

  const unitColumns = [
    {
      title: '单位',
      dataIndex: 'label',
      key: 'label',
      render: (value) => (
        <span className="tcs-cell" title={value}>
          {value}
        </span>
      ),
    },
    {
      title: '用例数',
      dataIndex: 'count',
      key: 'count',
      width: 88,
      align: 'right',
      render: (value) => <span className="tcs-number">{value}</span>,
    },
    {
      title: '占比',
      dataIndex: 'count',
      key: 'percent',
      width: 78,
      align: 'right',
      render: (value) => <span className="tcs-muted">{percent(value, total)}</span>,
    },
  ];

  return (
    <div className="tp-page tcs">
      <PageHeader
        eyebrow="TEST ANALYTICS / 05"
        title="数据统计"
        description="按创建时间、结单状态、单位与所属系统分析用例分布，图表用于观察趋势与结构，表格用于核对明细。"
        actions={
          <Space size={6} wrap>
            <Tooltip content="按当前筛选条件重新统计">
              <Button
                size="small"
                icon={<IconRefresh />}
                onClick={() => setRefreshKey((key) => key + 1)}
              >
                刷新
              </Button>
            </Tooltip>
          </Space>
        }
      />

      <div className="tcs-filters">
        <div className="tcs-filter-field tcs-filter-field--range">
          <span className="tcs-filter-label">创建时间</span>
          <DatePicker.RangePicker
            allowClear
            value={filters.range}
            placeholder={['开始日期', '结束日期']}
            style={{ width: '100%' }}
            onChange={(range) => setFilters((previous) => ({ ...previous, range }))}
          />
        </div>
        <div className="tcs-filter-field">
          <span className="tcs-filter-label">结单状态</span>
          <Select
            allowClear
            placeholder="全部状态"
            options={statusDictionary}
            value={filters.closeStatus}
            onChange={(value) => setFilters((previous) => ({ ...previous, closeStatus: value }))}
          />
        </div>
        <div className="tcs-filter-field">
          <span className="tcs-filter-label">单位</span>
          <Select
            allowClear
            showSearch
            placeholder="全部单位"
            options={unitOptions}
            value={filters.unit}
            onChange={(value) => setFilters((previous) => ({ ...previous, unit: value }))}
          />
        </div>
        <div className="tcs-filter-field">
          <span className="tcs-filter-label">所属系统</span>
          <Select
            allowClear
            showSearch
            placeholder="全部系统"
            options={systemOptions}
            value={filters.systemName}
            onChange={(value) =>
              setFilters((previous) => ({ ...previous, systemName: value }))
            }
          />
        </div>
        <div className="tcs-filter-actions">
          <Button size="small" type="primary" onClick={applyFilters}>
            查询
          </Button>
          <Button size="small" onClick={resetFilters}>
            重置
          </Button>
        </div>
      </div>

      <div className="tcs-metrics">
        {metrics.map((item) => (
          <span key={item.label} className={`tcs-metric${item.accent ? ' is-accent' : ''}`}>
            {item.label}：<strong>{item.value}</strong>
            {item.unit}
          </span>
        ))}
      </div>

      <Spin loading={loading} style={{ width: '100%' }}>
        {total === 0 ? (
          <div className="tcs-empty">
            <Empty description="当前筛选条件下没有可统计的用例" />
          </div>
        ) : (
          <div className="tcs-grid">
            <section className="tcs-card tcs-card--wide" aria-label="创建趋势">
              <header className="tcs-card__head">
                <h3 className="tcs-card__title">创建趋势</h3>
                <span className="tcs-card__meta">
                  {data.granularity === 'month' ? '按月' : '按日'}
                  {data.start_date && data.end_date
                    ? ` · ${data.start_date} 至 ${data.end_date}`
                    : ''}
                </span>
              </header>
              <div className="tcs-card__body">
                <TrendChart data={data.trend} granularity={data.granularity} height={224} />
              </div>
            </section>

            <section className="tcs-card" aria-label="结单状态分布">
              <header className="tcs-card__head">
                <h3 className="tcs-card__title">结单状态分布</h3>
                <span className="tcs-card__meta">共 {statusItems.length} 种状态</span>
              </header>
              <div className="tcs-card__body tcs-status">
                <DonutChart items={statusItems} />
                <div className="tcs-status__table">
                  <Table
                    rowKey="code"
                    size="small"
                    border={false}
                    columns={statusColumns}
                    data={statusItems}
                    pagination={false}
                  />
                </div>
              </div>
            </section>

            <section className="tcs-card" aria-label="所属系统分布">
              <header className="tcs-card__head">
                <h3 className="tcs-card__title">所属系统 TOP</h3>
                <span className="tcs-card__meta">按用例数排序</span>
              </header>
              <div className="tcs-card__body">
                <BarList items={data.by_system} max={8} />
              </div>
            </section>

            <section className="tcs-card" aria-label="单位统计">
              <header className="tcs-card__head">
                <h3 className="tcs-card__title">单位统计</h3>
                <span className="tcs-card__meta">共 {data.by_unit.length} 项（含未填写）</span>
              </header>
              <div className="tcs-card__body">
                <Table
                  rowKey="label"
                  size="small"
                  columns={unitColumns}
                  data={data.by_unit}
                  pagination={false}
                  scroll={{ y: 252 }}
                />
              </div>
            </section>

            <section className="tcs-card" aria-label="任务执行人分布">
              <header className="tcs-card__head">
                <h3 className="tcs-card__title">任务执行人 TOP</h3>
                <span className="tcs-card__meta">按用例数排序</span>
              </header>
              <div className="tcs-card__body">
                <BarList items={data.by_executor} max={8} />
              </div>
            </section>
          </div>
        )}
      </Spin>

      {total > 0 ? (
        <Typography.Text type="secondary" className="tcs-footnote">
          统计口径：按用例创建时间计入；单位、执行人为空的数据归入“未填写”；时间跨度超过 120 天时趋势按月聚合。
        </Typography.Text>
      ) : null}
    </div>
  );
}
