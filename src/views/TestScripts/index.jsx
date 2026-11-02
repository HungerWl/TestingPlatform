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
  IconDownload,
  IconEdit,
  IconEye,
  IconFile,
  IconPlus,
  IconRefresh,
  IconSearch,
} from '@arco-design/web-react/icon';
import { useLocation, useNavigate } from 'react-router-dom';
import FormLabel from '../../components/common/FormLabel';
import PageHeader from '../../components/common/PageHeader';
import ScriptFilePicker from '../../components/test/ScriptFilePicker';
import TestCaseSelect from '../../components/test/TestCaseSelect';
import {
  deleteTestScript,
  downloadTestScript,
  fetchTestScriptDetail,
  fetchTestScripts,
  previewTestScript,
  replaceTestScriptFile,
  updateTestScript,
  updateTestScriptTestCases,
  uploadTestScript,
} from '../../api/testScripts';
import { formatDateTime, formatFileSize } from '../../utils/format';

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

function ScriptTypeTag({ type }) {
  if (!type) return <Typography.Text type="secondary">—</Typography.Text>;
  const item = SCRIPT_TYPE_MAP[type] || { label: type, color: 'gray' };
  return <Tag color={item.color}>{item.label}</Tag>;
}

function CaseSummary({ testCases = [] }) {
  if (!testCases.length) return <Typography.Text type="secondary">—</Typography.Text>;

  return (
    <Space direction="vertical" size={2}>
      <Typography.Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 200 }}>
        {testCases[0].name}
      </Typography.Text>
      <Space wrap size={[4, 4]}>
        <Tag color="arcoblue">{testCases[0].case_no}</Tag>
        {testCases.length > 1 && <Tag>+{testCases.length - 1} 个用例</Tag>}
      </Space>
    </Space>
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

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewRecord, setPreviewRecord] = useState(null);
  const [previewContent, setPreviewContent] = useState('');

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
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName || record.file_name || 'script-file';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      Message.success('文件下载已开始');
    } catch {
      // request.js 已统一提示错误。
    } finally {
      setBusyId(null);
    }
  };

  const detailCaseTags = (detail?.test_cases || []).map((item) => (
    <Tag key={item.id} color="arcoblue">
      {item.case_no} · {item.name}
    </Tag>
  ));

  const columns = [
    {
      title: '脚本名称',
      dataIndex: 'name',
      width: 270,
      render: (value, record) => (
        <Space direction="vertical" size={2}>
          <Typography.Text>{value}</Typography.Text>
          <Space wrap size={[4, 4]}>
            <ScriptTypeTag type={record.script_type} />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              v{record.version} · {record.file_ext}
            </Typography.Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '关联用例',
      dataIndex: 'test_cases',
      width: 230,
      render: (value) => <CaseSummary testCases={value} />,
    },
    {
      title: '当前文件',
      dataIndex: 'file_name',
      width: 230,
      render: (value, record) => (
        <Space size={6} style={{ maxWidth: '100%' }}>
          <IconFile />
          <Space direction="vertical" size={0} style={{ minWidth: 0 }}>
            <Typography.Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 170 }}>
              {value}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {formatFileSize(record.file_size)}
            </Typography.Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 218,
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

  const statistics = [
    { title: '脚本总数', value: total, suffix: '个' },
    { title: '本页记录', value: rows.length, suffix: '个' },
    { title: '本页文件大小', value: formatFileSize(pageFileSize), suffix: '' },
    { title: '总页数', value: pages, suffix: '页' },
  ];

  return (
    <div className="tp-page space-y-4">
      <PageHeader
        eyebrow="SCRIPT ASSETS / 02"
        meta={`TOTAL ${total} SCRIPTS · PAGE ${query.page}/${pages || 1}`}
        title="脚本资产"
        description="管理脚本文件、关联测试用例和业务版本。一个脚本可被多个用例复用；不保存源码正文，不保留历史文件。"
        actions={
          <Space>
            <Button icon={<IconRefresh />} onClick={() => setRefreshKey((key) => key + 1)}>
              刷新
            </Button>
            <Button type="primary" icon={<IconPlus />} onClick={openCreate}>
              上传脚本
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
                groupSeparator={typeof item.value === 'number'}
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
              <Form.Item label="关联用例编号" field="case_no">
                <Input
                  allowClear
                  placeholder="例如：DAS-20261026-002"
                  onPressEnter={() => filterForm.submit()}
                />
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
        title="脚本列表"
        extra={<Typography.Text type="secondary">共 {total} 个脚本</Typography.Text>}
      >
        <Table
          rowKey="id"
          columns={columns}
          data={rows}
          loading={loading}
          scroll={{ x: 950 }}
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

              <Descriptions
                column={{ xs: 1, sm: 2 }}
                border
                data={[
                  {
                    label: '关联用例',
                    value: detailCaseTags.length ? (
                      <Space wrap size={[4, 4]}>{detailCaseTags}</Space>
                    ) : (
                      '—'
                    ),
                  },
                  { label: '文件名', value: detail.file_name },
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
