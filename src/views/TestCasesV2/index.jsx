import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Checkbox,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Grid,
  Input,
  InputTag,
  Message,
  Pagination,
  Popconfirm,
  Popover,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from '@arco-design/web-react';
import {
  IconCode,
  IconDelete,
  IconEdit,
  IconEye,
  IconFilter,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSettings,
} from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import FormLabel from '../../components/common/FormLabel';
import { fetchDictionaryOptions } from '../../api/dictionaries';
import {
  createTestCase,
  deleteTestCase,
  fetchTestCaseDetail,
  fetchTestCases,
  updateTestCase,
} from '../../api/testCases';
import { formatDateTime } from '../../utils/format';
import './index.scss';

/**
 * 测试用例 V2
 * ------------------------------------------------------------------
 * 与字典管理保持一致的高密度布局：
 *  - 统计文本 + 工具栏；
 *  - 横向筛选条；
 *  - 原生 Arco Table 全宽铺满；
 *  - 不展示大标题、面板标题和卡片标题。
 */
const PRIORITY_OPTIONS = ['P0', 'P1', 'P2', 'P3'].map((value) => ({
  label: value,
  value,
}));

const PRIORITY_COLOR = {
  P0: 'red',
  P1: 'orange',
  P2: 'arcoblue',
  P3: 'gray',
};

/* ---------------- 列配置：可勾选显示、可拖动排序 ---------------- */
const COLUMN_STORAGE_KEY = 'tp.test-cases-v2.column-config';
const COLUMN_ORDER_DEFAULT = [
  'name',
  'system_name',
  'unit',
  'close_status',
  'executors',
  'issue_description',
  'script_count',
  'created_at',
];
const COLUMN_LABELS = {
  name: '用例名称 / 业务编号',
  system_name: '所属系统',
  unit: '单位',
  close_status: '结单状态',
  executors: '任务执行人',
  issue_description: '问题描述',
  script_count: '关联脚本',
  created_at: '创建时间',
};

const readColumnConfig = () => {
  const fallback = { order: [...COLUMN_ORDER_DEFAULT], hidden: [] };
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);

    const order = Array.isArray(parsed?.order)
      ? parsed.order.filter(
          (key, index, list) =>
            COLUMN_ORDER_DEFAULT.includes(key) && list.indexOf(key) === index,
        )
      : [];
    for (const key of COLUMN_ORDER_DEFAULT) {
      if (!order.includes(key)) order.push(key);
    }

    // 不允许把列全部隐藏，兜底保留第一列
    const hidden = Array.isArray(parsed?.hidden)
      ? parsed.hidden.filter((key) => COLUMN_ORDER_DEFAULT.includes(key))
      : [];
    if (hidden.length >= COLUMN_ORDER_DEFAULT.length) hidden.splice(1);

    return { order, hidden };
  } catch {
    return fallback;
  }
};

const INITIAL_FILTERS = {
  keyword: '',
  systemName: undefined,
  priority: undefined,
  closeStatus: undefined,
  issueDescription: '',
};

const INITIAL_QUERY = {
  page: 1,
  pageSize: 20,
  keyword: '',
  systemName: '',
  priority: '',
  closeStatus: '',
  issueDescription: '',
};

const INITIAL_FORM = {
  case_no: '',
  name: '',
  system_name: undefined,
  unit: '',
  executors: [],
  priority: undefined,
  precondition: '',
  test_steps: '',
  expected_result: '',
  close_status: undefined,
  issue_description: '',
  remark: '',
};

const nullIfEmpty = (value) => {
  if (typeof value !== 'string') return null;
  return value.trim() ? value : null;
};

// 用例名称非必填，为空时统一展示占位文案，避免出现空白单元格
const CASE_NAME_PLACEHOLDER = '未命名用例';
const caseDisplayName = (value) =>
  typeof value === 'string' && value.trim() ? value : CASE_NAME_PLACEHOLDER;

function PriorityTag({ priority }) {
  if (!priority) return <Typography.Text type="secondary">—</Typography.Text>;
  return <Tag color={PRIORITY_COLOR[priority] || 'gray'}>{priority}</Tag>;
}

function CaseFormFields({ systemOptions, closeStatusOptions }) {
  return (
    <>
      <Divider orientation="left">基本信息</Divider>
      <Grid.Row gutter={16}>
        <Grid.Col xs={24} md={12}>
          <Form.Item
            label={<FormLabel>用例名称</FormLabel>}
            field="name"
            extra="非必填，留空时仅以业务编号标识"
            rules={[{ maxLength: 128, message: '最多 128 个字符' }]}
          >
            <Input placeholder="例如：登录流程冒烟测试" maxLength={128} showWordLimit />
          </Form.Item>
        </Grid.Col>
        <Grid.Col xs={24} md={12}>
          <Form.Item
            label={<FormLabel required>业务编号</FormLabel>}
            field="case_no"
            rules={[
              { required: true, message: '请输入业务编号' },
              { maxLength: 64, message: '最多 64 个字符' },
            ]}
          >
            <Input placeholder="例如：DAS-20261026-002" maxLength={64} showWordLimit />
          </Form.Item>
        </Grid.Col>
        <Grid.Col xs={24} md={12}>
          <Form.Item
            label={<FormLabel required>所属系统</FormLabel>}
            field="system_name"
            rules={[{ required: true, message: '请选择所属系统' }]}
          >
            <Select placeholder="选择所属系统" options={systemOptions} />
          </Form.Item>
        </Grid.Col>
        <Grid.Col xs={24} md={12}>
          <Form.Item
            label={<FormLabel>单位</FormLabel>}
            field="unit"
            rules={[{ maxLength: 128, message: '最多 128 个字符' }]}
          >
            <Input placeholder="例如：声像档案管理系统组" maxLength={128} showWordLimit />
          </Form.Item>
        </Grid.Col>
        <Grid.Col xs={24} md={12}>
          <Form.Item label={<FormLabel>优先级</FormLabel>} field="priority">
            <Select allowClear placeholder="选择优先级" options={PRIORITY_OPTIONS} />
          </Form.Item>
        </Grid.Col>
        <Grid.Col xs={24} md={12}>
          <Form.Item
            label={<FormLabel>任务执行人</FormLabel>}
            field="executors"
            extra="输入姓名后按回车添加，支持多个执行人"
          >
            <InputTag
              allowClear
              placeholder="输入姓名后回车，支持多个"
              maxTagCount={{ count: 10, render: (invisibleCount) => `+${invisibleCount}` }}
            />
          </Form.Item>
        </Grid.Col>
      </Grid.Row>

      <Divider orientation="left">结单信息</Divider>
      <Grid.Row gutter={16}>
        <Grid.Col xs={24} md={12}>
          <Form.Item label={<FormLabel>结单状态</FormLabel>} field="close_status">
            <Select
              allowClear
              placeholder="选择结单状态"
              options={closeStatusOptions}
            />
          </Form.Item>
        </Grid.Col>
        <Grid.Col xs={24}>
          <Form.Item label={<FormLabel>问题描述</FormLabel>} field="issue_description">
            <Input.TextArea
              placeholder="填写问题现象，例如：批量修改页面，修改完字段提交，已修改成功，但窗口不主动关闭，也不提示修改成功，要手动关闭。"
              autoSize={{ minRows: 3, maxRows: 8 }}
              maxLength={2000}
              showWordLimit
            />
          </Form.Item>
        </Grid.Col>
      </Grid.Row>

      <Divider orientation="left">测试内容</Divider>
      <Grid.Row gutter={16}>
        <Grid.Col xs={24} md={12}>
          <Form.Item label={<FormLabel>前置条件</FormLabel>} field="precondition">
            <Input.TextArea
              placeholder="填写执行用例前需要满足的条件"
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </Form.Item>
        </Grid.Col>
        <Grid.Col xs={24} md={12}>
          <Form.Item label={<FormLabel>预期结果</FormLabel>} field="expected_result">
            <Input.TextArea
              placeholder="填写期望的测试结果"
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </Form.Item>
        </Grid.Col>
        <Grid.Col xs={24}>
          <Form.Item label={<FormLabel>测试步骤</FormLabel>} field="test_steps">
            <Input.TextArea
              placeholder="按顺序填写测试步骤"
              autoSize={{ minRows: 4, maxRows: 10 }}
            />
          </Form.Item>
        </Grid.Col>
        <Grid.Col xs={24}>
          <Form.Item label={<FormLabel>用例备注</FormLabel>} field="remark">
            <Input.TextArea
              placeholder="补充维护说明"
              autoSize={{ minRows: 2, maxRows: 4 }}
              maxLength={500}
              showWordLimit
            />
          </Form.Item>
        </Grid.Col>
      </Grid.Row>
    </>
  );
}

function withFallbackOptions(options, values) {
  const result = [...options];
  for (const value of values.filter(Boolean)) {
    if (!result.some((item) => item.value === value)) {
      result.push({ label: value, value });
    }
  }
  return result;
}

export default function TestCasesV2() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [query, setQuery] = useState(INITIAL_QUERY);
  const [filterDraft, setFilterDraft] = useState(INITIAL_FILTERS);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [systemDictionary, setSystemDictionary] = useState([]);
  const [closeStatusDictionary, setCloseStatusDictionary] = useState([]);

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const sheetBodyRef = useRef(null);
  const [tableViewportHeight, setTableViewportHeight] = useState(400);

  // 列显示 / 列顺序配置，保存在本地，刷新后保持用户习惯
  const [columnConfig, setColumnConfig] = useState(readColumnConfig);
  const dragColumnRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columnConfig));
    } catch {
      // 忽略隐私模式等导致的存储异常
    }
  }, [columnConfig]);

  useEffect(() => {
    let cancelled = false;

    fetchDictionaryOptions('system_name')
      .then((result) => {
        if (cancelled) return;
        setSystemDictionary(
          (result?.items || []).map((item) => ({
            label: item.label,
            // test_cases.system_name 存储展示名称，保持与现有用例数据兼容。
            value: item.label,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setSystemDictionary([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchDictionaryOptions('close_status')
      .then((result) => {
        if (!cancelled) setCloseStatusDictionary(result?.items || []);
      })
      .catch(() => {
        if (!cancelled) setCloseStatusDictionary([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = { page: query.page, page_size: query.pageSize };
    if (query.keyword.trim()) params.keyword = query.keyword.trim();
    if (query.systemName.trim()) params.system_name = query.systemName.trim();
    if (query.priority) params.priority = query.priority;
    if (query.closeStatus) params.close_status = query.closeStatus;
    if (query.issueDescription) params.issue_description = query.issueDescription;

    fetchTestCases(params)
      .then((result) => {
        if (cancelled) return;
        setRows(result?.items || []);
        setTotal(result?.total || 0);
        setPages(result?.pages || 0);
      })
      .catch(() => {
        if (cancelled) return;
        setRows([]);
        setTotal(0);
        setPages(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, refreshKey]);

  useEffect(() => {
    const body = sheetBodyRef.current;
    if (!body) return undefined;

    let frame = 0;
    const measure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const headerHeight = body.querySelector('.arco-table-header')?.offsetHeight || 33;
        const nextHeight = Math.max(Math.round(body.clientHeight - headerHeight), 120);
        setTableViewportHeight((current) => (current === nextHeight ? current : nextHeight));
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    window.addEventListener('resize', measure);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [filtersOpen]);

  const pageHighPriority = useMemo(
    () => rows.filter((item) => item.priority === 'P0' || item.priority === 'P1').length,
    [rows],
  );

  const activeFilterCount = useMemo(
    () =>
      [
        query.keyword,
        query.systemName,
        query.priority,
        query.closeStatus,
        query.issueDescription,
      ].filter(Boolean).length,
    [
      query.keyword,
      query.systemName,
      query.priority,
      query.closeStatus,
      query.issueDescription,
    ],
  );

  const systemOptions = useMemo(() => {
    const options = [...systemDictionary];
    const extraValues = [filterDraft.systemName, editing?.system_name].filter(Boolean);

    for (const value of extraValues) {
      if (!options.some((item) => item.value === value)) {
        options.push({ label: value, value });
      }
    }

    return options;
  }, [editing?.system_name, filterDraft.systemName, systemDictionary]);

  const closeStatusOptions = useMemo(
    () =>
      withFallbackOptions(closeStatusDictionary, [
        filterDraft.closeStatus,
        editing?.close_status,
      ]),
    [closeStatusDictionary, editing?.close_status, filterDraft.closeStatus],
  );

  const dictionaryLabel = (options, value) =>
    options.find((item) => item.value === value)?.label || value;

  const applyFilters = () => {
    setQuery((previous) => ({
      ...previous,
      page: 1,
      keyword: filterDraft.keyword.trim(),
      systemName: filterDraft.systemName?.trim() || '',
      priority: filterDraft.priority || '',
      closeStatus: filterDraft.closeStatus || '',
      issueDescription: filterDraft.issueDescription || '',
    }));
  };

  const handleReset = () => {
    setFilterDraft(INITIAL_FILTERS);
    setQuery({ ...INITIAL_QUERY });
    setRefreshKey((key) => key + 1);
  };

  const openCreate = () => {
    form.resetFields();
    setEditing(null);
    setFormVisible(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setFormVisible(true);
  };

  const applyFormValues = () => {
    if (editing) form.setFieldsValue(editing);
  };

  const closeForm = () => {
    if (submitting) return;
    setFormVisible(false);
    setEditing(null);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    const isEdit = Boolean(editing);

    try {
      const payload = {
        case_no: values.case_no.trim(),
        // 用例名称非必填，留空时按 null 存储，避免出现空字符串脏数据
        name: nullIfEmpty(values.name),
        system_name: values.system_name.trim(),
        unit: nullIfEmpty(values.unit),
        executors: (Array.isArray(values.executors) ? values.executors : [])
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean),
        priority: values.priority || null,
        precondition: nullIfEmpty(values.precondition),
        test_steps: nullIfEmpty(values.test_steps),
        expected_result: nullIfEmpty(values.expected_result),
        close_status: values.close_status || null,
        issue_description: nullIfEmpty(values.issue_description),
        remark: nullIfEmpty(values.remark),
      };

      if (isEdit) {
        await updateTestCase(editing.id, payload);
        Message.success('测试用例已更新');
      } else {
        await createTestCase(payload);
        Message.success('测试用例创建成功');
      }

      setFormVisible(false);
      setEditing(null);
      form.resetFields();
      setQuery((previous) => ({ ...previous, page: isEdit ? previous.page : 1 }));
      setRefreshKey((key) => key + 1);
    } catch {
      // request.js 已统一提示错误。
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await deleteTestCase(record.id);
      Message.success('测试用例已删除');
      const nextPage = rows.length === 1 && query.page > 1 ? query.page - 1 : query.page;
      setQuery((previous) => ({ ...previous, page: nextPage }));
      setRefreshKey((key) => key + 1);
    } catch {
      // 有关联脚本时，后端返回 409，request.js 会统一提示。
    }
  };

  const openDetail = async (record) => {
    setDetail(record);
    setDetailVisible(true);
    setDetailLoading(true);
    try {
      setDetail(await fetchTestCaseDetail(record.id));
    } catch {
      setDetailVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const editFromDetail = () => {
    if (!detail) return;
    setDetailVisible(false);
    setEditing(detail);
    setFormVisible(true);
  };

  const goToScripts = (record) => {
    navigate('/test-scripts', {
      state: {
        caseId: record.id,
        caseNo: record.case_no,
        caseLabel: `${record.case_no} · ${caseDisplayName(record.name)}`,
        case: {
          id: record.id,
          case_no: record.case_no,
          name: record.name,
          system_name: record.system_name,
        },
      },
    });
  };

  const visibleColumnKeys = columnConfig.order.filter(
    (key) => !columnConfig.hidden.includes(key),
  );

  const toggleColumn = (key, checked) => {
    setColumnConfig((previous) => {
      const hidden = checked
        ? previous.hidden.filter((item) => item !== key)
        : [...new Set([...previous.hidden, key])];
      // 至少保留一列，避免表格变成空白
      if (hidden.length >= COLUMN_ORDER_DEFAULT.length) return previous;
      return { ...previous, hidden };
    });
  };

  const resetColumns = () => {
    dragColumnRef.current = null;
    setColumnConfig({ order: [...COLUMN_ORDER_DEFAULT], hidden: [] });
  };

  const moveColumn = (sourceKey, targetKey) => {
    if (!sourceKey || !targetKey || sourceKey === targetKey) return;
    setColumnConfig((previous) => {
      const order = previous.order.filter((key) => key !== sourceKey);
      const index = order.indexOf(targetKey);
      order.splice(index < 0 ? order.length : index, 0, sourceKey);
      return { ...previous, order };
    });
  };

  const headerDragProps = (key) => ({
    draggable: true,
    style: { cursor: 'grab' },
    onDragStart: (event) => {
      dragColumnRef.current = key;
      event.dataTransfer.effectAllowed = 'move';
      try {
        event.dataTransfer.setData('text/plain', key);
      } catch {
        // 部分浏览器在非用户手势下会抛错，忽略即可
      }
    },
    onDragOver: (event) => {
      if (dragColumnRef.current && dragColumnRef.current !== key) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }
    },
    onDrop: (event) => {
      event.preventDefault();
      moveColumn(dragColumnRef.current, key);
      dragColumnRef.current = null;
    },
    onDragEnd: () => {
      dragColumnRef.current = null;
    },
  });

  const columns = [
    {
      title: '#',
      dataIndex: '__index',
      width: 48,
      align: 'center',
      fixed: 'left',
      render: (_, __, index) => (
        <Typography.Text type="secondary">
          {(query.page - 1) * query.pageSize + index + 1}
        </Typography.Text>
      ),
    },
    {
      title: '用例名称 / 业务编号',
      key: 'name',
      dataIndex: 'name',
      width: 290,
      render: (value, record) => (
        <div className="tcv2-name-cell">
          <span className={`tcv2-name${value ? '' : ' is-placeholder'}`} title={value || ''}>
            {caseDisplayName(value)}
          </span>
          <span className="tcv2-case-no">{record.case_no}</span>
        </div>
      ),
    },
    {
      title: '所属系统',
      key: 'system_name',
      dataIndex: 'system_name',
      width: 140,
      render: (value) => <Tag>{value}</Tag>,
    },
    {
      title: '单位',
      key: 'unit',
      dataIndex: 'unit',
      width: 120,
      render: (value) =>
        value ? (
          <span className="tcv2-ellipsis" title={value}>
            {value}
          </span>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: '结单状态',
      key: 'close_status',
      dataIndex: 'close_status',
      width: 110,
      render: (value) =>
        value ? (
          <Tag color={{ 0: 'green', 1: 'red', 2: 'orange' }[value] || 'gray'}>
            {dictionaryLabel(closeStatusOptions, value)}
          </Tag>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: '任务执行人',
      key: 'executors',
      dataIndex: 'executors',
      width: 150,
      render: (value) =>
        Array.isArray(value) && value.length ? (
          <span className="tcv2-ellipsis" title={value.join('、')}>
            {value.join('、')}
          </span>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: '问题描述',
      key: 'issue_description',
      dataIndex: 'issue_description',
      width: 220,
      render: (value) =>
        value ? (
          <span className="tcv2-issue" title={value}>
            {value}
          </span>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: '关联脚本',
      key: 'script_count',
      dataIndex: 'script_count',
      width: 92,
      render: (value) => <Tag color={value > 0 ? 'arcoblue' : 'gray'}>{value} 个</Tag>,
    },
    {
      title: '创建时间',
      key: 'created_at',
      dataIndex: 'created_at',
      width: 150,
      render: (value) => (
        <Typography.Text type="secondary">{formatDateTime(value)}</Typography.Text>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 116,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          <Tooltip content="查看详情">
            <Button
              type="text"
              size="mini"
              icon={<IconEye />}
              onClick={() => openDetail(record)}
              aria-label="查看测试用例"
            />
          </Tooltip>
          <Tooltip content="编辑">
            <Button
              type="text"
              size="mini"
              icon={<IconEdit />}
              onClick={() => openEdit(record)}
              aria-label="编辑测试用例"
            />
          </Tooltip>
          <Tooltip content="查看脚本资产">
            <Button
              type="text"
              size="mini"
              icon={<IconCode />}
              onClick={() => goToScripts(record)}
              aria-label="查看脚本资产"
            />
          </Tooltip>
          <Popconfirm
            title="确认删除这个测试用例？"
            content="删除后不可恢复；存在关联脚本时需先删除脚本。"
            okText="删除"
            cancelText="取消"
            okButtonProps={{ status: 'danger' }}
            position="br"
            style={{ width: 260, maxWidth: 'calc(100vw - 32px)' }}
            onOk={() => handleDelete(record)}
          >
            <Tooltip content="删除">
              <Button
                type="text"
                size="mini"
                status="danger"
                icon={<IconDelete />}
                aria-label="删除测试用例"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const columnMap = Object.fromEntries(
    columns.filter((column) => column.key).map((column) => [column.key, column]),
  );

  // 固定「序号」在最左、「操作」在最右，中间列按用户配置的顺序与显隐渲染
  const tableColumns = [
    columns[0],
    ...visibleColumnKeys.map((key) => ({
      ...columnMap[key],
      onHeaderCell: () => headerDragProps(key),
    })),
    columns[columns.length - 1],
  ];

  const tableScrollWidth =
    columns[0].width +
    columns[columns.length - 1].width +
    visibleColumnKeys.reduce((sum, key) => sum + (columnMap[key]?.width || 0), 0);

  const metrics = [
    { label: '用例总数', value: total, unit: '条' },
    { label: '本页记录', value: rows.length, unit: '条' },
    { label: '本页高优', value: pageHighPriority, unit: '条', accent: pageHighPriority > 0 },
    { label: '总页数', value: pages, unit: '页' },
  ];

  return (
    <div className="tp-page tcv2">
      <div className="tcv2-toolbar">
        <div className="tcv2-metrics">
          {metrics.map((item) => (
            <span
              key={item.label}
              className={`tcv2-metric${item.accent ? ' is-accent' : ''}`}
            >
              {item.label}：<strong>{item.value}</strong>
              {item.unit}
            </span>
          ))}
        </div>

        <Space size={6} wrap>
          <Button
            size="small"
            icon={<IconRefresh />}
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            刷新
          </Button>
          <Button
            size="small"
            icon={<IconFilter />}
            type={filtersOpen ? 'secondary' : 'default'}
            onClick={() => setFiltersOpen((value) => !value)}
          >
            {filtersOpen ? '收起筛选' : '筛选'}
            {activeFilterCount > 0 ? ` ${activeFilterCount}` : ''}
          </Button>
          <Popover
            trigger="click"
            position="br"
            content={
              <div className="tcv2-columns">
                <div className="tcv2-columns__head">
                  <span className="tcv2-columns__title">显示列</span>
                  <Button type="text" size="mini" onClick={resetColumns}>
                    重置
                  </Button>
                </div>
                <div className="tcv2-columns__list">
                  {columnConfig.order.map((key) => (
                    <Checkbox
                      key={key}
                      checked={!columnConfig.hidden.includes(key)}
                      onChange={(checked) => toggleColumn(key, checked)}
                    >
                      {COLUMN_LABELS[key]}
                    </Checkbox>
                  ))}
                </div>
                <p className="tcv2-columns__hint">勾选控制显示列，拖动表头可调整列顺序</p>
              </div>
            }
          >
            <Button size="small" icon={<IconSettings />}>
              列设置
            </Button>
          </Popover>
          <Button size="small" type="primary" icon={<IconPlus />} onClick={openCreate}>
            新增用例
          </Button>
        </Space>
      </div>

      {filtersOpen && (
        <div className="tcv2-filters">
          <div className="tcv2-filter-field">
            <span className="tcv2-filter-label">名称 / 业务编号</span>
            <Input
              allowClear
              prefix={<IconSearch />}
              placeholder="搜索用例名称或业务编号"
              value={filterDraft.keyword}
              onChange={(value) =>
                setFilterDraft((previous) => ({ ...previous, keyword: value }))
              }
              onPressEnter={applyFilters}
            />
          </div>
          <div className="tcv2-filter-field">
            <span className="tcv2-filter-label">所属系统</span>
            <Select
              allowClear
              placeholder="全部系统"
              options={systemOptions}
              value={filterDraft.systemName}
              onChange={(value) =>
                setFilterDraft((previous) => ({ ...previous, systemName: value }))
              }
            />
          </div>
          <div className="tcv2-filter-field tcv2-filter-field--priority">
            <span className="tcv2-filter-label">优先级</span>
            <Select
              allowClear
              placeholder="全部优先级"
              options={PRIORITY_OPTIONS}
              value={filterDraft.priority}
              onChange={(value) =>
                setFilterDraft((previous) => ({ ...previous, priority: value }))
              }
            />
          </div>
          <div className="tcv2-filter-field tcv2-filter-field--status">
            <span className="tcv2-filter-label">结单状态</span>
            <Select
              allowClear
              placeholder="全部状态"
              options={closeStatusOptions}
              value={filterDraft.closeStatus}
              onChange={(value) =>
                setFilterDraft((previous) => ({ ...previous, closeStatus: value }))
              }
            />
          </div>
          <div className="tcv2-filter-field tcv2-filter-field--issue">
            <span className="tcv2-filter-label">问题描述</span>
            <Input
              allowClear
              prefix={<IconSearch />}
              placeholder="搜索问题描述"
              value={filterDraft.issueDescription}
              onChange={(value) =>
                setFilterDraft((previous) => ({ ...previous, issueDescription: value }))
              }
              onPressEnter={applyFilters}
            />
          </div>
          <div className="tcv2-filter-actions">
            <Button size="small" type="primary" onClick={applyFilters}>
              查询
            </Button>
            <Button size="small" onClick={handleReset}>
              清空
            </Button>
          </div>
        </div>
      )}

      <section className="tcv2-sheet" aria-label="用例列表">
        <div className="tcv2-sheet__body" ref={sheetBodyRef}>
          <Table
            rowKey="id"
            columns={tableColumns}
            data={rows}
            loading={loading}
            size="small"
            border
            borderCell
            scroll={{ x: tableScrollWidth, y: tableViewportHeight }}
            pagination={false}
          />
        </div>

        <footer className="tcv2-sheet__foot">
          <span className="tcv2-sheet__count">共 {total} 条</span>
          <Pagination
            size="small"
            current={query.page}
            pageSize={query.pageSize}
            total={total}
            showJumper
            sizeCanChange
            sizeOptions={[20, 50, 100]}
            onChange={(page, pageSize) =>
              setQuery((previous) => ({ ...previous, page, pageSize }))
            }
          />
        </footer>
      </section>

      <Drawer
        title={editing ? '编辑测试用例' : '新增测试用例'}
        visible={formVisible}
        onOk={() => form.submit()}
        onCancel={closeForm}
        confirmLoading={submitting}
        okText={editing ? '保存修改' : '创建'}
        cancelText="取消"
        width="min(860px, 100vw)"
        unmountOnExit
        focusLock
        afterOpen={applyFormValues}
        afterClose={() => form.resetFields()}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={INITIAL_FORM}
          onSubmit={handleSubmit}
          requiredSymbol={false}
        >
          <CaseFormFields
            systemOptions={systemOptions}
            closeStatusOptions={closeStatusOptions}
          />
        </Form>
      </Drawer>

      <Drawer
        title="测试用例详情"
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width="min(720px, 100vw)"
        footer={
          detail ? (
            <Space>
              <Button onClick={() => setDetailVisible(false)}>关闭</Button>
              <Button icon={<IconCode />} onClick={() => goToScripts(detail)}>
                查看脚本资产
              </Button>
              <Button type="primary" icon={<IconEdit />} onClick={editFromDetail}>
                编辑
              </Button>
            </Space>
          ) : null
        }
      >
        <Spin loading={detailLoading} style={{ width: '100%' }}>
          {detail ? (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Typography.Title heading={5}>{caseDisplayName(detail.name)}</Typography.Title>
                <Space wrap>
                  <Tag>{detail.system_name}</Tag>
                  {detail.unit ? <Tag color="purple">{detail.unit}</Tag> : null}
                  <PriorityTag priority={detail.priority} />
                  <Tag color={detail.script_count > 0 ? 'arcoblue' : 'gray'}>
                    {detail.script_count} 个脚本
                  </Tag>
                </Space>
              </div>

              <Descriptions
                column={{ xs: 1, sm: 2 }}
                border
                data={[
                  { label: '业务编号', value: detail.case_no },
                  { label: '所属系统', value: detail.system_name },
                  { label: '单位', value: detail.unit || '—' },
                  {
                    label: '任务执行人',
                    value:
                      Array.isArray(detail.executors) && detail.executors.length
                        ? detail.executors.join('、')
                        : '—',
                  },
                  { label: '优先级', value: <PriorityTag priority={detail.priority} /> },
                  {
                    label: '结单状态',
                    value: detail.close_status
                      ? dictionaryLabel(closeStatusOptions, detail.close_status)
                      : '—',
                  },
                  { label: '创建时间', value: formatDateTime(detail.created_at) },
                ]}
              />

              <div className="space-y-2">
                <Typography.Text type="secondary">问题描述</Typography.Text>
                <Input.TextArea
                  value={detail.issue_description || ''}
                  placeholder="暂无问题描述"
                  readOnly
                  autoSize={{ minRows: 3, maxRows: 8 }}
                />
              </div>

              <div className="space-y-2">
                <Typography.Text type="secondary">前置条件</Typography.Text>
                <Input.TextArea
                  value={detail.precondition || ''}
                  placeholder="暂无前置条件"
                  readOnly
                  autoSize={{ minRows: 2, maxRows: 6 }}
                />
              </div>
              <div className="space-y-2">
                <Typography.Text type="secondary">测试步骤</Typography.Text>
                <Input.TextArea
                  value={detail.test_steps || ''}
                  placeholder="暂无测试步骤"
                  readOnly
                  autoSize={{ minRows: 4, maxRows: 12 }}
                />
              </div>
              <div className="space-y-2">
                <Typography.Text type="secondary">预期结果</Typography.Text>
                <Input.TextArea
                  value={detail.expected_result || ''}
                  placeholder="暂无预期结果"
                  readOnly
                  autoSize={{ minRows: 2, maxRows: 6 }}
                />
              </div>
              <div className="space-y-2">
                <Typography.Text type="secondary">备注</Typography.Text>
                <Input.TextArea
                  value={detail.remark || ''}
                  placeholder="暂无备注"
                  readOnly
                  autoSize={{ minRows: 2, maxRows: 4 }}
                />
              </div>
            </Space>
          ) : null}
        </Spin>
      </Drawer>
    </div>
  );
}
