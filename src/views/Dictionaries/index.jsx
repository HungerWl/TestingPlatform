import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Drawer,
  Form,
  Grid,
  Input,
  InputNumber,
  Message,
  Modal,
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
  IconBook,
  IconDelete,
  IconEdit,
  IconFilter,
  IconList,
  IconPlus,
  IconRefresh,
  IconSearch,
} from '@arco-design/web-react/icon';
import FormLabel from '../../components/common/FormLabel';
import {
  createDictionaryItem,
  createDictionaryType,
  deleteDictionaryItem,
  deleteDictionaryType,
  fetchDictionaryItemDetail,
  fetchDictionaryItems,
  fetchDictionaryTypes,
  updateDictionaryItem,
  updateDictionaryType,
} from '../../api/dictionaries';
import { formatDateTime } from '../../utils/format';
import './index.scss';

/**
 * 字典管理
 * ------------------------------------------------------------------
 * 两级数据结构：
 *   字典类型（gender / 性别）
 *     └── 字典项（male / 男、female / 女）
 *
 * 类型和字典项分离管理；字典项键（item_code）在所属类型内唯一。
 */
const ENABLED_OPTIONS = [
  { label: '启用', value: true },
  { label: '停用', value: false },
];

const INITIAL_TYPE_FORM = {
  type_code: '',
  type_name: '',
  description: '',
  sort_order: 0,
  is_enabled: true,
};

const INITIAL_ITEM_FORM = {
  item_code: '',
  item_name: '',
  sort_order: 0,
  is_enabled: true,
  remark: '',
};

const nullIfEmpty = (value) => {
  if (typeof value !== 'string') return null;
  return value.trim() ? value : null;
};

function EnabledTag({ enabled }) {
  return <Tag color={enabled ? 'green' : 'gray'}>{enabled ? '启用' : '停用'}</Tag>;
}

function TypeCell({ record }) {
  return (
    <div className="dict-type-cell">
      <Typography.Text className="dict-type-name">{record.type_name}</Typography.Text>
      <Typography.Text className="dict-code">{record.type_code}</Typography.Text>
    </div>
  );
}

function DictionaryTypeFormFields() {
  return (
    <Grid.Row gutter={16}>
      <Grid.Col xs={24} md={12}>
        <Form.Item
          label={<FormLabel required>类型名称</FormLabel>}
          field="type_name"
          rules={[
            { required: true, message: '请输入类型名称' },
            { maxLength: 128, message: '最多 128 个字符' },
          ]}
        >
          <Input placeholder="例如：性别" maxLength={128} showWordLimit />
        </Form.Item>
      </Grid.Col>
      <Grid.Col xs={24} md={12}>
        <Form.Item
          label={<FormLabel required>类型编码</FormLabel>}
          field="type_code"
          rules={[
            { required: true, message: '请输入类型编码' },
            { maxLength: 64, message: '最多 64 个字符' },
            { match: /^[A-Za-z][A-Za-z0-9_-]*$/, message: '以字母开头，仅支持字母、数字、_、-' },
          ]}
        >
          <Input placeholder="例如：gender" maxLength={64} showWordLimit />
        </Form.Item>
      </Grid.Col>
      <Grid.Col xs={24}>
        <Form.Item
          label={<FormLabel>类型说明</FormLabel>}
          field="description"
        >
          <Input.TextArea
            placeholder="说明这个字典类型的使用场景"
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={500}
            showWordLimit
          />
        </Form.Item>
      </Grid.Col>
      <Grid.Col xs={24} md={12}>
        <Form.Item
          label={<FormLabel>排序号</FormLabel>}
          field="sort_order"
          rules={[{ type: 'number', min: 0, message: '排序号不能小于 0' }]}
        >
          <InputNumber min={0} precision={0} placeholder="0" />
        </Form.Item>
      </Grid.Col>
      <Grid.Col xs={24} md={12}>
        <Form.Item
          label={<FormLabel required>启用状态</FormLabel>}
          field="is_enabled"
        >
          <Select options={ENABLED_OPTIONS} />
        </Form.Item>
      </Grid.Col>
    </Grid.Row>
  );
}

function DictionaryItemFormFields() {
  return (
    <Grid.Row gutter={16}>
      <Grid.Col xs={24} md={12}>
        <Form.Item
          label={<FormLabel required>字典值</FormLabel>}
          field="item_name"
          rules={[
            { required: true, message: '请输入字典值' },
            { maxLength: 128, message: '最多 128 个字符' },
          ]}
        >
          <Input placeholder="例如：男" maxLength={128} showWordLimit />
        </Form.Item>
      </Grid.Col>
      <Grid.Col xs={24} md={12}>
        <Form.Item
          label={<FormLabel required>字典键</FormLabel>}
          field="item_code"
          rules={[
            { required: true, message: '请输入字典键' },
            { maxLength: 64, message: '最多 64 个字符' },
            { match: /^[A-Za-z0-9][A-Za-z0-9_.-]*$/, message: '仅支持字母、数字、_、-、.' },
          ]}
        >
          <Input placeholder="例如：male" maxLength={64} showWordLimit />
        </Form.Item>
      </Grid.Col>
      <Grid.Col xs={24} md={12}>
        <Form.Item
          label={<FormLabel>排序号</FormLabel>}
          field="sort_order"
          rules={[{ type: 'number', min: 0, message: '排序号不能小于 0' }]}
        >
          <InputNumber min={0} precision={0} placeholder="0" />
        </Form.Item>
      </Grid.Col>
      <Grid.Col xs={24} md={12}>
        <Form.Item
          label={<FormLabel required>启用状态</FormLabel>}
          field="is_enabled"
        >
          <Select options={ENABLED_OPTIONS} />
        </Form.Item>
      </Grid.Col>
      <Grid.Col xs={24}>
        <Form.Item label={<FormLabel>备注</FormLabel>} field="remark">
          <Input.TextArea
            placeholder="补充说明"
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={500}
            showWordLimit
          />
        </Form.Item>
      </Grid.Col>
    </Grid.Row>
  );
}

export default function Dictionaries() {
  const [filterForm] = Form.useForm();
  const [typeForm] = Form.useForm();
  const [itemForm] = Form.useForm();
  const sheetBodyRef = useRef(null);
  const [tableScrollY, setTableScrollY] = useState(360);

  const [filters, setFilters] = useState({ keyword: '', isEnabled: undefined });
  const [query, setQuery] = useState({ page: 1, pageSize: 20 });
  const [types, setTypes] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [typeVisible, setTypeVisible] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeSubmitting, setTypeSubmitting] = useState(false);

  const [itemDrawerVisible, setItemDrawerVisible] = useState(false);
  const [activeType, setActiveType] = useState(null);
  const [itemFilterForm] = Form.useForm();
  const [itemFilters, setItemFilters] = useState({ keyword: '', isEnabled: undefined });
  const [itemQuery, setItemQuery] = useState({ page: 1, pageSize: 20 });
  const [items, setItems] = useState([]);
  const [itemTotal, setItemTotal] = useState(0);
  const [itemPages, setItemPages] = useState(0);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemRefreshKey, setItemRefreshKey] = useState(0);

  const [itemFormVisible, setItemFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemSubmitting, setItemSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = {
      page: query.page,
      page_size: query.pageSize,
    };
    if (filters.keyword.trim()) params.keyword = filters.keyword.trim();
    if (filters.isEnabled !== undefined) params.is_enabled = filters.isEnabled;

    fetchDictionaryTypes(params)
      .then((result) => {
        if (cancelled) return;
        setTypes(result?.items || []);
        setTotal(result?.total || 0);
        setPages(result?.pages || 0);
      })
      .catch(() => {
        if (cancelled) return;
        setTypes([]);
        setTotal(0);
        setPages(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters, query, refreshKey]);

  useEffect(() => {
    const el = sheetBodyRef.current;
    if (!el) return undefined;

    const observer = new ResizeObserver(() => {
      setTableScrollY(Math.max(220, el.clientHeight - 48));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!itemDrawerVisible || !activeType) return undefined;

    let cancelled = false;
    setItemLoading(true);
    const params = { page: itemQuery.page, page_size: itemQuery.pageSize };
    if (itemFilters.keyword.trim()) params.keyword = itemFilters.keyword.trim();
    if (itemFilters.isEnabled !== undefined) params.is_enabled = itemFilters.isEnabled;

    fetchDictionaryItems(activeType.id, params)
      .then((result) => {
        if (cancelled) return;
        setItems(result?.items || []);
        setItemTotal(result?.total || 0);
        setItemPages(result?.pages || 0);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setItemTotal(0);
        setItemPages(0);
      })
      .finally(() => {
        if (!cancelled) setItemLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeType, itemDrawerVisible, itemFilters, itemQuery, itemRefreshKey]);

  const metrics = useMemo(() => {
    const enabledTypes = types.filter((entry) => entry.is_enabled).length;
    const itemCount = types.reduce((sum, entry) => sum + (entry.item_count || 0), 0);
    return { enabledTypes, itemCount };
  }, [types]);

  const handleTypeSearch = (values) => {
    const nextFilters = {
      keyword: values.keyword?.trim() || '',
      isEnabled: values.is_enabled,
    };
    setFilters(nextFilters);
    setQuery((previous) => ({ ...previous, page: 1 }));
  };

  const handleTypeReset = () => {
    filterForm.resetFields();
    setFilters({ keyword: '', isEnabled: undefined });
    setQuery((previous) => ({ ...previous, page: 1 }));
    setRefreshKey((key) => key + 1);
  };

  const openCreateType = () => {
    typeForm.resetFields();
    setEditingType(null);
    setTypeVisible(true);
  };

  const openEditType = (record) => {
    setEditingType(record);
    setTypeVisible(true);
  };

  const applyTypeForm = () => {
    typeForm.resetFields();
    if (editingType) {
      typeForm.setFieldsValue({
        type_code: editingType.type_code,
        type_name: editingType.type_name,
        description: editingType.description || '',
        sort_order: editingType.sort_order,
        is_enabled: editingType.is_enabled,
      });
    } else {
      typeForm.setFieldsValue({ ...INITIAL_TYPE_FORM });
    }
  };

  const handleTypeSubmit = async (values) => {
    setTypeSubmitting(true);
    try {
      const payload = {
        type_code: values.type_code.trim(),
        type_name: values.type_name.trim(),
        description: nullIfEmpty(values.description),
        sort_order: values.sort_order ?? 0,
        is_enabled: values.is_enabled,
      };

      if (editingType) {
        await updateDictionaryType(editingType.id, payload);
        Message.success('字典类型修改成功');
      } else {
        await createDictionaryType(payload);
        Message.success('字典类型创建成功');
      }

      setTypeVisible(false);
      setEditingType(null);
      setRefreshKey((key) => key + 1);
    } catch {
      // request.js 已统一提示错误。
    } finally {
      setTypeSubmitting(false);
    }
  };

  const handleDeleteType = async (record) => {
    try {
      await deleteDictionaryType(record.id);
      Message.success('字典类型删除成功');
      setRefreshKey((key) => key + 1);
      const nextPage = types.length === 1 && query.page > 1 ? query.page - 1 : query.page;
      setQuery((previous) => ({ ...previous, page: nextPage }));
    } catch {
      // 有字典项时后端返回 409，request.js 已提示。
    }
  };

  const openItemManager = (record) => {
    setActiveType(record);
    itemFilterForm.resetFields();
    setItemFilters({ keyword: '', isEnabled: undefined });
    setItemQuery({ page: 1, pageSize: 20 });
    setItemRefreshKey((key) => key + 1);
    setItemDrawerVisible(true);
  };

  const handleItemSearch = (values) => {
    setItemFilters({
      keyword: values.keyword?.trim() || '',
      isEnabled: values.is_enabled,
    });
    setItemQuery((previous) => ({ ...previous, page: 1 }));
  };

  const handleItemReset = () => {
    itemFilterForm.resetFields();
    setItemFilters({ keyword: '', isEnabled: undefined });
    setItemQuery((previous) => ({ ...previous, page: 1 }));
    setItemRefreshKey((key) => key + 1);
  };

  const openCreateItem = () => {
    itemForm.resetFields();
    setEditingItem(null);
    setItemFormVisible(true);
  };

  const openEditItem = async (record) => {
    if (!activeType) return;
    try {
      const latest = await fetchDictionaryItemDetail(activeType.id, record.id);
      setEditingItem(latest);
      setItemFormVisible(true);
    } catch {
      // request.js 已提示。
    }
  };

  const applyItemForm = () => {
    itemForm.resetFields();
    if (editingItem) {
      itemForm.setFieldsValue({
        item_code: editingItem.item_code,
        item_name: editingItem.item_name,
        sort_order: editingItem.sort_order,
        is_enabled: editingItem.is_enabled,
        remark: editingItem.remark || '',
      });
    } else {
      itemForm.setFieldsValue({ ...INITIAL_ITEM_FORM });
    }
  };

  const handleItemSubmit = async (values) => {
    if (!activeType) return;
    setItemSubmitting(true);
    try {
      const payload = {
        item_code: values.item_code.trim(),
        item_name: values.item_name.trim(),
        sort_order: values.sort_order ?? 0,
        is_enabled: values.is_enabled,
        remark: nullIfEmpty(values.remark),
      };

      if (editingItem) {
        await updateDictionaryItem(activeType.id, editingItem.id, payload);
        Message.success('字典项修改成功');
      } else {
        await createDictionaryItem(activeType.id, payload);
        Message.success('字典项创建成功');
      }

      setItemFormVisible(false);
      setEditingItem(null);
      setItemRefreshKey((key) => key + 1);
      setRefreshKey((key) => key + 1);
    } catch {
      // request.js 已提示。
    } finally {
      setItemSubmitting(false);
    }
  };

  const handleDeleteItem = async (record) => {
    if (!activeType) return;
    try {
      await deleteDictionaryItem(activeType.id, record.id);
      Message.success('字典项删除成功');
      setItemRefreshKey((key) => key + 1);
      setRefreshKey((key) => key + 1);
    } catch {
      // request.js 已提示。
    }
  };

  const typeColumns = [
    {
      title: '字典类型',
      dataIndex: 'type_name',
      width: 260,
      render: (_, record) => <TypeCell record={record} />,
    },
    {
      title: '字典项',
      dataIndex: 'item_count',
      width: 120,
      render: (value) => (
        <Space size={6}>
          <Tag color={value > 0 ? 'arcoblue' : 'gray'}>{value}</Tag>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            项
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      width: 100,
      render: (value) => <EnabledTag enabled={value} />,
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 170,
      render: (value) => (
        <Typography.Text type="secondary" style={{ whiteSpace: 'nowrap' }}>
          {formatDateTime(value)}
        </Typography.Text>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Button
            type="text"
            size="mini"
            icon={<IconList />}
            onClick={() => openItemManager(record)}
          >
            管理字典项
          </Button>
          <Tooltip content="编辑类型">
            <Button
              type="text"
              size="mini"
              icon={<IconEdit />}
              onClick={() => openEditType(record)}
              aria-label="编辑字典类型"
            />
          </Tooltip>
          <Tooltip
            content={record.item_count > 0 ? '请先删除该类型下的字典项' : '删除类型'}
          >
            <Popconfirm
              title={`删除字典类型「${record.type_name}」？`}
              content="删除后不可恢复。"
              disabled={record.item_count > 0}
              onOk={() => handleDeleteType(record)}
            >
              <Button
                type="text"
                size="mini"
                status="danger"
                icon={<IconDelete />}
                disabled={record.item_count > 0}
                aria-label="删除字典类型"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const itemColumns = [
    {
      title: '字典键',
      dataIndex: 'item_code',
      width: 160,
      render: (value) => <Typography.Text className="dict-item-key">{value}</Typography.Text>,
    },
    {
      title: '字典值',
      dataIndex: 'item_name',
      width: 180,
      render: (value) => <Typography.Text className="dict-item-value">{value}</Typography.Text>,
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      width: 70,
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      width: 90,
      render: (value) => <EnabledTag enabled={value} />,
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 160,
      render: (value) => (
        <Typography.Text type="secondary" style={{ whiteSpace: 'nowrap' }}>
          {formatDateTime(value)}
        </Typography.Text>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 100,
      render: (_, record) => (
        <Space size={0}>
          <Tooltip content="编辑字典项">
            <Button
              type="text"
              size="mini"
              icon={<IconEdit />}
              onClick={() => openEditItem(record)}
              aria-label="编辑字典项"
            />
          </Tooltip>
          <Popconfirm
            title="删除这个字典项？"
            content="删除后不可恢复。"
            onOk={() => handleDeleteItem(record)}
          >
            <Tooltip content="删除字典项">
              <Button
                type="text"
                size="mini"
                status="danger"
                icon={<IconDelete />}
                aria-label="删除字典项"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="dict-page">
      <div className="dict-toolbar">
        <div className="dict-metrics">
          <span className="dict-metric">
            字典类型 <strong>{total}</strong>
          </span>
          <span className="dict-metric">
            本页启用 <strong>{metrics.enabledTypes}</strong>
          </span>
          <span className="dict-metric">
            本页字典项 <strong>{metrics.itemCount}</strong>
          </span>
          <span className="dict-metric">
            总页数 <strong>{pages}</strong>
          </span>
        </div>
        <Space>
          <Button
            size="small"
            icon={<IconRefresh />}
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            刷新
          </Button>
          <Button size="small" type="primary" icon={<IconPlus />} onClick={openCreateType}>
            新增字典类型
          </Button>
        </Space>
      </div>

      <Form
        form={filterForm}
        layout="inline"
        className="dict-filters"
        initialValues={{ keyword: '', is_enabled: undefined }}
        onSubmit={handleTypeSearch}
      >
        <div className="dict-filter-field">
          <span className="dict-filter-label">类型名称 / 编码</span>
          <Form.Item field="keyword" noStyle>
            <Input
              size="small"
              allowClear
              prefix={<IconSearch />}
              placeholder="例如：性别 / gender"
              onPressEnter={() => filterForm.submit()}
            />
          </Form.Item>
        </div>
        <div className="dict-filter-field dict-filter-field--status">
          <span className="dict-filter-label">启用状态</span>
          <Form.Item field="is_enabled" noStyle>
            <Select size="small" allowClear placeholder="全部" options={ENABLED_OPTIONS} />
          </Form.Item>
        </div>
        <div className="dict-filter-actions">
          <Button size="small" htmlType="submit" type="primary" icon={<IconFilter />}>
            查询
          </Button>
          <Button size="small" onClick={handleTypeReset}>
            重置
          </Button>
        </div>
      </Form>

      <section className="dict-sheet" aria-label="字典类型列表">
        <div className="dict-sheet__body" ref={sheetBodyRef}>
          <Table
            rowKey="id"
            columns={typeColumns}
            data={types}
            loading={loading}
            pagination={false}
            scroll={{ x: 960, y: tableScrollY }}
          />
        </div>
        <footer className="dict-sheet__foot">
          <span className="dict-sheet__count">共 {total} 个字典类型</span>
          <Pagination
            size="small"
            current={query.page}
            pageSize={query.pageSize}
            total={total}
            showTotal
            sizeCanChange
            sizeOptions={[10, 20, 50]}
            onChange={(page, pageSize) =>
              setQuery((previous) => ({ ...previous, page, pageSize }))
            }
          />
        </footer>
      </section>

      <Drawer
        title={editingType ? '编辑字典类型' : '新增字典类型'}
        visible={typeVisible}
        onOk={() => typeForm.submit()}
        onCancel={() => setTypeVisible(false)}
        confirmLoading={typeSubmitting}
        okText="保存"
        width={760}
        className="dict-type-drawer"
        unmountOnExit
        afterOpen={applyTypeForm}
      >
        <Form
          form={typeForm}
          layout="vertical"
          initialValues={INITIAL_TYPE_FORM}
          onSubmit={handleTypeSubmit}
          requiredSymbol={false}
        >
          <DictionaryTypeFormFields />
        </Form>
      </Drawer>

      <Drawer
        title={
          <Space size={8}>
            <IconBook />
            <span>字典项 · {activeType?.type_name || ''}</span>
            <Tag>{activeType?.type_code}</Tag>
          </Space>
        }
        visible={itemDrawerVisible}
        onCancel={() => setItemDrawerVisible(false)}
        footer={<Button onClick={() => setItemDrawerVisible(false)}>关闭</Button>}
        width={1120}
        className="dict-item-drawer"
      >
        <div className="dict-item-panel">
          <div className="dict-item-panel__intro">
            <Typography.Text type="secondary">
              管理「{activeType?.type_name}」下的键值对，例如 male / 男、female / 女。
            </Typography.Text>
          </div>

          <Form
            form={itemFilterForm}
            layout="inline"
            className="dict-item-toolbar"
            initialValues={{ keyword: '', is_enabled: undefined }}
            onSubmit={handleItemSearch}
          >
            <Form.Item field="keyword" noStyle>
              <Input
                size="small"
                allowClear
                prefix={<IconSearch />}
                placeholder="搜索字典键或字典值"
                onPressEnter={() => itemFilterForm.submit()}
              />
            </Form.Item>
            <Form.Item field="is_enabled" noStyle>
              <Select size="small" allowClear placeholder="全部状态" options={ENABLED_OPTIONS} />
            </Form.Item>
            <Button size="small" htmlType="submit" type="primary">
              查询
            </Button>
            <Button size="small" onClick={handleItemReset}>
              重置
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<IconPlus />}
              style={{ marginLeft: 'auto' }}
              onClick={openCreateItem}
              disabled={!activeType}
            >
              新增字典项
            </Button>
          </Form>

          <Table
            rowKey="id"
            columns={itemColumns}
            data={items}
            loading={itemLoading}
            scroll={{ x: 760 }}
            pagination={{
              current: itemQuery.page,
              pageSize: itemQuery.pageSize,
              total: itemTotal,
              showTotal: true,
              sizeCanChange: true,
              sizeOptions: [10, 20, 50],
              onChange: (page, pageSize) =>
                setItemQuery((previous) => ({ ...previous, page, pageSize })),
            }}
          />
          <div className="dict-item-panel__count">共 {itemTotal} 个字典项</div>
        </div>
      </Drawer>

      <Modal
        title={editingItem ? '编辑字典项' : '新增字典项'}
        visible={itemFormVisible}
        onOk={() => itemForm.submit()}
        onCancel={() => setItemFormVisible(false)}
        confirmLoading={itemSubmitting}
        okText="保存"
        width={680}
        afterOpen={applyItemForm}
      >
        <Form
          form={itemForm}
          layout="vertical"
          initialValues={INITIAL_ITEM_FORM}
          onSubmit={handleItemSubmit}
          requiredSymbol={false}
        >
          <DictionaryItemFormFields />
        </Form>
      </Modal>
    </div>
  );
}
