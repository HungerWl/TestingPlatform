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
  IconDelete,
  IconEdit,
  IconEye,
  IconPlus,
  IconRefresh,
  IconSearch,
} from '@arco-design/web-react/icon';
import { useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import TestCaseSelect from '../../components/test/TestCaseSelect';
import {
  createTestScript,
  deleteTestScript,
  fetchTestScriptDetail,
  fetchTestScripts,
  updateTestScript,
} from '../../api/testScripts';
import { formatDateTime } from '../../utils/format';

const SCRIPT_TYPES = [
  { value: 'playwright-python', label: 'Playwright · Python', color: 'green' },
  { value: 'playwright-ts', label: 'Playwright · TypeScript', color: 'arcoblue' },
  { value: 'playwright-js', label: 'Playwright · JavaScript', color: 'orange' },
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
  test_case_id: undefined,
  name: '',
  script_type: undefined,
  version: '1.0.0',
  content: '',
  remark: '',
};

const nullIfEmpty = (value) => {
  if (typeof value !== 'string') return null;
  return value.trim() ? value : null;
};

function ScriptTypeTag({ type }) {
  if (!type) return <Typography.Text type="secondary">—</Typography.Text>;
  const item = SCRIPT_TYPE_MAP[type] || { label: type, color: 'gray' };
  return <Tag color={item.color}>{item.label}</Tag>;
}

function ScriptFormFields({ editing }) {
  const selectedCase = editing?.test_case || null;

  return (
    <>
      <Divider orientation="left">脚本信息</Divider>
      <Grid.Row gutter={16}>
        <Grid.Col xs={24}>
          <Form.Item
            label="所属测试用例"
            field="test_case_id"
            rules={[{ required: true, message: '请选择所属测试用例' }]}
          >
            <TestCaseSelect
              disabled={Boolean(editing)}
              selectedCase={selectedCase}
              placeholder="搜索业务编号或用例名称"
            />
          </Form.Item>
        </Grid.Col>
        <Grid.Col xs={24} md={12}>
          <Form.Item
            label="脚本名称"
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
          <Form.Item label="脚本类型" field="script_type">
            <Select allowClear placeholder="选择 Playwright 技术栈" options={SCRIPT_TYPES} />
          </Form.Item>
        </Grid.Col>
        <Grid.Col xs={24} md={12}>
          <Form.Item
            label="业务版本号"
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

      <Divider orientation="left">脚本内容</Divider>
      <Form.Item
        label="源码"
        field="content"
        rules={[
          { required: true, message: '请输入脚本源码' },
          {
            validator: (value, callback) => {
              if (!value || !value.trim()) callback('脚本内容不能为空');
              else callback();
            },
          },
        ]}
      >
        <Input.TextArea
          placeholder="填写 Playwright 脚本源码"
          autoSize={{ minRows: 10, maxRows: 20 }}
          spellCheck={false}
        />
      </Form.Item>

      <Form.Item label="脚本备注" field="remark">
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
  const [busyId, setBusyId] = useState(null);

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

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

    filterForm.setFieldsValue({ keyword: '', script_type: undefined, case_no: state.caseNo || '' });
    setQuery((previous) => ({
      ...previous,
      page: 1,
      keyword: '',
      scriptType: '',
      caseNo: state.caseNo || '',
    }));
    navigate(location.pathname, { replace: true, state: null });
  }, [filterForm, location.pathname, location.state, navigate]);

  const pageHighRevision = useMemo(
    () => rows.reduce((max, item) => Math.max(max, item.revision || 0), 0),
    [rows],
  );

  const handleSearch = (values) => {
    setQuery((previous) => ({
      ...previous,
      page: 1,
      keyword: values.keyword?.trim() || '',
      scriptType: values.script_type || '',
      caseNo: values.case_no?.trim() || '',
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

  const applyFormValues = () => {
    if (!editing) return;
    form.setFieldsValue({
      test_case_id: editing.test_case_id,
      name: editing.name,
      script_type: editing.script_type || undefined,
      version: editing.version,
      content: editing.content,
      remark: editing.remark || '',
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
    setSubmitting(true);
    const isEdit = Boolean(editing);

    try {
      const payload = {
        name: values.name.trim(),
        script_type: values.script_type || null,
        content: values.content,
        version: values.version.trim(),
        remark: nullIfEmpty(values.remark),
      };

      if (isEdit) {
        const updated = await updateTestScript(editing.id, payload);
        Message.success(`保存成功，当前 revision 为 ${updated.revision}`);
      } else {
        const created = await createTestScript({
          ...payload,
          test_case_id: values.test_case_id,
        });
        Message.success(`脚本创建成功，初始 revision 为 ${created.revision}`);
      }

      setFormVisible(false);
      setEditing(null);
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
      Message.success('脚本已删除');
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

  const columns = [
    {
      title: '脚本名称',
      dataIndex: 'name',
      width: 250,
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{value}</Typography.Text>
          <Typography.Text type="secondary">
            {record.version} · revision {record.revision}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '所属用例',
      dataIndex: 'test_case',
      width: 300,
      render: (value) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{value?.name || '—'}</Typography.Text>
          <Typography.Text type="secondary">{value?.case_no || '—'}</Typography.Text>
        </Space>
      ),
    },
    {
      title: '脚本类型',
      dataIndex: 'script_type',
      width: 190,
      render: (value) => <ScriptTypeTag type={value} />,
    },
    {
      title: '版本 / 修订',
      dataIndex: 'version',
      width: 150,
      render: (value, record) => (
        <Space size={6}>
          <Tag>{value}</Tag>
          <Typography.Text type="secondary">rev.{record.revision}</Typography.Text>
        </Space>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 170,
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
              aria-label="查看脚本"
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
                aria-label="删除脚本"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const statistics = [
    { title: '脚本总数', value: total, suffix: '个' },
    { title: '本页记录', value: rows.length, suffix: '个' },
    { title: '本页最高修订号', value: pageHighRevision, suffix: '' },
    { title: '总页数', value: pages, suffix: '页' },
  ];

  return (
    <div className="tp-page space-y-4">
      <PageHeader
        eyebrow="SCRIPT ASSETS / 02"
        meta={`TOTAL ${total} SCRIPTS · PAGE ${query.page}/${pages || 1}`}
        title="脚本资产"
        description="管理 Playwright 脚本资产、源码、业务版本和技术修订号。脚本必须关联一个测试用例。"
        actions={
          <Space>
            <Button icon={<IconRefresh />} onClick={() => setRefreshKey((key) => key + 1)}>
              刷新
            </Button>
            <Button type="primary" icon={<IconPlus />} onClick={openCreate}>
              新增脚本
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
          initialValues={{ keyword: '', script_type: undefined, case_no: '' }}
          onSubmit={handleSearch}
        >
          <Grid.Row gutter={16}>
            <Grid.Col xs={24} md={10}>
              <Form.Item label="脚本名称" field="keyword">
                <Input
                  allowClear
                  prefix={<IconSearch />}
                  placeholder="搜索脚本名称"
                  onPressEnter={() => filterForm.submit()}
                />
              </Form.Item>
            </Grid.Col>
            <Grid.Col xs={24} md={7}>
              <Form.Item label="脚本类型" field="script_type">
                <Select allowClear placeholder="全部类型" options={SCRIPT_TYPES} />
              </Form.Item>
            </Grid.Col>
            <Grid.Col xs={24} md={7}>
              <Form.Item label="用例业务编号" field="case_no">
                <Input
                  allowClear
                  placeholder="例如：DAS-20261026-002"
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
        title="脚本列表"
        extra={<Typography.Text type="secondary">共 {total} 个脚本</Typography.Text>}
      >
        <Table
          rowKey="id"
          columns={columns}
          data={rows}
          loading={loading}
          scroll={{ x: 1180 }}
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
        title={editing ? '编辑脚本资产' : '新增脚本资产'}
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
        <Form form={form} layout="vertical" initialValues={INITIAL_FORM} onSubmit={handleSubmit}>
          <ScriptFormFields editing={editing} />
        </Form>
      </Drawer>

      <Drawer
        title="脚本详情"
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width="min(720px, 100vw)"
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
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Typography.Title heading={5}>{detail.name}</Typography.Title>
                <Space wrap>
                  <Tag>{detail.test_case?.name || '—'}</Tag>
                  <ScriptTypeTag type={detail.script_type} />
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
                  { label: '所属用例', value: detail.test_case?.name || '—' },
                  { label: '业务编号', value: detail.test_case?.case_no || '—' },
                  { label: '所属系统', value: detail.test_case?.system_name || '—' },
                  { label: '脚本类型', value: <ScriptTypeTag type={detail.script_type} /> },
                  { label: '业务版本号', value: detail.version },
                  { label: '技术修订号', value: `revision ${detail.revision}` },
                  { label: '创建时间', value: formatDateTime(detail.created_at) },
                  { label: '更新时间', value: formatDateTime(detail.updated_at) },
                ]}
              />

              <div className="space-y-2">
                <Typography.Text type="secondary">脚本备注</Typography.Text>
                <Input.TextArea
                  value={detail.remark || ''}
                  placeholder="暂无脚本备注"
                  readOnly
                  autoSize={{ minRows: 2, maxRows: 4 }}
                />
              </div>

              <div className="space-y-2">
                <Typography.Text type="secondary">脚本源码</Typography.Text>
                <Input.TextArea
                  value={detail.content}
                  readOnly
                  autoSize={{ minRows: 10, maxRows: 22 }}
                  spellCheck={false}
                />
              </div>
            </Space>
          ) : null}
        </Spin>
      </Drawer>
    </div>
  );
}
