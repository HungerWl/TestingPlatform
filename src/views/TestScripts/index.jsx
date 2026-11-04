import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Form,
  Grid,
  Input,
  Message,
  Pagination,
  Popconfirm,
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
  IconDownload,
  IconEdit,
  IconEye,
  IconFile,
  IconFilter,
  IconPlayArrow,
  IconPlus,
  IconRefresh,
  IconSearch,
} from '@arco-design/web-react/icon';
import { useLocation, useNavigate } from 'react-router-dom';
import FormLabel from '../../components/common/FormLabel';
import useMediaQuery from '../../hooks/useMediaQuery';
import ScriptFilePicker from '../../components/test/ScriptFilePicker';
import TestCaseSelect from '../../components/test/TestCaseSelect';
import {
  deleteTestScript,
  downloadTestScript,
  executeTestScriptTrace,
  fetchTestScriptDetail,
  fetchTestScripts,
  previewTestScript,
  replaceTestScriptFile,
  updateTestScript,
  updateTestScriptTestCases,
  uploadTestScript,
} from '../../api/testScripts';
import { formatDateTime, formatFileSize } from '../../utils/format';
import './index.scss';

const SCRIPT_TYPES = [
  {
    value: 'playwright-python',
    label: 'Playwright · Python',
    short: 'Playwright · Python',
    color: 'green',
  },
  {
    value: 'playwright-ts',
    label: 'Playwright · TypeScript',
    short: 'Playwright · TypeScript',
    color: 'arcoblue',
  },
  {
    value: 'playwright-js',
    label: 'Playwright · JavaScript',
    short: 'Playwright · JavaScript',
    color: 'orange',
  },
];

const SCRIPT_TYPE_MAP = Object.fromEntries(
  SCRIPT_TYPES.map((item) => [item.value, item]),
);

const INITIAL_QUERY = {
  page: 1,
  pageSize: 10,
  keyword: '',
  scriptType: '',
  caseNo: '',
};

const INITIAL_FORM = {
  test_case_ids: [],
  name: '',
  script_type: undefined,
  version: '1.0.0',
  file: undefined,
  remark: '',
};

const nullIfEmpty = (value) => {
  if (typeof value !== 'string') return null;
  return value.trim() ? value : null;
};

const normalizeCaseIds = (ids = []) => [...new Set(ids.filter(Boolean))].sort();

// Trace 执行由 Node 版 Playwright Worker 完成，暂不支持 .py 脚本。
const TRACE_SUPPORTED_EXTENSIONS = ['.js', '.mjs', '.cjs', '.ts'];
const supportsTrace = (record) =>
  TRACE_SUPPORTED_EXTENSIONS.includes((record?.file_ext || '').toLowerCase());

const saveBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName || 'download';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

function ScriptTypeTag({ type, compact = false }) {
  if (!type) return <Typography.Text type="secondary">—</Typography.Text>;
  const item = SCRIPT_TYPE_MAP[type] || { label: type, color: 'gray' };
  const tag = <Tag color={item.color}>{compact ? item.short || item.label : item.label}</Tag>;
  if (!compact) return tag;
  return <Tooltip content={item.label}>{tag}</Tooltip>;
}

function CaseSummary({ testCases = [] }) {
  if (!testCases.length) return <Typography.Text type="secondary">—</Typography.Text>;

  const first = testCases[0];
  // 用例名称非必填，为空时统一展示占位文案
  const caseName = first.name?.trim() ? first.name : '未命名用例';

  return (
    <div className="tsv2-case-cell">
      <span className="tsv2-case-name" title={caseName}>
        {caseName}
      </span>
      <Tag color="arcoblue">{first.case_no}</Tag>
      {testCases.length > 1 && <Tag color="gray">+{testCases.length - 1}</Tag>}
    </div>
  );
}

function ScriptFormFields({ editing, lockedCase }) {
  const selectedCases =
    editing?.test_cases || (lockedCase ? [lockedCase] : []);

  return (
    <>
      <Divider orientation="left">脚本信息</Divider>
      <Grid.Row gutter={16}>
        <Grid.Col xs={24}>
          <Form.Item
            label={<FormLabel required>关联测试用例</FormLabel>}
            field="test_case_ids"
            rules={[
              {
                validator: (value, callback) => {
                  if (!Array.isArray(value) || value.length === 0) {
                    callback('至少选择一个测试用例');
                  } else {
                    callback();
                  }
                },
              },
            ]}
          >
            <TestCaseSelect
              mode="multiple"
              selectedCases={selectedCases}
              placeholder="搜索并选择测试用例，可多选"
            />
          </Form.Item>
        </Grid.Col>
        <Grid.Col xs={24} md={12}>
          <Form.Item
            label={<FormLabel required>脚本名称</FormLabel>}
            field="name"
            rules={[
              { required: true, message: '请输入脚本名称' },
              { maxLength: 128, message: '最多 128 个字符' },
            ]}
          >
            <Input placeholder="例如：登录主链路脚本" maxLength={128} showWordLimit />
          </Form.Item>
        </Grid.Col>
        <Grid.Col xs={24} md={12}>
          <Form.Item label={<FormLabel>脚本类型</FormLabel>} field="script_type">
            <Select allowClear placeholder="选择 Playwright 技术栈" options={SCRIPT_TYPES} />
          </Form.Item>
        </Grid.Col>
        <Grid.Col xs={24} md={12}>
          <Form.Item
            label={<FormLabel required>业务版本号</FormLabel>}
            field="version"
            rules={[
              { required: true, message: '请输入业务版本号' },
              { maxLength: 64, message: '最多 64 个字符' },
            ]}
          >
            <Input placeholder="1.0.0" maxLength={64} />
          </Form.Item>
        </Grid.Col>
      </Grid.Row>

      <Divider orientation="left">{editing ? '替换文件（可选）' : '脚本文件'}</Divider>
      <Form.Item
        label={
          editing ? <FormLabel>新文件</FormLabel> : <FormLabel required>上传文件</FormLabel>
        }
        field="file"
        extra={
          editing
            ? '不选择新文件时保留当前文件；选择后上传成功会删除旧文件。'
            : '保存时会同时上传文件并创建脚本。'
        }
        rules={[
          {
            validator: (value, callback) => {
              if (!editing && !(value instanceof File)) {
                callback('请选择脚本文件');
                return;
              }
              callback();
            },
          },
        ]}
      >
        <ScriptFilePicker
          currentFileName={editing?.file_name}
          currentFileSize={editing?.file_size}
        />
      </Form.Item>

      <Form.Item label={<FormLabel>脚本备注</FormLabel>} field="remark">
        <Input.TextArea
          placeholder="补充脚本维护说明"
          autoSize={{ minRows: 2, maxRows: 4 }}
          maxLength={500}
          showWordLimit
        />
      </Form.Item>
    </>
  );
}

export default function TestScripts() {
  const location = useLocation();
  const navigate = useNavigate();
  // Descriptions 的 column 只在命中对应断点时生效，这里按屏宽显式给出列数。
  const isNarrowScreen = useMediaQuery('(max-width: 639px)');
  const [filterForm] = Form.useForm();
  const [form] = Form.useForm();

  const [query, setQuery] = useState(INITIAL_QUERY);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [lockedCase, setLockedCase] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  // 正在执行并生成 Trace 的脚本 ID；执行期间禁止重复触发。
  const [traceId, setTraceId] = useState(null);

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewRecord, setPreviewRecord] = useState(null);
  const [previewContent, setPreviewContent] = useState('');

  const [filtersOpen, setFiltersOpen] = useState(true);

  // 表格视口高度：与测试用例 V2 一致，按筛选条容器实际尺寸动态测量，表体内部滚动。
  const sheetBodyRef = useRef(null);
  const [tableViewportHeight, setTableViewportHeight] = useState(400);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = { page: query.page, page_size: query.pageSize };
    if (query.keyword.trim()) params.keyword = query.keyword.trim();
    if (query.scriptType) params.script_type = query.scriptType;
    if (query.caseNo.trim()) params.case_no = query.caseNo.trim();

    fetchTestScripts(params)
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
    const state = location.state;
    if (!state?.caseId) return;

    const incomingCase =
      state.case || {
        id: state.caseId,
        case_no: state.caseNo,
        name: state.caseLabel?.split(' · ').slice(1).join(' · ') || '',
      };

    setLockedCase(incomingCase);
    filterForm.setFieldsValue({
      keyword: '',
      script_type: undefined,
      case_no: state.caseNo || '',
    });
    setQuery((previous) => ({
      ...previous,
      page: 1,
      keyword: '',
      scriptType: '',
      caseNo: state.caseNo || '',
    }));
    navigate(location.pathname, { replace: true, state: null });
  }, [filterForm, location.pathname, location.state, navigate]);

  const pageFileSize = useMemo(
    () => rows.reduce((sum, item) => sum + (Number(item.file_size) || 0), 0),
    [rows],
  );

  const activeFilterCount = useMemo(
    () => [query.keyword, query.scriptType, query.caseNo].filter(Boolean).length,
    [query.keyword, query.scriptType, query.caseNo],
  );

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

  const handleSearch = (values) => {
    const nextCaseNo = values.case_no?.trim() || '';
    if (lockedCase && nextCaseNo !== lockedCase.case_no) {
      setLockedCase(null);
    }

    setQuery((previous) => ({
      ...previous,
      page: 1,
      keyword: values.keyword?.trim() || '',
      scriptType: values.script_type || '',
      caseNo: nextCaseNo,
    }));
  };

  const handleReset = () => {
    filterForm.resetFields();
    setLockedCase(null);
    setQuery({ ...INITIAL_QUERY });
    setRefreshKey((key) => key + 1);
  };

  const openCreate = () => {
    form.resetFields();
    setEditing(null);
    setFormVisible(true);
  };

  const applyFormValues = () => {
    form.resetFields();
    if (editing) {
      form.setFieldsValue({
        test_case_ids: (editing.test_cases || []).map((item) => item.id),
        name: editing.name,
        script_type: editing.script_type || undefined,
        version: editing.version,
        file: undefined,
        remark: editing.remark || '',
      });
      return;
    }

    form.setFieldsValue({
      test_case_ids: lockedCase ? [lockedCase.id] : [],
      version: '1.0.0',
      file: undefined,
    });
  };

  const openEdit = async (record) => {
    setBusyId(record.id);
    try {
      const latest = await fetchTestScriptDetail(record.id);
      setEditing(latest);
      setFormVisible(true);
    } catch {
      // request.js 已统一提示错误。
    } finally {
      setBusyId(null);
    }
  };

  const closeForm = () => {
    if (submitting) return;
    setFormVisible(false);
    setEditing(null);
  };

  const handleSubmit = async (values) => {
    const isEdit = Boolean(editing);
    const file = values.file instanceof File ? values.file : null;
    const testCaseIds = normalizeCaseIds(values.test_case_ids || []);

    if (!testCaseIds.length) {
      Message.error('至少选择一个测试用例');
      return;
    }
    if (!isEdit && !file) {
      Message.error('请选择脚本文件');
      return;
    }

    setSubmitting(true);
    try {
      const metadata = {
        name: values.name.trim(),
        script_type: values.script_type || null,
        version: values.version.trim(),
        remark: nullIfEmpty(values.remark),
      };

      if (isEdit) {
        await updateTestScript(editing.id, metadata);

        const previousCaseIds = normalizeCaseIds(
          (editing.test_cases || []).map((item) => item.id),
        );
        if (previousCaseIds.join(',') !== testCaseIds.join(',')) {
          await updateTestScriptTestCases(editing.id, testCaseIds);
        }

        if (file) {
          await replaceTestScriptFile(editing.id, { file });
        }

        Message.success(file ? '脚本信息和文件已更新' : '脚本信息已更新');
      } else {
        const created = await uploadTestScript({
          file,
          testCaseIds,
          ...metadata,
        });
        Message.success(`脚本上传成功：${created.file_name}`);
      }

      setFormVisible(false);
      setEditing(null);
      setDetailVisible(false);
      form.resetFields();
      setQuery((previous) => ({ ...previous, page: 1 }));
      setRefreshKey((key) => key + 1);
    } catch {
      // request.js 已统一提示错误。
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await deleteTestScript(record.id);
      Message.success('脚本及当前文件已删除');
      const nextPage = rows.length === 1 && query.page > 1 ? query.page - 1 : query.page;
      setQuery((previous) => ({ ...previous, page: nextPage }));
      setRefreshKey((key) => key + 1);
    } catch {
      // request.js 已统一提示错误。
    }
  };

  const openDetail = async (record) => {
    setDetail(record);
    setDetailVisible(true);
    setDetailLoading(true);
    try {
      setDetail(await fetchTestScriptDetail(record.id));
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

  const handlePreview = async (record) => {
    setPreviewRecord(record);
    setPreviewVisible(true);
    setPreviewLoading(true);
    setPreviewContent('');
    try {
      setPreviewContent(await previewTestScript(record.id));
    } catch {
      setPreviewVisible(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (record) => {
    setBusyId(record.id);
    try {
      const { blob, fileName } = await downloadTestScript(record.id, record.file_name);
      saveBlob(blob, fileName || record.file_name || 'script-file');
      Message.success('文件下载已开始');
    } catch {
      // request.js 已统一提示错误。
    } finally {
      setBusyId(null);
    }
  };

  /**
   * 触发脚本执行并下载 trace.zip。
   * 后端 Worker 在内存中生成 trace 后流式返回，下载完成即释放，不落盘。
   */
  const handleExecutionTrace = async (record) => {
    if (!supportsTrace(record)) {
      Message.warning('Trace 执行仅支持 Playwright JavaScript / TypeScript 脚本');
      return;
    }
    if (traceId) return;

    setTraceId(record.id);
    const closeLoading = Message.loading({
      content: `正在执行「${record.name}」并生成 Trace，请稍候…`,
      duration: 0,
    });
    try {
      const { blob, fileName, traceCount } = await executeTestScriptTrace(record.id);
      saveBlob(blob, fileName || 'trace.zip');
      Message.success(
        traceCount > 1
          ? `执行完成，已打包 ${traceCount} 个 Trace 并开始下载`
          : '执行完成，Trace 已开始下载',
      );
    } catch {
      // request.js 已统一提示错误。
    } finally {
      if (typeof closeLoading === 'function') closeLoading();
      else closeLoading?.close?.();
      setTraceId(null);
    }
  };

  const detailCaseTags = (detail?.test_cases || []).map((item) => {
    const caseName = item.name?.trim() ? item.name : '未命名用例';
    return (
      <Tooltip key={item.id} content={`${item.case_no} · ${caseName}`}>
        <Tag color="arcoblue">
          <span className="tsv-detail__case-text">
            {item.case_no} · {caseName}
          </span>
        </Tag>
      </Tooltip>
    );
  });

  const columns = [
    {
      title: '#',
      dataIndex: '__index',
      width: 40,
      align: 'center',
      fixed: 'left',
      render: (_, __, index) => (
        <Typography.Text type="secondary">
          {(query.page - 1) * query.pageSize + index + 1}
        </Typography.Text>
      ),
    },
    {
      title: '脚本名称',
      dataIndex: 'name',
      width: 200,
      render: (value) => (
        <div className="tsv2-name-cell">
          <span className="tsv2-name" title={value}>
            {value}
          </span>
        </div>
      ),
    },
    {
      title: '脚本类型',
      dataIndex: 'script_type',
      width: 125,
      render: (value) => <ScriptTypeTag type={value} compact />,
    },
    {
      title: '关联用例',
      dataIndex: 'test_cases',
      width: 200,
      render: (value) => <CaseSummary testCases={value} />,
    },
    {
      title: '当前文件',
      dataIndex: 'file_name',
      width: 160,
      render: (value, record) => (
        <span className="tsv-file">
          <IconFile className="tsv-file__icon" />
          <span className="tsv-file__name" title={value}>
            {value}
          </span>
          <span className="tsv-file__size">- {formatFileSize(record.file_size)}</span>
        </span>
      ),
    },
    {
      title: '脚本备注',
      dataIndex: 'remark',
      width: 180,
      render: (value) =>
        value ? (
          <span className="tsv2-remark" title={value}>
            {value}
          </span>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 166,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          <Tooltip content="查看详情">
            <Button
              type="text"
              size="mini"
              icon={<IconEye />}
              onClick={() => openDetail(record)}
              aria-label="查看脚本详情"
            />
          </Tooltip>
          <Tooltip content="预览文件">
            <Button
              type="text"
              size="mini"
              icon={<IconCode />}
              onClick={() => handlePreview(record)}
              aria-label="预览脚本"
            />
          </Tooltip>
          <Tooltip content="下载">
            <Button
              type="text"
              size="mini"
              icon={<IconDownload />}
              loading={busyId === record.id}
              onClick={() => handleDownload(record)}
              aria-label="下载脚本"
            />
          </Tooltip>
          <Tooltip
            content={
              supportsTrace(record)
                ? '执行并下载 Trace'
                : 'Trace 执行仅支持 JS / TS 脚本'
            }
          >
            <Button
              type="text"
              size="mini"
              icon={<IconPlayArrow />}
              loading={traceId === record.id}
              disabled={
                !supportsTrace(record) || (Boolean(traceId) && traceId !== record.id)
              }
              onClick={() => handleExecutionTrace(record)}
              aria-label="执行并下载 Trace"
            />
          </Tooltip>
          <Tooltip content="编辑">
            <Button
              type="text"
              size="mini"
              icon={<IconEdit />}
              loading={busyId === record.id}
              onClick={() => openEdit(record)}
              aria-label="编辑脚本"
            />
          </Tooltip>
          <Popconfirm
            title="删除这个脚本？"
            content="删除后当前文件和用例关联都会清理。"
            okText="删除"
            cancelText="取消"
            onOk={() => handleDelete(record)}
          >
            <Tooltip content="删除">
              <Button
                type="text"
                size="mini"
                status="danger"
                icon={<IconDelete />}
                aria-label="删除脚本"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const metrics = [
    { label: '脚本总数', value: total, unit: '个' },
    { label: '本页记录', value: rows.length, unit: '个' },
    { label: '本页文件大小', value: formatFileSize(pageFileSize), unit: '' },
    { label: '总页数', value: pages, unit: '页' },
  ];

  return (
    <div className="tp-page tsv2">
      <div className="tsv2-toolbar">
        <div className="tsv2-metrics">
          {metrics.map((item) => (
            <span key={item.label} className="tsv2-metric">
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
          <Button size="small" type="primary" icon={<IconPlus />} onClick={openCreate}>
            上传脚本
          </Button>
        </Space>
      </div>

      {filtersOpen && (
        <Form
          className="tsv2-filters"
          form={filterForm}
          layout="vertical"
          initialValues={{ keyword: '', script_type: undefined, case_no: '' }}
          onSubmit={handleSearch}
        >
          <div className="tsv2-filter-field">
            <Form.Item label="脚本名称" field="keyword">
              <Input
                allowClear
                prefix={<IconSearch />}
                placeholder="搜索脚本名称"
                onPressEnter={() => filterForm.submit()}
              />
            </Form.Item>
          </div>
          <div className="tsv2-filter-field tsv2-filter-field--type">
            <Form.Item label="脚本类型" field="script_type">
              <Select allowClear placeholder="全部类型" options={SCRIPT_TYPES} />
            </Form.Item>
          </div>
          <div className="tsv2-filter-field tsv2-filter-field--case">
            <Form.Item label="关联用例编号" field="case_no">
              <Input
                allowClear
                placeholder="例如：DAS-20261026-002"
                onPressEnter={() => filterForm.submit()}
              />
            </Form.Item>
          </div>

          <div className="tsv2-filter-actions">
            <Button size="small" type="primary" htmlType="submit">
              查询
            </Button>
            <Button size="small" onClick={handleReset}>
              清空
            </Button>
          </div>
        </Form>
      )}

      <section className="tsv2-sheet" aria-label="脚本列表">
        <div className="tsv2-sheet__body" ref={sheetBodyRef}>
          {loading || rows.length > 0 ? (
            <Table
              rowKey="id"
              columns={columns}
              data={rows}
              loading={loading}
              size="small"
              border
              borderCell
              scroll={{ x: 1134, y: tableViewportHeight }}
              pagination={false}
            />
          ) : (
            <div className="tsv2-empty">
              <Empty
                description={
                  activeFilterCount > 0
                    ? '未找到匹配的脚本，试试清空筛选条件'
                    : '还没有脚本，上传第一个脚本开始管理'
                }
              />
              <Space>
                <Button type="primary" icon={<IconPlus />} onClick={openCreate}>
                  上传脚本
                </Button>
                {activeFilterCount > 0 && <Button onClick={handleReset}>清空筛选</Button>}
              </Space>
            </div>
          )}
        </div>

        {loading || rows.length > 0 ? (
          <footer className="tsv2-sheet__foot">
            <span className="tsv2-sheet__count">
              共 {total} 个脚本 · 第 {query.page} / {pages || 1} 页
            </span>
            <Pagination
              size="small"
              current={query.page}
              pageSize={query.pageSize}
              total={total}
              showJumper
              sizeCanChange
              sizeOptions={[10, 20, 50]}
              onChange={(page, pageSize) =>
                setQuery((previous) => ({ ...previous, page, pageSize }))
              }
            />
          </footer>
        ) : null}
      </section>

      <Drawer
        title={editing ? '编辑脚本资产' : '上传脚本资产'}
        visible={formVisible}
        onOk={() => form.submit()}
        onCancel={closeForm}
        confirmLoading={submitting}
        okText={editing ? '保存修改' : '上传并创建'}
        cancelText="取消"
        width="min(920px, 100vw)"
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
          <ScriptFormFields editing={editing} lockedCase={lockedCase} />
        </Form>
      </Drawer>

      <Drawer
        title="脚本详情"
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width="min(760px, 100vw)"
        footer={
          detail ? (
            <Space>
              <Button onClick={() => setDetailVisible(false)}>关闭</Button>
              <Button icon={<IconDownload />} onClick={() => handleDownload(detail)}>
                下载
              </Button>
              <Button icon={<IconEye />} onClick={() => handlePreview(detail)}>
                预览
              </Button>
              <Button
                icon={<IconPlayArrow />}
                loading={traceId === detail.id}
                disabled={!supportsTrace(detail) || Boolean(traceId)}
                onClick={() => handleExecutionTrace(detail)}
              >
                执行并下载 Trace
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
                <Typography.Title heading={5}>{detail.name}</Typography.Title>
                <Space wrap size={[6, 6]}>
                  <ScriptTypeTag type={detail.script_type} />
                  <Tag color="purple">v{detail.version}</Tag>
                  <Tag>{detail.file_ext}</Tag>
                  <Typography.Text type="secondary">
                    {formatFileSize(detail.file_size)}
                  </Typography.Text>
                </Space>
              </div>

              <div className="tsv-detail__cases">
                <Typography.Text type="secondary">关联用例</Typography.Text>
                {detailCaseTags.length ? (
                  <Space wrap size={[6, 6]}>
                    {detailCaseTags}
                  </Space>
                ) : (
                  <Typography.Text type="secondary">—</Typography.Text>
                )}
              </div>

              <div className="tsv-detail__table">
                <Descriptions
                  column={isNarrowScreen ? 1 : 2}
                  border
                  data={[
                    {
                      label: '文件名',
                      value: <span className="tsv-detail__text">{detail.file_name}</span>,
                    },
                    { label: '文件大小', value: formatFileSize(detail.file_size) },
                    { label: 'MIME 类型', value: detail.mime_type },
                    { label: '业务版本号', value: detail.version },
                    { label: '文件上传时间', value: formatDateTime(detail.uploaded_at) },
                    {
                      label: 'SHA-256',
                      value: (
                        <Tooltip content={detail.file_sha256}>
                          <Typography.Text code>
                            {detail.file_sha256?.slice(0, 16)}…
                          </Typography.Text>
                        </Tooltip>
                      ),
                    },
                    { label: '创建时间', value: formatDateTime(detail.created_at) },
                    { label: '更新时间', value: formatDateTime(detail.updated_at) },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Typography.Text type="secondary">脚本备注</Typography.Text>
                <Input.TextArea
                  value={detail.remark || ''}
                  placeholder="暂无脚本备注"
                  readOnly
                  autoSize={{ minRows: 2, maxRows: 4 }}
                />
              </div>

              <Card size="small" title="文件操作">
                <Space wrap>
                  <Button icon={<IconEye />} onClick={() => handlePreview(detail)}>
                    在线预览
                  </Button>
                  <Button icon={<IconDownload />} onClick={() => handleDownload(detail)}>
                    下载当前文件
                  </Button>
                  <Typography.Text type="secondary">
                    当前文件：{detail.file_name}
                  </Typography.Text>
                </Space>
              </Card>
            </Space>
          ) : null}
        </Spin>
      </Drawer>

      <Drawer
        title={`预览 · ${previewRecord?.file_name || ''}`}
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width="min(920px, 100vw)"
        footer={
          <Space>
            <Button onClick={() => setPreviewVisible(false)}>关闭</Button>
            {previewRecord && (
              <Button icon={<IconDownload />} onClick={() => handleDownload(previewRecord)}>
                下载文件
              </Button>
            )}
          </Space>
        }
      >
        <Spin loading={previewLoading} style={{ width: '100%' }}>
          {!previewLoading && (
            <pre className="script-preview__code">{previewContent || '文件内容为空'}</pre>
          )}
        </Spin>
      </Drawer>
    </div>
  );
}
