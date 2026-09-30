import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, InputNumber, Switch, Button, Slider, Typography, Space, Table, Tag, Progress, Statistic, message } from 'antd';
import { Settings, ShieldCheck, Database, HardDrive, Trash2, Cpu, History, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const SettingsPage = () => {
  const [health, setHealth] = useState(null);
  const [settings, setSettings] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [form] = Form.useForm();

  const { isAdmin } = useAuth();

  const fetchSystemData = async () => {
    try {
      const [healthRes, settingsRes, auditRes] = await Promise.all([
        api.get('/system/health'),
        api.get('/system/settings'),
        api.get('/system/audit-logs?limit=15')
      ]);
      setHealth(healthRes.data);
      setSettings(settingsRes.data.settings || {});
      setAuditLogs(auditRes.data.audit_logs || []);

      form.setFieldsValue({
        FACE_MATCH_THRESHOLD: parseFloat(settingsRes.data.settings.FACE_MATCH_THRESHOLD || '0.62'),
        FACE_RECOGNITION_INTERVAL: parseInt(settingsRes.data.settings.FACE_RECOGNITION_INTERVAL || '5'),
        EVENT_COOLDOWN_SECONDS: parseInt(settingsRes.data.settings.EVENT_COOLDOWN_SECONDS || '10'),
        SNAPSHOT_RETENTION_DAYS: parseInt(settingsRes.data.settings.SNAPSHOT_RETENTION_DAYS || '30'),
        CLIP_RETENTION_DAYS: parseInt(settingsRes.data.settings.CLIP_RETENTION_DAYS || '30'),
        UNKNOWN_RETENTION_DAYS: parseInt(settingsRes.data.settings.UNKNOWN_RETENTION_DAYS || '15'),
        GPU_ENABLED: settingsRes.data.settings.GPU_ENABLED === 'true'
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  const handleSaveSettings = async (values) => {
    setSaving(true);
    try {
      await api.put('/system/settings', {
        FACE_MATCH_THRESHOLD: values.FACE_MATCH_THRESHOLD.toString(),
        FACE_RECOGNITION_INTERVAL: values.FACE_RECOGNITION_INTERVAL.toString(),
        EVENT_COOLDOWN_SECONDS: values.EVENT_COOLDOWN_SECONDS.toString(),
        SNAPSHOT_RETENTION_DAYS: values.SNAPSHOT_RETENTION_DAYS.toString(),
        CLIP_RETENTION_DAYS: values.CLIP_RETENTION_DAYS.toString(),
        UNKNOWN_RETENTION_DAYS: values.UNKNOWN_RETENTION_DAYS.toString(),
        GPU_ENABLED: values.GPU_ENABLED ? 'true' : 'false'
      });
      message.success('System AI & Retention parameters updated successfully');
      fetchSystemData();
    } catch (err) {
      message.error('Failed to update system parameters');
    } finally {
      setSaving(false);
    }
  };

  const handleManualCleanup = async () => {
    setCleaning(true);
    try {
      const res = await api.post('/system/retention/cleanup');
      message.success(`Cleanup complete! Deleted ${res.data.results.deleted_snapshots} snapshots, ${res.data.results.deleted_clips} clips.`);
      fetchSystemData();
    } catch (err) {
      message.error('Failed to run retention cleanup');
    } finally {
      setCleaning(false);
    }
  };

  const auditColumns = [
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (act) => <Tag color={act.includes('LOGIN') ? 'blue' : 'gold'}>{act}</Tag>
    },
    {
      title: 'User',
      dataIndex: 'username',
      key: 'username',
      render: (u) => <strong style={{ color: '#00f2fe' }}>{u || 'System'}</strong>
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details'
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (ip) => <span className="mono" style={{ color: '#6b7280', fontSize: '11px' }}>{ip || '127.0.0.1'}</span>
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (t) => (t ? new Date(t).toLocaleString() : '-')
    }
  ];

  const storageUsed = health?.storage?.used_gb || 0;
  const storageTotal = health?.storage?.total_gb || 100;
  const storagePercent = Math.round((storageUsed / (storageTotal || 1)) * 100);

  return (
    <div>
      <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ color: '#f3f4f6', margin: 0 }}>System Health, AI Controls & Audit Logs</Title>
          <Text style={{ color: '#9ca3af', fontSize: '13px' }}>Model sensitivities, evidence retention policies, storage health & security trails</Text>
        </div>

        <Button icon={<RefreshCw size={14} />} onClick={fetchSystemData} style={{ background: '#162238', borderColor: '#1f2d47', color: '#f3f4f6' }}>
          Refresh Telemetry
        </Button>
      </div>

      {/* Row 1: Health KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} sm={8}>
          <Card size="small" bodyStyle={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text style={{ color: '#9ca3af', fontSize: '12px' }}>Database Engine</Text>
                <Title level={4} style={{ color: health?.database_connected ? '#10b981' : '#ef4444', margin: '4px 0 0' }}>
                  {health?.database_connected ? 'CONNECTED & HEALTHY' : 'DEGRADED'}
                </Title>
              </div>
              <Database size={28} color={health?.database_connected ? '#10b981' : '#ef4444'} />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card size="small" bodyStyle={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text style={{ color: '#9ca3af', fontSize: '12px' }}>Active AI Pipelines</Text>
                <Title level={4} style={{ color: '#00f2fe', margin: '4px 0 0' }}>
                  {health?.active_camera_threads || 0} Threads Online
                </Title>
              </div>
              <Cpu size={28} color="#00f2fe" />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card size="small" bodyStyle={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <Text style={{ color: '#9ca3af', fontSize: '12px' }}>Disk Storage Usage</Text>
                <div style={{ color: '#f3f4f6', fontWeight: 600, fontSize: '13px', marginTop: '2px' }}>
                  {storageUsed} GB / {storageTotal} GB
                </div>
                <Progress percent={storagePercent} size="small" status="active" strokeColor="#3b82f6" />
              </div>
              <HardDrive size={28} color="#3b82f6" style={{ marginLeft: '12px' }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 2: AI Sensitivity Parameters & Data Retention Form */}
      <Card title={<span><Settings size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> AI Pipeline & Evidence Retention Configuration</span>} size="small" style={{ marginBottom: '16px' }}>
        <Form form={form} layout="vertical" onFinish={handleSaveSettings} disabled={!isAdmin()}>
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Form.Item name="FACE_MATCH_THRESHOLD" label="Face Biometric Similarity Threshold (Cosine Match)">
                <Slider min={0.4} max={0.9} step={0.01} marks={{ 0.4: '0.40', 0.62: '0.62 (Def)', 0.85: '0.85' }} />
              </Form.Item>

              <Form.Item name="FACE_RECOGNITION_INTERVAL" label="Face Recognition Frequency (Every N Frames)">
                <InputNumber min={1} max={30} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="EVENT_COOLDOWN_SECONDS" label="Incident Alert Debounce Cooldown (Seconds)">
                <InputNumber min={2} max={120} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="GPU_ENABLED" label="Hardware GPU Acceleration (CUDA / TensorRT)" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="SNAPSHOT_RETENTION_DAYS" label="Snapshot Retention Period (Days)">
                <InputNumber min={1} max={365} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="CLIP_RETENTION_DAYS" label="Event Video Clip Retention (Days)">
                <InputNumber min={1} max={365} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="UNKNOWN_RETENTION_DAYS" label="Persistent Unknown Person Retention (Days)">
                <InputNumber min={1} max={180} style={{ width: '100%' }} />
              </Form.Item>

              <div style={{ marginTop: '18px', padding: '12px', background: '#162238', borderRadius: '6px', border: '1px solid #1f2d47' }}>
                <Text style={{ color: '#f3f4f6', display: 'block', marginBottom: '8px' }}>Manual Retention Purge</Text>
                <Button
                  danger
                  icon={<Trash2 size={13} />}
                  loading={cleaning}
                  onClick={handleManualCleanup}
                >
                  Purge Expired Storage Files Now
                </Button>
              </div>
            </Col>
          </Row>

          {isAdmin() && (
            <Button type="primary" htmlType="submit" size="large" loading={saving} style={{ background: '#3b82f6', marginTop: '10px' }}>
              Save AI & Retention Settings
            </Button>
          )}
        </Form>
      </Card>

      {/* Row 3: Security Audit Log Table */}
      <Card title={<span><History size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Security Access & Operations Audit Trail</span>} size="small">
        <Table
          dataSource={auditLogs}
          columns={auditColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default SettingsPage;
