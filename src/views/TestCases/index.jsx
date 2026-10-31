import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Grid,
  Input,
  Message,
  Popconfirm,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from '@arco-design/web-react';
import {
  IconCopy,
  IconDelete,
  IconEdit,
  IconEye,
  IconPlus,
  IconRefresh,
  IconSearch,
} from '@arco-design/web-react/icon';
import PageHeader from '../../components/common/PageHeader';
import {
  createScript,
  deleteScript,
  fetchScriptDetail,
  fetchScripts,
  updateScript,
} from '../../api/scripts';
import { formatDateTime } from '../../utils/format';

const SCRIPT_TYPES = [
  { value: 'playwright-python', label: 'Playwright · Python', color: 'green' },
  { value: 'playwright-ts', label: 'Playwright · TypeScript', color: 'arcoblue' },
  { value: 'playwright-js', label: 'Playwright · JavaScript', color: 'orange' },
];

const SCRIPT_TYPE_MAP = Object.fromEntries(
  SCRIPT_TYPES.map((item) => [item.value, item]),
);

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

const INITIAL_QUERY = {
  page: 1,
  pageSize: 10,
  keyword: '',
  scriptType: '',
  caseId: '',
};

const INITIAL_FORM = {
  name: '',
  system_name: '',
  case_id: '',
  priority: undefined,
  version: '1.0.0',
  script_type: undefined,
  precondition: '',
  test_steps: '',
  expected_result: '',
  content: '',
  remark: '',
};

const textOrNull = (value) => {
  if (typeof value !== 'string') return null;
  return value.trim() ? value : null;
};

const trimmedOrNull = (value) => {
  if (typeof value !== 'string') return null;
  return value.trim() || null;
};

function ScriptTypeTag({ type }) {
  if (!type) return <Typography.Text type="secondary">—</Typography.Text>;
  const item = SCRIPT_TYPE_MAP[type] || { label: type, color: 'gray' };
  return <Tag color={item.color}>{item.label}</Tag>;
}

function PriorityTag({ priority }) {
  if (!priority) return <Typography.Text type="secondary">—</Typography.Text>;
  return <Tag color={PRIORITY_COLOR[priority] || 'gray'}>{priority}</Tag>;
}

function getFormValues(script) {
  return {
    name: script.name || '',
    system_name: script.system_name || '',
    case_id: script.case_id || '',
    priority: script.priority || undefined,
    version: script.version || '1.0.0',
    script_type: script.script_type || undefined,
    precondition: script.precondition || '',
    test_steps: script.test_steps || '',
    expected_result: script.expected_result || '',
    content: script.content || '',
    remark: script.remark || '',
  };
}

export default function TestCases() {
  const [filterForm] = Form.useForm();
  const [form] = Form.useForm();
  const [query, setQuery] = useState(INITIAL_QUERY);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = {
      page: query.page,
      page_size: query.pageSize,
    };
    if (query.keyword.trim()) params.keyword = query.keyword.trim();
    if (query.scriptType) params.script_type = query.scriptType;
    if (query.caseId.trim()) params.case_id = query.caseId.trim();

    fetchScripts(params)
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

  const currentPagePriorities = useMemo(
    () => rows.filter((record) => record.priority === 'P0' || record.priority === 'P1').length,
    [rows],
  );

  const currentSystems = useMemo(
    () => new Set(rows.map((record) => record.system_name).filter(Boolean)).size,
    [rows],
  );

  const handleSearch = (values) => {
    setQuery((previous) => ({
      ...previous,
      page: 1,
      keyword: values.keyword?.trim() || '',
      scriptType: values.script_type || '',
      caseId: values.case_id?.trim() || '',
    }));
  };

  const handleReset = () => {
    filterForm.resetFields();
    setQuery({ ...INITIAL_QUERY });
    setRefreshKey((key) => key + 1);
  };

  const openCreate = () => {
    form.resetFields();
    setEditing(null);
    setModalVisible(true);
  };

  const applyEditValues = () => {
    if (editing) form.setFieldsValue(getFormValues(editing));
  };

  const openEdit = async (record) => {
    setBusyId(record.id);
    try {
      const latest = await fetchScriptDetail(record.id);
      setEditing(latest);
      setModalVisible(true);
    } catch {
      // request.js 已统一提示错误。
    } finally {
      setBusyId(null);
    }
  };

  const closeModal = () => {
    if (submitting) return;
    setModalVisible(false);
    setEditing(null);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    const isEdit = Boolean(editing);

    try {
      const payload = {
        name: values.name.trim(),
        system_name: values.system_name.trim(),
        case_id: trimmedOrNull(values.case_id),
        script_type: values.script_type || null,
        content: textOrNull(values.content),
        precondition: textOrNull(values.precondition),
        test_steps: textOrNull(values.test_steps),
        expected_result: textOrNull(values.expected_result),
        priority: trimmedOrNull(values.priority),
        remark: trimmedOrNull(values.remark),
      };

      const version = trimmedOrNull(values.version);
      if (version) payload.version = version;

      if (isEdit) {
        const updated = await updateScript(editing.id, payload);
        Message.success(`保存成功，当前 revision 为 ${updated.revision}`);
      } else {
        await createScript(payload);
        Message.success('测试用例创建成功');
      }

      setModalVisible(false);
      setEditing(null);
      form.resetFields();
      setQuery((previous) => ({
        ...previous,
        page: isEdit ? previous.page : 1,
      }));
      setRefreshKey((key) => key + 1);
    } catch {
      // request.js 已统一提示错误。
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await deleteScript(record.id);
      Message.success('测试用例已删除');
      const nextPage = rows.length === 1 && query.page > 1 ? query.page - 1 : query.page;
      setQuery((previous) => ({ ...previous, page: nextPage }));
      setRefreshKey((key) => key + 1);
    } catch {
      // request.js 已统一提示错误。
    }
  };

  const openDetail = async (record) => {
    setDetail(null);
    setDetailVisible(true);
    setDetailLoading(true);
    try {
      setDetail(await fetchScriptDetail(record.id));
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
    setModalVisible(true);
  };

  const copySource = async () => {
    if (!detail?.content) return;
    try {
      await navigator.clipboard.writeText(detail.content);
      Message.success('脚本源码已复制');
    } catch {
      Message.error('复制失败，请手动选择内容');
    }
  };

  const columns = [
    {
      title: '用例名称',
      dataIndex: 'name',
      width: 260,
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{value}</Typography.Text>
          <Typography.Text type="secondary">
            {record.case_id || '未关联业务编号'}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '所属系统',
      dataIndex: 'system_name',
      width: 130,
      render: (value) => <Tag>{value}</Tag>,
    },
    {
      title: '脚本类型',
      dataIndex: 'script_type',
      width: 180,
      render: (value) => <ScriptTypeTag type={value} />,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 92,
      render: (value) => <PriorityTag priority={value} />,
    },
    {
      title: '版本 / 修订',
      dataIndex: 'version',
      width: 140,
      render: (value, record) => (
        <Space size={6}>
          <Typography.Text>{value}</Typography.Text>
          <Typography.Text type="secondary">rev.{record.revision}</Typography.Text>
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 168,
      render: (value) => (
        <Typography.Text type="secondary">{formatDateTime(value)}</Typography.Text>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 118,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          <Tooltip content="查看详情">
            <Button
              type="text"
              size="mini"
              icon={<IconEye />}
              onClick={() => openDetail(record)}
              aria-label={`查看 ${record.name}`}
            />
          </Tooltip>
          <Tooltip content="编辑">
            <Button
              type="text"
              size="mini"
              icon={<IconEdit />}
              loading={busyId === record.id}
              onClick={() => openEdit(record)}
              aria-label={`编辑 ${record.name}`}
            />
          </Tooltip>
          <Popconfirm
            title="删除这个测试用例？"
            content="删除后不可恢复。"
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
                aria-label={`删除 ${record.name}`}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const statistics = [
    { title: '总用例', value: total, suffix: '条' },
    { title: '本页记录', value: rows.length, suffix: '条' },
    { title: '本页高优', value: currentPagePriorities, suffix: '条' },
    { title: '本页系统数', value: currentSystems, suffix: '个' },
  ];

  return (
    <div className="tp-page space-y-4">
      <PageHeader
        eyebrow="TEST LIBRARY / 01"
        meta={`TOTAL ${total} SCRIPTS · PAGE ${query.page}/${pages || 1}`}
        title="测试用例"
        description="管理 Playwright 测试脚本、测试步骤和版本信息。每次修改由服务端自动递增 revision。"
        actions={
          <Space>
            <Button
              icon={<IconRefresh />}
              onClick={() => setRefreshKey((key) => key + 1)}
            >
              刷新
            </Button>
            <Button type="primary" icon={<IconPlus />} onClick={openCreate}>
              新增测试用例
            </Button>
          </Space>
        }
      />

      <Grid.Row gutter={16}>
        {statistics.map((item) => (
          <Grid.Col key={item.title} xs={24} sm={12} xl={6}>
            <Card>
              <Statistic title={item.title} value={item.value} suffix={item.suffix} />
            </Card>
          </Grid.Col>
        ))}
      </Grid.Row>

      <Card title="筛选条件">
        <Form
          form={filterForm}
          layout="vertical"
          initialValues={{ keyword: '', script_type: undefined, case_id: '' }}
          onSubmit={handleSearch}
        >
          <Grid.Row gutter={16}>
            <Grid.Col xs={24} md={8}>
              <Form.Item label="名称关键字" field="keyword">
                <Input
                  allowClear
                  prefix={<IconSearch />}
                  placeholder="搜索测试用例名称"
                  onPressEnter={() => filterForm.submit()}
                />
              </Form.Item>
            </Grid.Col>
            <Grid.Col xs={24} md={8}>
              <Form.Item label="脚本类型" field="script_type">
                <Select
                  allowClear
                  placeholder="全部类型"
                  options={SCRIPT_TYPES}
                />
              </Form.Item>
            </Grid.Col>
            <Grid.Col xs={24} md={8}>
              <Form.Item label="业务编号" field="case_id">
                <Input
                  allowClear
                  placeholder="例如 DAS-20261026-002"
                  onPressEnter={() => filterForm.submit()}
                />
              </Form.Item>
            </Grid.Col>
          </Grid.Row>
          <Space>
            <Button htmlType="submit" type="primary" icon={<IconSearch />}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form>
      </Card>

      <Card
        title="用例列表"
        extra={
          <Space>
            <Typography.Text type="secondary">共 {total} 条</Typography.Text>
            <Button
              size="small"
              icon={<IconRefresh />}
              onClick={() => setRefreshKey((key) => key + 1)}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          data={rows}
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            current: query.page,
            pageSize: query.pageSize,
            total,
            showTotal: true,
            showJumper: true,
            sizeCanChange: true,
            sizeOptions: [10, 20, 50],
            onChange: (page, pageSize) =>
              setQuery((previous) => ({ ...previous, page, pageSize })),
          }}
        />
      </Card>

      <Drawer
        title={editing ? '编辑测试用例' : '新增测试用例'}
        visible={modalVisible}
        onOk={() => form.submit()}
        onCancel={closeModal}
        confirmLoading={submitting}
        okText={editing ? '保存修改' : '创建'}
        cancelText="取消"
        width="min(880px, 100vw)"
        unmountOnExit
        focusLock
        afterOpen={applyEditValues}
        afterClose={() => form.resetFields()}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={INITIAL_FORM}
          onSubmit={handleSubmit}
        >
          <Divider orientation="left">基本信息</Divider>
          <Grid.Row gutter={16}>
            <Grid.Col xs={24} md={12}>
              <Form.Item
                label="用例名称"
                field="name"
                rules={[
                  { required: true, message: '请输入用例名称' },
                  { maxLength: 128, message: '最多 128 个字符' },
                ]}
              >
                <Input placeholder="例如：登录流程冒烟测试" maxLength={128} showWordLimit />
              </Form.Item>
            </Grid.Col>
            <Grid.Col xs={24} md={12}>
              <Form.Item
                label="所属系统"
                field="system_name"
                rules={[
                  { required: true, message: '请输入所属系统' },
                  { maxLength: 128, message: '最多 128 个字符' },
                ]}
              >
                <Input placeholder="例如：订单系统" maxLength={128} showWordLimit />
              </Form.Item>
            </Grid.Col>
            <Grid.Col xs={24} md={12}>
              <Form.Item label="业务编号" field="case_id">
                <Input placeholder="例如：DAS-20261026-002" maxLength={64} />
              </Form.Item>
            </Grid.Col>
            <Grid.Col xs={24} md={12}>
              <Form.Item label="优先级" field="priority">
                <Select allowClear placeholder="选择优先级" options={PRIORITY_OPTIONS} />
              </Form.Item>
            </Grid.Col>
            <Grid.Col xs={24} md={12}>
              <Form.Item
                label="业务版本号"
                field="version"
                rules={[{ maxLength: 64, message: '最多 64 个字符' }]}
              >
                <Input placeholder="1.0.0" maxLength={64} />
              </Form.Item>
            </Grid.Col>
            <Grid.Col xs={24} md={12}>
              <Form.Item label="脚本类型" field="script_type">
                <Select allowClear placeholder="不指定脚本类型" options={SCRIPT_TYPES} />
              </Form.Item>
            </Grid.Col>
          </Grid.Row>

          <Divider orientation="left">测试信息</Divider>
          <Grid.Row gutter={16}>
            <Grid.Col xs={24} md={12}>
              <Form.Item label="前置条件" field="precondition">
                <Input.TextArea
                  placeholder="填写执行脚本前需要满足的条件"
                  autoSize={{ minRows: 3, maxRows: 6 }}
                />
              </Form.Item>
            </Grid.Col>
            <Grid.Col xs={24} md={12}>
              <Form.Item label="预期结果" field="expected_result">
                <Input.TextArea
                  placeholder="填写期望的测试结果"
                  autoSize={{ minRows: 3, maxRows: 6 }}
                />
              </Form.Item>
            </Grid.Col>
            <Grid.Col xs={24}>
              <Form.Item label="测试步骤" field="test_steps">
                <Input.TextArea
                  placeholder="按顺序填写测试步骤"
                  autoSize={{ minRows: 3, maxRows: 8 }}
                />
              </Form.Item>
            </Grid.Col>
          </Grid.Row>

          <Divider orientation="left">脚本与备注</Divider>
          <Grid.Row gutter={16}>
            <Grid.Col xs={24}>
              <Form.Item label="脚本源码" field="content">
                <Input.TextArea
                  placeholder="可选，填写 Playwright 脚本源码"
                  autoSize={{ minRows: 5, maxRows: 10 }}
                  spellCheck={false}
                />
              </Form.Item>
            </Grid.Col>
            <Grid.Col xs={24}>
              <Form.Item
                label="备注"
                field="remark"
                rules={[{ maxLength: 500, message: '最多 500 个字符' }]}
              >
                <Input.TextArea
                  placeholder="补充维护说明"
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  maxLength={500}
                  showWordLimit
                />
              </Form.Item>
            </Grid.Col>
          </Grid.Row>
        </Form>
      </Drawer>

      <Drawer
        title="测试用例详情"
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width="min(760px, 100vw)"
        footer={
          detail ? (
            <Space>
              <Button onClick={() => setDetailVisible(false)}>关闭</Button>
              <Button type="primary" icon={<IconEdit />} onClick={editFromDetail}>
                编辑
              </Button>
            </Space>
          ) : null
        }
      >
        <Spin loading={detailLoading} style={{ width: '100%' }}>
          {detail ? (
            <Tabs>
              <Tabs.TabPane key="overview" title="概览">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div>
                    <Typography.Title heading={5}>{detail.name}</Typography.Title>
                    <Space wrap>
                      <Tag>{detail.system_name}</Tag>
                      <ScriptTypeTag type={detail.script_type} />
                      <PriorityTag priority={detail.priority} />
                      <Tag color="purple">v{detail.version}</Tag>
                      <Typography.Text type="secondary">
                        revision {detail.revision}
                      </Typography.Text>
                    </Space>
                  </div>
                  <Descriptions
                    column={{ xs: 1, sm: 2 }}
                    border
                    data={[
                      { label: '业务编号', value: detail.case_id || '—' },
                      { label: '所属系统', value: detail.system_name },
                      { label: '优先级', value: <PriorityTag priority={detail.priority} /> },
                      { label: '脚本类型', value: <ScriptTypeTag type={detail.script_type} /> },
                      { label: '业务版本号', value: detail.version },
                      { label: '技术修订号', value: `revision ${detail.revision}` },
                      {
                        label: '创建时间',
                        value: formatDateTime(detail.created_at),
                        span: 2,
                      },
                    ]}
                  />
                  <div className="space-y-2">
                    <Typography.Text type="secondary">备注</Typography.Text>
                    <Input.TextArea
                      value={detail.remark || ''}
                      placeholder="暂无备注"
                      readOnly
                      autoSize={{ minRows: 2, maxRows: 5 }}
                    />
                  </div>
                </Space>
              </Tabs.TabPane>

              <Tabs.TabPane key="test" title="测试信息">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div className="space-y-2">
                    <Typography.Text type="secondary">前置条件</Typography.Text>
                    <Input.TextArea
                      value={detail.precondition || ''}
                      placeholder="暂无前置条件"
                      readOnly
                      autoSize={{ minRows: 3, maxRows: 8 }}
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
                      autoSize={{ minRows: 3, maxRows: 8 }}
                    />
                  </div>
                </Space>
              </Tabs.TabPane>

              <Tabs.TabPane key="code" title="脚本源码">
                <Space direction="vertical" size="medium" style={{ width: '100%' }}>
                  <Space>
                    <Button
                      icon={<IconCopy />}
                      onClick={copySource}
                      disabled={!detail.content}
                    >
                      复制源码
                    </Button>
                  </Space>
                  <Input.TextArea
                    value={detail.content || ''}
                    placeholder="暂无脚本源码"
                    readOnly
                    autoSize={{ minRows: 12, maxRows: 24 }}
                    spellCheck={false}
                  />
                </Space>
              </Tabs.TabPane>
            </Tabs>
          ) : null}
        </Spin>
      </Drawer>
    </div>
  );
}
