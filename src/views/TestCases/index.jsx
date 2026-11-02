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
  Tag,
  Tooltip,
  Typography,
} from '@arco-design/web-react';
import {
  IconCode,
  IconDelete,
  IconEdit,
  IconEye,
  IconPlus,
  IconRefresh,
  IconSearch,
} from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import FormLabel from '../../components/common/FormLabel';
import PageHeader from '../../components/common/PageHeader';
import {
  createTestCase,
  deleteTestCase,
  fetchTestCaseDetail,
  fetchTestCases,
  updateTestCase,
} from '../../api/testCases';
import { formatDateTime } from '../../utils/format';

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
  systemName: '',
  priority: '',
};

const INITIAL_FORM = {
  case_no: '',
  name: '',
  system_name: '',
  priority: undefined,
  precondition: '',
  test_steps: '',
  expected_result: '',
  remark: '',
};

const nullIfEmpty = (value) => {
  if (typeof value !== 'string') return null;
  return value.trim() ? value : null;
};

function PriorityTag({ priority }) {
  if (!priority) return <Typography.Text type="secondary">—</Typography.Text>;
  return <Tag color={PRIORITY_COLOR[priority] || 'gray'}>{priority}</Tag>;
}

function CaseFormFields() {
  return (
    <>
      <Divider orientation="left">基本信息</Divider>
      <Grid.Row gutter={16}>
        <Grid.Col xs={24} md={12}>
          <Form.Item
            label={<FormLabel required>用例名称</FormLabel>}
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
            rules={[
              { required: true, message: '请输入所属系统' },
              { maxLength: 128, message: '最多 128 个字符' },
            ]}
          >
            <Input placeholder="例如：订单系统" maxLength={128} showWordLimit />
          </Form.Item>
        </Grid.Col>
        <Grid.Col xs={24} md={12}>
          <Form.Item label={<FormLabel>优先级</FormLabel>} field="priority">
            <Select allowClear placeholder="选择优先级" options={PRIORITY_OPTIONS} />
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

export default function TestCases() {
  const navigate = useNavigate();
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
  const [submitting, setSubmitting] = useState(false);

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = { page: query.page, page_size: query.pageSize };
    if (query.keyword.trim()) params.keyword = query.keyword.trim();
    if (query.systemName.trim()) params.system_name = query.systemName.trim();
    if (query.priority) params.priority = query.priority;

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

  const pageHighPriority = useMemo(
    () => rows.filter((item) => item.priority === 'P0' || item.priority === 'P1').length,
    [rows],
  );

  const handleSearch = (values) => {
    setQuery((previous) => ({
      ...previous,
      page: 1,
      keyword: values.keyword?.trim() || '',
      systemName: values.system_name?.trim() || '',
      priority: values.priority || '',
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
        name: values.name.trim(),
        system_name: values.system_name.trim(),
        priority: values.priority || null,
        precondition: nullIfEmpty(values.precondition),
        test_steps: nullIfEmpty(values.test_steps),
        expected_result: nullIfEmpty(values.expected_result),
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
        caseLabel: `${record.case_no} · ${record.name}`,
        case: {
          id: record.id,
          case_no: record.case_no,
          name: record.name,
          system_name: record.system_name,
        },
      },
    });
  };

  const columns = [
    {
      title: '用例名称 / 业务编号',
      dataIndex: 'name',
      width: 300,
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{value}</Typography.Text>
          <Typography.Text type="secondary">{record.case_no}</Typography.Text>
        </Space>
      ),
    },
    {
      title: '所属系统',
      dataIndex: 'system_name',
      width: 150,
      render: (value) => <Tag>{value}</Tag>,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 100,
      render: (value) => <PriorityTag priority={value} />,
    },
    {
      title: '关联脚本',
      dataIndex: 'script_count',
      width: 110,
      render: (value) => <Tag color={value > 0 ? 'arcoblue' : 'gray'}>{value} 个</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 170,
      render: (value) => (
        <Typography.Text type="secondary">{formatDateTime(value)}</Typography.Text>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 150,
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
            title="删除这个测试用例？"
            content="存在关联脚本时无法删除，请先删除脚本。"
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
                aria-label="删除测试用例"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const statistics = [
    { title: '用例总数', value: total, suffix: '条' },
    { title: '本页记录', value: rows.length, suffix: '条' },
    { title: '本页高优', value: pageHighPriority, suffix: '条' },
    { title: '总页数', value: pages, suffix: '页' },
  ];

  return (
    <div className="tp-page space-y-4">
      <PageHeader
        eyebrow="TEST LIBRARY / 01"
        meta={`TOTAL ${total} CASES · PAGE ${query.page}/${pages || 1}`}
        title="测试用例"
        description="维护纯业务测试用例。脚本资产在独立模块中管理，通过多对多关联被多个用例复用。"
        actions={
          <Space>
            <Button icon={<IconRefresh />} onClick={() => setRefreshKey((key) => key + 1)}>
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
              <Statistic
                title={item.title}
                value={item.value}
                suffix={item.suffix}
                groupSeparator
              />
            </Card>
          </Grid.Col>
        ))}
      </Grid.Row>

      <Card title="筛选条件">
        <Form
          form={filterForm}
          layout="vertical"
          initialValues={{ keyword: '', system_name: '', priority: undefined }}
          onSubmit={handleSearch}
        >
          <Grid.Row gutter={16}>
            <Grid.Col xs={24} md={10}>
              <Form.Item label="名称 / 业务编号" field="keyword">
                <Input
                  allowClear
                  prefix={<IconSearch />}
                  placeholder="搜索用例名称或业务编号"
                  onPressEnter={() => filterForm.submit()}
                />
              </Form.Item>
            </Grid.Col>
            <Grid.Col xs={24} md={7}>
              <Form.Item label="所属系统" field="system_name">
                <Input allowClear placeholder="例如：订单系统" />
              </Form.Item>
            </Grid.Col>
            <Grid.Col xs={24} md={7}>
              <Form.Item label="优先级" field="priority">
                <Select allowClear placeholder="全部优先级" options={PRIORITY_OPTIONS} />
              </Form.Item>
            </Grid.Col>
          </Grid.Row>
          <Space>
            <Button htmlType="submit" type="primary">
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form>
      </Card>

      <Card
        title="用例列表"
        extra={<Typography.Text type="secondary">共 {total} 条</Typography.Text>}
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
          <CaseFormFields />
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
                <Typography.Title heading={5}>{detail.name}</Typography.Title>
                <Space wrap>
                  <Tag>{detail.system_name}</Tag>
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
                  { label: '优先级', value: <PriorityTag priority={detail.priority} /> },
                  { label: '创建时间', value: formatDateTime(detail.created_at) },
                ]}
              />

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
