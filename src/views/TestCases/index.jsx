import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Message,
  Modal,
  Popconfirm,
  Select,
  Spin,
  Table,
  Tooltip,
} from "@arco-design/web-react";
import {
  IconCopy,
  IconDelete,
  IconEdit,
  IconEye,
  IconPlus,
  IconRefresh,
  IconSearch,
} from "@arco-design/web-react/icon";
import PageHeader from "../../components/common/PageHeader";
import {
  createScript,
  deleteScript,
  fetchScriptDetail,
  fetchScripts,
  updateScript,
} from "../../api/scripts";
import { formatDateTime } from "../../utils/format";

const SCRIPT_TYPES = [
  { value: "playwright-python", label: "Playwright · Python", short: "PY" },
  { value: "playwright-ts", label: "Playwright · TypeScript", short: "TS" },
  { value: "playwright-js", label: "Playwright · JavaScript", short: "JS" },
];

const SCRIPT_TYPE_MAP = Object.fromEntries(
  SCRIPT_TYPES.map((item) => [item.value, item]),
);

const INITIAL_QUERY = {
  page: 1,
  pageSize: 10,
  keyword: "",
  scriptType: "",
  caseId: "",
};

const INITIAL_FORM = {
  name: "",
  script_type: "playwright-python",
  case_id: null,
  content: "",
  remark: "",
};

function buildQueryParams(query) {
  const params = {
    page: query.page,
    page_size: query.pageSize,
  };

  if (query.keyword.trim()) params.keyword = query.keyword.trim();
  if (query.scriptType) params.script_type = query.scriptType;
  if (query.caseId) params.case_id = Number(query.caseId);

  return params;
}

function ScriptTypeTag({ type }) {
  const item = SCRIPT_TYPE_MAP[type] || { label: type, short: "—" };
  const key = type?.replace("playwright-", "") || "unknown";

  return (
    <span className={`tp-script-type is-${key}`}>
      <i />
      {item.label}
      <em>{item.short}</em>
    </span>
  );
}

/**
 * 测试用例（测试脚本）管理页。
 * 对接 TestingService: /api/v1/scripts
 */
export default function TestCases() {
  const [form] = Form.useForm();
  const [query, setQuery] = useState(INITIAL_QUERY);
  const [draft, setDraft] = useState({
    keyword: "",
    scriptType: "",
    caseId: "",
  });
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
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

    fetchScripts(buildQueryParams(query))
      .then((result) => {
        if (cancelled) return;
        setRows(result?.items || []);
        setTotal(result?.total || 0);
      })
      .catch(() => {
        if (cancelled) return;
        setRows([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, refreshKey]);

  const activeFilterCount = useMemo(
    () =>
      [query.keyword, query.scriptType, query.caseId].filter(Boolean).length,
    [query],
  );

  const closeModal = () => {
    if (submitting) return;
    setModalVisible(false);
    setEditing(null);
  };

  const applyFilters = () => {
    setQuery((previous) => ({
      ...previous,
      keyword: draft.keyword,
      scriptType: draft.scriptType,
      caseId: draft.caseId,
      page: 1,
    }));
  };

  const resetFilters = () => {
    setDraft({ keyword: "", scriptType: "", caseId: "" });
    setQuery({ ...INITIAL_QUERY });
    setRefreshKey((key) => key + 1);
  };

  const openCreate = () => {
    form.resetFields();
    setEditing(null);
    setModalVisible(true);
  };

  const syncFormValues = () => {
    if (!editing) return;
    form.setFieldsValue({
      name: editing.name,
      script_type: editing.script_type,
      case_id: editing.case_id,
      content: editing.content,
      remark: editing.remark || "",
    });
  };

  const startEdit = async (record) => {
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

  const handleSubmit = async (values) => {
    setSubmitting(true);
    const isEdit = Boolean(editing);

    try {
      const payload = {
        name: values.name.trim(),
        script_type: values.script_type,
        case_id: values.case_id ? Number(values.case_id) : null,
        content: values.content,
        remark: values.remark?.trim() ? values.remark.trim() : null,
      };

      if (isEdit) {
        const updated = await updateScript(editing.id, payload);
        Message.success(`脚本已更新至 v${updated.version}`);
      } else {
        const created = await createScript(payload);
        Message.success(`测试用例 #${created.id} 创建成功`);
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
      // 错误提示已在 request.js 中统一处理。
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await deleteScript(record.id);
      Message.success(`测试用例 #${record.id} 已删除`);
      const nextPage =
        rows.length === 1 && query.page > 1 ? query.page - 1 : query.page;
      setQuery((previous) => ({ ...previous, page: nextPage }));
      setRefreshKey((key) => key + 1);
    } catch {
      // 错误提示已在 request.js 中统一处理。
    }
  };

  const openDetail = async (record) => {
    setDetail(null);
    setDetailVisible(true);
    setDetailLoading(true);
    try {
      const data = await fetchScriptDetail(record.id);
      setDetail(data);
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

  const copyContent = async () => {
    if (!detail?.content) return;
    try {
      await navigator.clipboard.writeText(detail.content);
      Message.success("脚本内容已复制");
    } catch {
      Message.error("复制失败，请手动选择内容");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 68,
      render: (value) => (
        <span className="font-mono text-[10px] font-medium text-ink-muted">
          #{value}
        </span>
      ),
    },
    {
      title: "用例名称",
      dataIndex: "name",
      width: 270,
      render: (value, record) => (
        <button
          type="button"
          className="tp-script-name"
          onClick={() => openDetail(record)}
        >
          <span className="truncate">{value}</span>
          <small>
            {record.remark ||
              record.content?.split("\n")[0]?.slice(0, 56) ||
              "暂无备注"}
          </small>
        </button>
      ),
    },
    {
      title: "脚本类型",
      dataIndex: "script_type",
      width: 180,
      render: (value) => <ScriptTypeTag type={value} />,
    },
    {
      title: "关联用例",
      dataIndex: "case_id",
      width: 94,
      render: (value) =>
        value ? (
          <span className="font-mono text-[10px] text-ink-muted">
            CASE-{value}
          </span>
        ) : (
          <span className="text-[11px] text-muted">—</span>
        ),
    },
    {
      title: "版本",
      dataIndex: "version",
      width: 76,
      render: (value) => <span className="tp-version">v{value}</span>,
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      width: 150,
      render: (value) => (
        <span className="font-mono text-[10px] text-muted">
          {formatDateTime(value)}
        </span>
      ),
    },
    {
      title: "操作",
      dataIndex: "action",
      width: 112,
      fixed: "right",
      render: (_, record) => (
        <div className="flex items-center gap-0.5">
          <Tooltip content="查看详情">
            <Button
              type="text"
              size="mini"
              icon={<IconEye />}
              onClick={() => openDetail(record)}
              aria-label={`查看 ${record.name}`}
            />
          </Tooltip>
          <Tooltip content="编辑并递增版本">
            <Button
              type="text"
              size="mini"
              icon={<IconEdit />}
              loading={busyId === record.id}
              onClick={() => startEdit(record)}
              aria-label={`编辑 ${record.name}`}
            />
          </Tooltip>
          <Popconfirm
            title="删除这个测试用例？"
            content={`脚本 #${record.id} 删除后不可恢复。`}
            okText="确认删除"
            cancelText="取消"
            onOk={() => handleDelete(record)}
          >
            <Tooltip content="删除">
              <Button
                type="text"
                size="mini"
                className="tp-danger-button"
                icon={<IconDelete />}
                aria-label={`删除 ${record.name}`}
              />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="tp-page space-y-5">
      <PageHeader
        eyebrow="TEST LIBRARY / 01"
        meta={`TOTAL ${total} SCRIPTS`}
        title="测试用例"
        description="统一管理 Playwright 测试脚本。每次编辑会自动递增版本号，便于追踪脚本演进。"
        actions={
          <>
            <Button
              className="tp-button-ghost"
              icon={<IconRefresh />}
              onClick={() => setRefreshKey((key) => key + 1)}
            >
              刷新
            </Button>
            <Button
              type="primary"
              className="btn-ink"
              icon={<IconPlus />}
              onClick={openCreate}
            >
              新增测试用例
            </Button>
          </>
        }
      />

      <div className="tp-panel p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_190px_150px]">
              <label className="tp-field">
                <span className="tp-field__label">名称关键字</span>
                <Input
                  allowClear
                  prefix={<IconSearch />}
                  placeholder="搜索测试用例名称"
                  value={draft.keyword}
                  onChange={(value) =>
                    setDraft((previous) => ({ ...previous, keyword: value }))
                  }
                  onPressEnter={applyFilters}
                />
              </label>

              <label className="tp-field">
                <span className="tp-field__label">脚本类型</span>
                <Select
                  allowClear
                  placeholder="全部类型"
                  options={SCRIPT_TYPES}
                  value={draft.scriptType || undefined}
                  onChange={(value) =>
                    setDraft((previous) => ({
                      ...previous,
                      scriptType: value || "",
                    }))
                  }
                />
              </label>

              <label className="tp-field">
                <span className="tp-field__label">关联用例 ID</span>
                <InputNumber
                  min={1}
                  placeholder="例如 1"
                  style={{ width: "100%" }}
                  value={draft.caseId || undefined}
                  onChange={(value) =>
                    setDraft((previous) => ({
                      ...previous,
                      caseId: value || "",
                    }))
                  }
                />
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="primary"
                className="btn-ink"
                icon={<IconSearch />}
                onClick={applyFilters}
              >
                查询
              </Button>
              <Button className="tp-button-ghost" onClick={resetFilters}>
                重置
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                Active filters
              </span>
              <span className="tp-filter-count">{activeFilterCount}</span>
              {query.keyword && (
                <span className="tp-chip tp-chip--muted">
                  “{query.keyword}”
                </span>
              )}
              {query.scriptType && (
                <span className="tp-chip tp-chip--muted">
                  {SCRIPT_TYPE_MAP[query.scriptType]?.label}
                </span>
              )}
              {query.caseId && (
                <span className="tp-chip tp-chip--muted">
                  CASE-{query.caseId}
                </span>
              )}
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
              {total} assets / page {query.page}
            </span>
          </div>
        </div>
      </div>

      <div className="tp-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[10px] text-muted">01</span>
              <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-ink">
                脚本清单
              </h2>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted">
              数据来自 TestingService，点击用例名称可查看源码详情。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="tp-live-chip">
              <i />
              API /api/v1/scripts
            </span>
            <span className="tp-chip">TOTAL {total}</span>
          </div>
        </div>

        <div className="mt-4">
          <Table
            rowKey="id"
            columns={columns}
            data={rows}
            loading={loading}
            border={false}
            scroll={{ x: 1050 }}
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
        </div>
      </div>

      <Modal
        title={
          <div className="pb-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
              {editing ? "EDIT TEST SCRIPT" : "NEW TEST SCRIPT"}
            </p>
            <p className="mt-1.5 font-display text-lg font-semibold text-ink">
              {editing ? `编辑测试用例 #${editing.id}` : "新增测试用例"}
            </p>
          </div>
        }
        visible={modalVisible}
        onOk={() => form.submit()}
        onCancel={closeModal}
        confirmLoading={submitting}
        okText={editing ? "保存并递增版本" : "创建测试用例"}
        cancelText="取消"
        unmountOnExit
        autoFocus={false}
        focusLock
        afterOpen={syncFormValues}
        afterClose={() => form.resetFields()}
        className="tp-modal tp-script-modal"
        style={{ width: 760, maxWidth: "calc(100vw - 32px)" }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={INITIAL_FORM}
          onSubmit={handleSubmit}
          className="pt-2"
        >
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item
              label="用例名称"
              field="name"
              rules={[
                { required: true, message: "请输入用例名称" },
                { maxLength: 128, message: "名称最多 128 个字符" },
              ]}
              className="sm:col-span-2"
            >
              <Input
                placeholder="例如：支付中心登录回归脚本"
                maxLength={128}
                showWordLimit
              />
            </Form.Item>

            <Form.Item
              label="脚本类型"
              field="script_type"
              rules={[{ required: true, message: "请选择脚本类型" }]}
            >
              <Select
                options={SCRIPT_TYPES}
                placeholder="选择 Playwright 技术栈"
              />
            </Form.Item>

            <Form.Item
              label="关联用例 ID"
              field="case_id"
              extra="可选，关联现有测试用例的 ID。"
            >
              <InputNumber
                min={1}
                placeholder="例如 1"
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item
              label="脚本源码"
              field="content"
              rules={[
                { required: true, message: "请输入脚本源码" },
                {
                  validator: (value, callback) => {
                    if (!value || !value.trim()) callback("脚本内容不能为空");
                    else callback();
                  },
                },
              ]}
              className="sm:col-span-2"
            >
              <Input.TextArea
                className="tp-code-editor"
                placeholder={
                  "from playwright.sync_api import sync_playwright\n\n..."
                }
                autoSize={{ minRows: 10, maxRows: 16 }}
                spellCheck={false}
              />
            </Form.Item>

            <Form.Item
              label="备注"
              field="remark"
              rules={[{ maxLength: 500, message: "备注最多 500 个字符" }]}
              className="sm:col-span-2"
            >
              <Input.TextArea
                placeholder="补充脚本用途、依赖或维护说明…"
                autoSize={{ minRows: 2, maxRows: 4 }}
                maxLength={500}
                showWordLimit
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Drawer
        title={
          <div className="py-0.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
              TEST SCRIPT / DETAIL
            </p>
            <p className="mt-1.5 font-display text-lg font-semibold text-ink">
              {detail ? `测试用例 #${detail.id}` : "加载脚本详情"}
            </p>
          </div>
        }
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width="min(640px, 100vw)"
        footer={
          detail ? (
            <div className="flex justify-end gap-2">
              <Button
                className="tp-button-ghost"
                onClick={() => setDetailVisible(false)}
              >
                关闭
              </Button>
              <Button
                type="primary"
                className="btn-ink"
                icon={<IconEdit />}
                onClick={editFromDetail}
              >
                编辑脚本
              </Button>
            </div>
          ) : null
        }
        unmountOnExit
        className="tp-script-drawer"
      >
        <Spin loading={detailLoading} style={{ width: "100%" }}>
          {detail ? (
            <div className="space-y-5">
              <div>
                <p className="font-display text-xl font-semibold tracking-[-0.03em] text-ink">
                  {detail.name}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ScriptTypeTag type={detail.script_type} />
                  <span className="tp-version">v{detail.version}</span>
                  {detail.case_id && (
                    <span className="tp-chip">CASE-{detail.case_id}</span>
                  )}
                  <span className="tp-chip tp-chip--muted">
                    {formatDateTime(detail.created_at)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-line/80 bg-paper/70 p-4">
                <p className="eyebrow">Remark</p>
                <p className="mt-2 text-[12px] leading-6 text-ink-muted">
                  {detail.remark || "暂无备注"}
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow">Source code</p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                      {detail.content?.split("\n").length || 0} lines · UTF-8
                    </p>
                  </div>
                  <Button
                    size="mini"
                    className="tp-button-ghost"
                    icon={<IconCopy />}
                    onClick={copyContent}
                  >
                    复制
                  </Button>
                </div>
                <pre className="tp-code-preview">{detail.content}</pre>
              </div>

              <div className="flex items-center justify-between border-t border-line/80 pt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                <span>SCRIPT_ID · {detail.id}</span>
                <span>ENDPOINT · /api/v1/scripts/{detail.id}</span>
              </div>
            </div>
          ) : (
            !detailLoading && (
              <div className="py-20 text-center text-xs text-muted">
                暂无详情
              </div>
            )
          )}
        </Spin>
      </Drawer>
    </div>
  );
}
