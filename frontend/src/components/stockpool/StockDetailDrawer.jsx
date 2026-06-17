import { DeleteOutlined, PlusCircleOutlined, SaveOutlined, StarOutlined } from '@ant-design/icons';
import { Button, Descriptions, Divider, Drawer, Input, message, Segmented, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteStockPoolMutation, useUpdateStockPredictionMutation } from '../../app/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PREDICTION_OPTIONS = [
  { value: 1, label: '\u{1F4C8} 看涨' },
  { value: -1, label: '\u{1F4C9} 看跌' },
  { value: 0, label: '\u{1F532} 震荡' },
  { value: 99, label: '❌ 未评' },
];

const PREDICTION_LABELS = {
  1: '看涨',
  [-1]: '看跌',
  0: '震荡',
  99: '未评',
};

const PREDICTION_COLORS = {
  1: '#52c41a',
  [-1]: '#ff4d4f',
  0: '#faad14',
  99: '#8b949e',
};

const PREDICTION_DETAIL_TEMPLATES = {
  1: '均线多头, 放量突破, 主力加仓',
  [-1]: '均线空头, 缩量下跌, 主力出货',
  0: '缩量震荡, 方向不明, 观望',
  99: '',
};

const StockDetailDrawer = ({ visible, stock, onClose, onDeleted }) => {
  const navigate = useNavigate();
  const [deleteStock, { isLoading: deleting }] = useDeleteStockPoolMutation();
  const [updatePrediction, { isLoading: saving }] = useUpdateStockPredictionMutation();

  const [predictionFlag, setPredictionFlag] = useState(99);
  const [predictionDetail, setPredictionDetail] = useState('');
  const [viewpoint, setViewpoint] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (stock) {
      setPredictionFlag(stock.prediction_flag ?? 99);
      setPredictionDetail(stock.prediction_detail || '');
      setViewpoint(stock.viewpoint || '');
      setSaved(false);
    }
  }, [stock]);

  if (!stock) return null;

  const handlePredictionChange = (value) => {
    setPredictionFlag(value);
    setPredictionDetail(PREDICTION_DETAIL_TEMPLATES[value] || '');
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      await updatePrediction({
        symbol: stock.symbol,
        trade_date: dayjs(stock.trade_date).format('YYYY-MM-DD'),
        pool_type: stock.pool_type,
        status: stock.status,
        prediction_flag: predictionFlag,
        prediction_detail: predictionDetail,
        viewpoint: viewpoint,
      }).unwrap();
      message.success('预测信息已保存');
      setSaved(true);
    } catch (err) {
      message.error(err?.data?.error || '保存失败');
    }
  };

  const handleAddToTrade = () => {
    const params = new URLSearchParams();
    if (stock.symbol) params.set('symbol', stock.symbol);
    if (stock.stock_name) params.set('name', stock.stock_name);
    params.set('strategy', '股票池');
    params.set('signal', '股票池');
    navigate(`/trades/new?${params.toString()}`);
  };

  const handleDelete = async () => {
    try {
      await deleteStock({
        symbol: stock.symbol,
        trade_date: dayjs(stock.trade_date).format('YYYY-MM-DD'),
        pool_type: stock.pool_type,
        status: stock.status,
      }).unwrap();
      message.success('已移出股票池');
      onClose();
      if (onDeleted) onDeleted();
    } catch (err) {
      message.error(err?.data?.error || '操作失败');
    }
  };

  const predictionTagColor = PREDICTION_COLORS[predictionFlag] || '#8b949e';
  const predictionLabel = PREDICTION_LABELS[predictionFlag] || '未评';

  return (
    <Drawer
      title={
        <Space>
          <span style={{ fontSize: 20 }}>{stock.stock_name}</span>
          <span style={{ color: '#8b949e', fontSize: 14 }}>({stock.symbol})</span>
          {predictionFlag !== 99 && (
            <Tag color={predictionTagColor} style={{ marginLeft: 8 }}>
              {predictionLabel}
            </Tag>
          )}
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={450}
      headerStyle={{ background: '#141414', borderBottom: '1px solid #30363d' }}
      bodyStyle={{ background: '#0d1117', color: '#c9d1d9' }}
    >
      <Descriptions column={1} size="small">
        <Descriptions.Item label={<Text type="secondary">所属板块</Text>}>
          <Tag color="blue">{stock.sector_name}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={<Text type="secondary">当前评分</Text>}>
          <Text strong style={{ color: stock.score > 80 ? '#ff4d4f' : '#faad14', fontSize: 18 }}>
            {stock.score}
          </Text>
        </Descriptions.Item>
      </Descriptions>

      <Divider style={{ borderColor: '#30363d' }} />

      <Title level={5} style={{ color: '#c9d1d9' }}>股票预测</Title>
      <div
        style={{
          background: '#161b22',
          border: `1px solid ${predictionTagColor}40`,
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>
            预测方向
          </Text>
          <Segmented
            block
            value={predictionFlag}
            onChange={handlePredictionChange}
            options={PREDICTION_OPTIONS}
            style={{
              background: '#0d1117',
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>
            预测依据
          </Text>
          <Input
            value={predictionDetail}
            onChange={(e) => {
              setPredictionDetail(e.target.value);
              setSaved(false);
            }}
            placeholder="均线多头, 放量突破..."
            style={{
              background: '#0d1117',
              borderColor: '#30363d',
              color: '#c9d1d9',
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>
            我的观点
          </Text>
          <TextArea
            value={viewpoint}
            onChange={(e) => {
              setViewpoint(e.target.value);
              setSaved(false);
            }}
            placeholder="写下你对这只票的看法..."
            rows={3}
            style={{
              background: '#0d1117',
              borderColor: '#30363d',
              color: '#c9d1d9',
            }}
          />
        </div>

        <Button
          type="primary"
          block
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
          style={{
            background: saved ? '#238636' : '#6e40c9',
            borderColor: saved ? '#238636' : '#6e40c9',
          }}
        >
          {saved ? '✅ 已保存' : '保存预测'}
        </Button>
      </div>

      <Divider style={{ borderColor: '#30363d' }} />

      <Title level={5} style={{ color: '#c9d1d9' }}>操作</Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button
          type="primary"
          block
          icon={<PlusCircleOutlined />}
          style={{ background: '#238636', borderColor: '#238636' }}
          onClick={handleAddToTrade}
        >
          加入交易
        </Button>
        <Button block icon={<StarOutlined />}>
          加入重点观察
        </Button>
        <Button danger block icon={<DeleteOutlined />} loading={deleting} onClick={handleDelete}>
          移出股票池
        </Button>
      </Space>
    </Drawer>
  );
};

export default StockDetailDrawer;
