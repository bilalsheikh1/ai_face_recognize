import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Select, Tag, Button, Space, Typography, Tooltip, Modal, Form, message } from 'antd';
import { AlertTriangle, Filter, Search, Eye, CheckCircle2, XCircle, RefreshCw, Video } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../services/api';

const { Title, Text } = Typography;

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cameras, setCameras] = useState([]);
  
  // Filters
  const [cameraFilter, setCameraFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const navigate = useNavigate();
  const { onOpenIncidentModal } = useOutletContext() || {};

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/events', {
        params: {
          camera_id: cameraFilter || undefined,
          event_type: typeFilter || undefined,
          status: statusFilter || undefined,
          limit: 100
        }
      });
      setEvents(res.data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/cameras').then((res) => setCameras(res.data.cameras || [])).catch(console.error);
    fetchEvents();
  }, [cameraFilter, typeFilter, statusFilter]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/events/${id}/status`, { status });
      message.success(`Status updated to ${status}`);
      fetchEvents();
    } catch (err) {
      message.error('Failed to update event status');
    }
  };

  const eventTypes = [
    'POSSIBLE_FIGHT',
    'FALL_DETECTED',
    'POSSIBLE_SNATCHING',
    'WEAPON_LIKE_OBJECT_DETECTED',
    'POSSIBLE_VANDALISM',
    'RESTRICTED_AREA_ENTRY',
    'POSSIBLE_LOITERING',
    'CROWD_THRESHOLD_EXCEEDED',
    'ABANDONED_OBJECT'
  ];

  const columns = [
    {
      title: 'Event ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id) => <span className="mono" style={{ color: '#9ca3af' }}>#{id}</span>
    },
    {
      title: 'Event Type',
      dataIndex: 'event_type',
      key: 'event_type',
      render: (type) => {
        let color = 'blue';
        if (type.includes('FIGHT') || type.includes('WEAPON')) color = 'red';
        else if (type.includes('FALL') || type.includes('SNATCH')) color = 'volcano';
        else if (type.includes('RESTRICTED') || type.includes('VANDAL')) color = 'orange';
        else if (type.includes('LOITER') || type.includes('CROWD')) color = 'gold';
        return <Tag color={color} style={{ fontWeight: 600 }}>{type.replace(/_/g, ' ')}</Tag>;
      }
    },
    {
      title: 'Camera',
      dataIndex: 'camera_id',
      key: 'camera_id',
      render: (cam) => <Tag color="cyan">{cam}</Tag>
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (conf) => (
        <span style={{ color: '#10b981', fontWeight: 600 }}>
          {Math.round(Number(conf) > 1 ? Number(conf) : Number(conf) * 100)}%
        </span>
      )
    },
    {
      title: 'Target Person',
      key: 'target',
      render: (_, record) => (
        record.person_name ? (
          <span>{record.person_name} <Tag color="blue" style={{ fontSize: '10px' }}>{record.employee_id}</Tag></span>
        ) : (
          <span style={{ color: '#f59e0b' }}>{record.unknown_id || 'Unknown'}</span>
        )
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'gold';
        if (status === 'CONFIRMED') color = 'green';
        if (status === 'FALSE_POSITIVE') color = 'default';
        if (status === 'DETECTED') color = 'volcano';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Timestamp',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d) => (d ? new Date(d).toLocaleString() : '-')
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Investigate Event Details & Video Clip">
            <Button
              size="small"
              type="primary"
              icon={<Eye size={13} />}
              onClick={() => navigate(`/events/${record.id}`)}
              style={{ background: '#2563eb' }}
            >
              Details
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <Title level={3} style={{ color: '#f3f4f6', margin: 0 }}>Behavioral & Safety Incident Ledger</Title>
          <Text style={{ color: '#9ca3af', fontSize: '13px' }}>AI-detected anomalies, security reviews, and forensic event verification</Text>
        </div>

        <Button icon={<RefreshCw size={14} />} onClick={fetchEvents} style={{ background: '#162238', borderColor: '#1f2d47', color: '#f3f4f6' }}>
          Refresh
        </Button>
      </div>

      <Card size="small" style={{ marginBottom: '16px' }}>
        <Space wrap>
          <Select
            placeholder="Filter by Camera"
            value={cameraFilter || undefined}
            onChange={(v) => setCameraFilter(v || '')}
            allowClear
            style={{ width: 160 }}
            options={cameras.map((c) => ({ label: `${c.camera_id} (${c.name})`, value: c.camera_id }))}
          />

          <Select
            placeholder="Filter by Event Type"
            value={typeFilter || undefined}
            onChange={(v) => setTypeFilter(v || '')}
            allowClear
            style={{ width: 220 }}
            options={eventTypes.map((t) => ({ label: t.replace(/_/g, ' '), value: t }))}
          />

          <Select
            placeholder="Filter by Status"
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v || '')}
            allowClear
            style={{ width: 160 }}
            options={[
              { label: 'DETECTED', value: 'DETECTED' },
              { label: 'SUSPECTED', value: 'SUSPECTED' },
              { label: 'REVIEWING', value: 'REVIEWING' },
              { label: 'CONFIRMED', value: 'CONFIRMED' },
              { label: 'FALSE_POSITIVE', value: 'FALSE_POSITIVE' },
            ]}
          />
        </Space>
      </Card>

      <Table
        dataSource={events}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 15 }}
      />
    </div>
  );
};

export default EventsPage;
