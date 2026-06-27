import { useState, useMemo, useEffect } from 'react'
import {
  Row, Col, Card, Typography, Input, Button, Table, Tag, Tree,
  Space, Modal, Form, Popconfirm, message, Empty, Spin, Tooltip, Badge,
  AutoComplete,
} from 'antd'
import {
  PlayCircleOutlined, PlusOutlined, DeleteOutlined, EditOutlined,
  SaveOutlined, StarFilled, StarOutlined, HistoryOutlined,
  FolderOutlined, FileTextOutlined, ClearOutlined, ReloadOutlined,
  UpOutlined, DownOutlined, LeftOutlined, RightOutlined,
} from '@ant-design/icons'
// SaveOutlined used below
import {
  useGetSavedSqlsQuery,
  useCreateSavedSqlMutation,
  useUpdateSavedSqlMutation,
  useDeleteSavedSqlMutation,
  useExecuteSqlMutation,
  useGetSqlHistoryQuery,
  useClearSqlHistoryMutation,
  useCreateStockPoolMutation,
} from '../app/api'

const { Title, Text } = Typography
const { TextArea } = Input

const ResearchLabPage = () => {
  // Saved SQLs
  const { data: savedList = [], isLoading: loadingSaved, refetch: refetchSaved } = useGetSavedSqlsQuery()
  const [createSaved] = useCreateSavedSqlMutation()
  const [updateSaved] = useUpdateSavedSqlMutation()
  const [deleteSaved] = useDeleteSavedSqlMutation()

  // Execute
  const [executeSql, { isLoading: executing }] = useExecuteSqlMutation()

  // History
  const { data: historyList = [], isLoading: loadingHistory, refetch: refetchHistory } = useGetSqlHistoryQuery(20)
  const [clearHistory] = useClearSqlHistoryMutation()
  const [createStockPool] = useCreateStockPoolMutation()

  // Persist key state across tab switches via sessionStorage
  const readSS = (key, fallback) => {
    try { const v = sessionStorage.getItem('rlab_'+key); return v != null ? JSON.parse(v) : fallback }
    catch { return fallback }
  }
  const writeSS = (key, val) => {
    try { sessionStorage.setItem('rlab_'+key, JSON.stringify(val)) } catch {}
  }

  // UI state (restore from sessionStorage on mount)
  const [sqlText, setSqlText] = useState(() => readSS('sqlText', ''))
  const [result, setResult] = useState(() => readSS('result', null))
  const [execError, setExecError] = useState(null) // don't persist errors
  const [activeSavedId, setActiveSavedId] = useState(() => readSS('activeSavedId', null))
  const [savedCollapsed, setSavedCollapsed] = useState(false)
  const [historyCollapsed, setHistoryCollapsed] = useState(false)

  // Persist on change
  useEffect(() => { writeSS('sqlText', sqlText) }, [sqlText])
  useEffect(() => { if (result) writeSS('result', result) }, [result])
  useEffect(() => { writeSS('activeSavedId', activeSavedId) }, [activeSavedId])

  // Save/edit modal
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [saveForm] = Form.useForm()

  // Rename modal
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [renameRecord, setRenameRecord] = useState(null)
  const [renameForm] = Form.useForm()

  // Build tree from saved SQLs grouped by category > strategy_type
  const treeData = useMemo(() => {
    const groups = {}
    for (const s of savedList) {
      const cat = s.category || '未分类'
      const st = s.strategy_type || '通用'
      if (!groups[cat]) groups[cat] = {}
      if (!groups[cat][st]) groups[cat][st] = []
      groups[cat][st].push(s)
    }
    const nodes = []
    for (const [cat, strategies] of Object.entries(groups)) {
      const catChildren = []
      for (const [st, sqls] of Object.entries(strategies)) {
        catChildren.push({
          title: <span style={{ color: '#8b949e', fontSize: 12 }}>{st}</span>,
          key: `${cat}/${st}`,
          selectable: false,
          children: sqls.map((s) => ({
            title: (
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
                onClick={(e) => {
                  // Only select on clicking name, not delete button
                  if (e.target.closest('.delete-sql-btn')) return
                }}
              >
                <Space size={4} style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ color: '#c9d1d9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.name}
                  </span>
                  {s.favorite ? <StarFilled style={{ color: '#faad14', fontSize: 10 }} /> : null}
                </Space>
                <Button
                  className="rename-sql-btn"
                  type="text"
                  size="small"
                  icon={<EditOutlined style={{ fontSize: 11 }} />}
                  onClick={(e) => { e.stopPropagation(); handleRename(s) }}
                  style={{ flexShrink: 0, marginLeft: 4, opacity: 0.5, color: '#8b949e' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = 1 }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.5 }}
                  title="重命名"
                />
                <Popconfirm
                  title="确定删除此收藏SQL？"
                  onConfirm={() => handleDelete(s.id)}
                  okText="删除"
                  cancelText="取消"
                >
                  <Button
                    className="delete-sql-btn"
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined style={{ fontSize: 11 }} />}
                    onClick={(e) => e.stopPropagation()}
                    style={{ flexShrink: 0, marginLeft: 4, opacity: 0.5 }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = 1 }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.5 }}
                  />
                </Popconfirm>
              </div>
            ),
            key: `sql:${s.id}`,
            icon: <FileTextOutlined style={{ color: '#58a6ff' }} />,
            isLeaf: true,
            sqlData: s,
          })),
        })
      }
      nodes.push({
        title: <span style={{ color: '#e6edf3', fontWeight: 600 }}>{cat}</span>,
        key: cat,
        icon: <FolderOutlined style={{ color: '#d2a84b' }} />,
        children: catChildren,
      })
    }
    return nodes
  }, [savedList])

  // Unique categories & strategy types for AutoComplete
  const categoryOptions = useMemo(() => {
    const cats = [...new Set(savedList.map((s) => s.category).filter(Boolean))]
    return cats.map((c) => ({ value: c }))
  }, [savedList])
  const strategyOptions = useMemo(() => {
    const sts = [...new Set(savedList.map((s) => s.strategy_type).filter(Boolean))]
    return sts.map((s) => ({ value: s }))
  }, [savedList])

  const handleTreeSelect = (keys, info) => {
    if (info.node?.sqlData) {
      const s = info.node.sqlData
      setSqlText(s.sql_text)
      setActiveSavedId(s.id)
      setResult(null)
      setExecError(null)
    }
  }

  const handleRun = async () => {
    setExecError(null)
    setResult(null)
    if (!sqlText.trim()) {
      message.warning('请输入SQL')
      return
    }
    try {
      const payload = { sql_text: sqlText }
      if (activeSavedId) {
        const saved = savedList.find((s) => s.id === activeSavedId)
        payload.saved_id = activeSavedId
        payload.saved_name = saved?.name || ''
      }
      const res = await executeSql(payload).unwrap()
      setResult(res)
      refetchHistory()
    } catch (err) {
      setExecError(err?.data?.message || err?.message || '执行失败')
    }
  }

  const handleSaveNew = () => {
    setEditingRecord(null)
    saveForm.resetFields()
    saveForm.setFieldsValue({ sql_text: sqlText })
    setSaveModalOpen(true)
  }

  const handleSaveOverwrite = async () => {
    if (!activeSavedId) return
    const saved = savedList.find((s) => s.id === activeSavedId)
    if (!saved) return
    if (!sqlText.trim()) { message.warning('SQL不能为空'); return }
    try {
      await updateSaved({
        id: saved.id,
        name: saved.name,
        category: saved.category || '',
        strategy_type: saved.strategy_type || '',
        description: saved.description || '',
        sql_text: sqlText,
      }).unwrap()
      message.success(`已覆盖保存「${saved.name}」`)
      refetchSaved()
    } catch (err) {
      message.error('保存失败')
    }
  }

  const handleEdit = (s) => {
    setEditingRecord(s)
    saveForm.setFieldsValue(s)
    setSaveModalOpen(true)
  }

  const handleSaveSubmit = async () => {
    const values = await saveForm.validateFields()
    if (editingRecord) {
      await updateSaved({ id: editingRecord.id, ...values }).unwrap()
      message.success('已更新')
    } else {
      await createSaved(values).unwrap()
      message.success('已保存')
    }
    setSaveModalOpen(false)
    refetchSaved()
  }

  const handleDelete = async (id) => {
    await deleteSaved(id).unwrap()
    message.success('已删除')
    if (activeSavedId === id) setActiveSavedId(null)
    refetchSaved()
  }

  const handleRename = (record) => {
    setRenameRecord(record)
    renameForm.setFieldsValue({ name: record.name })
    setRenameModalOpen(true)
  }

  const handleRenameSubmit = async () => {
    const values = await renameForm.validateFields()
    if (!renameRecord) return
    try {
      await updateSaved({
        id: renameRecord.id,
        name: values.name,
        category: renameRecord.category || '',
        strategy_type: renameRecord.strategy_type || '',
        description: renameRecord.description || '',
        sql_text: renameRecord.sql_text || '',
      }).unwrap()
      message.success(`已重命名「${renameRecord.name}」→「${values.name}」`)
      setRenameModalOpen(false)
      setRenameRecord(null)
      refetchSaved()
    } catch (err) {
      message.error('重命名失败')
    }
  }

  const handleClearHistory = async () => {
    await clearHistory(30).unwrap()
    message.success('已清理30天前历史')
    refetchHistory()
  }

  // Detect symbol/name column indices for add-to-pool
  const symbolColIdx = useMemo(() => {
    if (!result?.columns) return null
    const idx = result.columns.findIndex((c) => c.toLowerCase() === 'symbol')
    return idx >= 0 ? idx : null
  }, [result])
  const nameColIdx = useMemo(() => {
    if (!result?.columns) return null
    const idx = result.columns.findIndex((c) => c.toLowerCase() === 'stock_name' || c.toLowerCase() === 'name')
    return idx >= 0 ? idx : null
  }, [result])

  // Add-to-pool modal
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addForm] = Form.useForm()
  const [pendingAdd, setPendingAdd] = useState(null)

  const openAddDialog = (row) => {
    if (symbolColIdx == null) return
    const symbol = String(row[String(symbolColIdx)] || '').trim()
    const stockName = nameColIdx != null ? String(row[String(nameColIdx)] || '').trim() : ''
    if (!symbol) { message.warning('股票代码为空'); return }
    setPendingAdd({ symbol, stockName, hasStockName: nameColIdx != null && stockName !== '' })
    addForm.resetFields()
    addForm.setFieldsValue({
      notes: '手动加入',
      tags: '{}',
      stock_name: nameColIdx != null ? stockName : '',
    })
    setAddModalOpen(true)
  }

  const handleAddSubmit = async () => {
    const values = await addForm.validateFields()
    if (!pendingAdd) return
    // Use form stock_name if the result didn't have one, otherwise use the row value
    const stockName = pendingAdd.hasStockName ? pendingAdd.stockName : values.stock_name
    try {
      await createStockPool({
        symbol: pendingAdd.symbol,
        stock_name: stockName,
        pool_type: 'four_dim',
        notes: values.notes || '手动加入',
        tags: values.tags || '{}',
      }).unwrap()
      message.success(`已添加 ${stockName || pendingAdd.symbol} 到四维共振股票池`)
      setAddModalOpen(false)
      setPendingAdd(null)
    } catch (err) {
      message.error(err?.data?.error || '添加失败')
    }
  }

  // Build dynamic table columns from result
  const resultColumns = useMemo(() => {
    if (!result?.columns) return []
    const cols = result.columns.map((c, i) => ({
      title: c,
      dataIndex: String(i),
      key: c,
      ellipsis: true,
      width: Math.max(100, Math.min(200, c.length * 14)),
      render: (v) => {
        if (v === null || v === undefined) return <span style={{ color: '#484f58' }}>NULL</span>
        if (typeof v === 'number') return <span style={{ color: '#79c0ff' }}>{v}</span>
        return <span>{String(v)}</span>
      },
    }))
    // Append action column if symbol column exists
    if (symbolColIdx != null) {
      cols.push({
        title: '操作',
        key: '_action',
        width: 130,
        fixed: 'right',
        render: (_, row) => (
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => openAddDialog(row)}
          >
            加入四维共振
          </Button>
        ),
      })
    }
    return cols
  }, [result, symbolColIdx])

  const resultDataSource = useMemo(() => {
    if (!result?.rows) return []
    return result.rows.map((row, i) => {
      const obj = { _key: i }
      row.forEach((val, j) => { obj[String(j)] = val })
      return obj
    })
  }, [result])

  return (
    <div style={{ padding: '24px', background: '#0a0a0a', minHeight: '100vh' }}>
      <Title level={2} style={{ color: '#fff', marginBottom: 4 }}>🔬 SQL研究中心</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        自定义查询 · 收藏SQL · 执行历史
      </Text>

      <Row gutter={[16, 16]}>
        {/* Left: Saved SQLs */}
        <Col xs={24} lg={savedCollapsed ? 1 : 5}>
          <Card
            title={savedCollapsed ? null : <span>📁 收藏SQL</span>}
            size="small"
            extra={
              <Space size={4}>
                {!savedCollapsed && (
                  <Button type="text" size="small" icon={<PlusOutlined />} onClick={handleSaveNew} />
                )}
                <Button
                  type="text"
                  size="small"
                  icon={savedCollapsed ? <RightOutlined /> : <LeftOutlined />}
                  onClick={() => setSavedCollapsed(!savedCollapsed)}
                />
              </Space>
            }
            bodyStyle={savedCollapsed ? { display: 'none' } : { padding: '8px 4px', maxHeight: '70vh', overflow: 'auto' }}
          >
            {loadingSaved ? (
              <Spin style={{ display: 'block', padding: 24 }} />
            ) : treeData.length === 0 ? (
              <Empty description="暂无收藏" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 24 }} />
            ) : (
              <Tree
                showIcon
                treeData={treeData}
                onSelect={handleTreeSelect}
                selectedKeys={activeSavedId ? [`sql:${activeSavedId}`] : []}
                style={{ background: 'transparent', color: '#c9d1d9' }}
              />
            )}
          </Card>
        </Col>

        {/* Center: Editor + Result */}
        <Col xs={24} lg={14 + (savedCollapsed ? 4 : 0) + (historyCollapsed ? 4 : 0)}>
          {/* Editor */}
          <Card
            title={<span>💻 SQL编辑器</span>}
            size="small"
            extra={
              <Space>
                <Button
                  type="text"
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={() => { setSqlText(''); setResult(null); setExecError(null); setActiveSavedId(null) }}
                >
                  清空
                </Button>
                {activeSavedId && (
                  <Button type="text" size="small" icon={<SaveOutlined />} onClick={handleSaveOverwrite}>
                    覆盖保存
                  </Button>
                )}
                <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleRun} loading={executing}>
                  运行
                </Button>
              </Space>
            }
            bodyStyle={{ padding: 12 }}
          >
            <TextArea
              value={sqlText}
              onChange={(e) => setSqlText(e.target.value)}
              placeholder="SELECT * FROM quant_db.stk_stock_fund_flow WHERE trade_date = (SELECT MAX(trade_date) FROM quant_db.stk_chip_factor) AND capital_score > 80 LIMIT 20"
              autoSize={{ minRows: 8, maxRows: 30 }}
              style={{
                background: '#0d1117',
                color: '#c9d1d9',
                fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                fontSize: 13,
                border: '1px solid #30363d',
                borderRadius: 6,
                resize: 'vertical',
              }}
            />
            {execError && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(255,77,79,0.1)', border: '1px solid #ff4d4f', borderRadius: 4, color: '#ff4d4f', fontSize: 13 }}>
                ❌ {execError}
              </div>
            )}
          </Card>

          {/* Result */}
          <Card
            title={
              <span>
                📊 查询结果
                {result && (
                  <Tag color="green" style={{ marginLeft: 8 }}>
                    {result.row_count} 行 · {result.execute_ms}ms
                  </Tag>
                )}
              </span>
            }
            size="small"
            style={{ marginTop: 12 }}
            bodyStyle={{ padding: 0 }}
          >
            {result ? (
              <Table
                columns={resultColumns}
                dataSource={resultDataSource}
                rowKey="_key"
                size="small"
                scroll={{ x: 'max-content', y: 400 }}
                pagination={{ pageSize: 50, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#8b949e' }}>
                输入SQL并点击「运行」查看结果
              </div>
            )}
          </Card>
        </Col>

        {/* Right: History */}
        <Col xs={24} lg={historyCollapsed ? 1 : 5}>
          <Card
            title={historyCollapsed ? null : <span><HistoryOutlined /> 执行历史</span>}
            size="small"
            extra={
              <Space size={4}>
                {!historyCollapsed && (
                  <Button type="text" size="small" icon={<ClearOutlined />} onClick={handleClearHistory} />
                )}
                <Button
                  type="text"
                  size="small"
                  icon={historyCollapsed ? <LeftOutlined /> : <RightOutlined />}
                  onClick={() => setHistoryCollapsed(!historyCollapsed)}
                />
              </Space>
            }
            bodyStyle={historyCollapsed ? { display: 'none' } : { padding: '8px 4px', maxHeight: '70vh', overflow: 'auto' }}
          >
            {loadingHistory ? (
              <Spin style={{ display: 'block', padding: 24 }} />
            ) : historyList.length === 0 ? (
              <Empty description="暂无记录" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 12 }} />
            ) : (
              historyList.map((h) => (
                <div
                  key={h.id}
                  onClick={() => {
                    setSqlText(h.sql_text)
                    setResult(null)
                    setExecError(null)
                    setActiveSavedId(h.sql_id || null)
                  }}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #21262d',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a2e' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#c9d1d9', fontWeight: 600, fontSize: 12 }}>
                      {h.sql_name || '自定义查询'}
                    </span>
                    <Tag color={h.execute_status === 'SUCCESS' ? 'green' : 'red'} style={{ fontSize: 10 }}>
                      {h.execute_status === 'SUCCESS' ? `${h.result_count}条` : '失败'}
                    </Tag>
                  </div>
                  <div style={{ color: '#8b949e', fontSize: 11, marginTop: 2 }}>
                    {h.execute_time?.slice(11, 19)} · {h.execute_ms}ms
                  </div>
                  {h.error_message && (
                    <div style={{ color: '#ff4d4f', fontSize: 10, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.error_message}
                    </div>
                  )}
                </div>
              ))
            )}
          </Card>
        </Col>
      </Row>

      {/* Rename Modal */}
      <Modal
        title={`重命名「${renameRecord?.name || ''}」`}
        open={renameModalOpen}
        onCancel={() => { setRenameModalOpen(false); setRenameRecord(null) }}
        onOk={handleRenameSubmit}
        okText="确认"
        width={400}
      >
        <Form form={renameForm} layout="vertical">
          <Form.Item name="name" label="新名称" rules={[{ required: true, message: '请输入新名称' }]}>
            <Input placeholder="输入新的SQL名称" autoFocus />
          </Form.Item>
        </Form>
      </Modal>

      {/* Save/Edit Modal */}
      <Modal
        title={editingRecord ? '编辑SQL' : '保存SQL'}
        open={saveModalOpen}
        onCancel={() => setSaveModalOpen(false)}
        onOk={handleSaveSubmit}
        okText="保存"
        width={560}
      >
        <Form form={saveForm} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如: 主力吸筹榜" />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <AutoComplete options={categoryOptions} placeholder="选择或输入分类，如: 筹码" allowClear />
          </Form.Item>
          <Form.Item name="strategy_type" label="策略类型">
            <AutoComplete options={strategyOptions} placeholder="选择或输入类型，如: 选股" allowClear />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input placeholder="简要说明" />
          </Form.Item>
          <Form.Item name="sql_text" label="SQL" rules={[{ required: true, message: '请输入SQL' }]}>
            <TextArea
              rows={6}
              style={{ fontFamily: 'monospace', fontSize: 13 }}
              placeholder="SELECT * FROM ..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add-to-Pool Modal */}
      <Modal
        title={`添加 ${pendingAdd?.stockName || pendingAdd?.symbol || ''} 到四维共振股票池`}
        open={addModalOpen}
        onCancel={() => { setAddModalOpen(false); setPendingAdd(null) }}
        onOk={handleAddSubmit}
        okText="确认添加"
        width={480}
      >
        <Form form={addForm} layout="vertical">
          {!pendingAdd?.hasStockName && (
            <Form.Item
              name="stock_name"
              label="股票名称"
              rules={[{ required: true, message: '请输入股票名称' }]}
            >
              <Input placeholder="请输入股票名称（SQL结果未包含stock_name列）" />
            </Form.Item>
          )}
          {pendingAdd?.hasStockName && (
            <div style={{ marginBottom: 16, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 6 }}>
              <span style={{ color: '#8c8c8c', fontSize: 12 }}>股票名称：</span>
              <span style={{ color: '#fff', fontWeight: 500 }}>{pendingAdd.stockName}</span>
            </div>
          )}
          <Form.Item name="notes" label="备注 (Notes)">
            <Input.TextArea rows={3} placeholder="手动加入" />
          </Form.Item>
          <Form.Item name="tags" label="标签 (Tags - JSON)">
            <Input.TextArea rows={3} placeholder='{"key": "value"}' style={{ fontFamily: 'monospace', fontSize: 13 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ResearchLabPage
