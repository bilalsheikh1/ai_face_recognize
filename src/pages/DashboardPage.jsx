import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography, Button, Space, Badge } from 'antd';
import {
  Users,
  UserCheck,
  UserX,
  Video,
  LogIn,
  LogOut,
  AlertTriangle,
  Activity,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../services/api';
import socketService from '../services/socket';
import CameraPlayerCard from '../components/CameraPlayerCard';

const { Title, Text } = Typography;

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { onOpenIncidentModal } = useOutletContext() || {};

  const fetchDashboardData = async () => {
    try {
      const [statsRes, camsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/cameras')
      ]);
      setStats(statsRes.data);
      setCameras(camsRes.data.cameras || []);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen to real-time events to update counts
    const handlePass = (pass) => {
      setStats((prev) => {
        if (!prev) return prev;
        const isEntry = pass.direction === 'ENTRY';
        return {
          ...prev,
          kpis: {
            ...prev.kpis,
            today_entries: isEntry ? prev.kpis.today_entries + 1 : prev.kpis.today_entries,
            today_exits: !isEntry ? prev.kpis.today_exits + 1 : prev.kpis.today_exits
          },
          recent_passes: [pass, ...prev.recent_passes.slice(0, 9)]
        };
      });
    };

    const handleIncident = (inc) => {
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          kpis: {
            ...prev.kpis,
            today_incidents: prev.kpis.today_incidents + 1
          },
          recent_incidents: [inc, ...prev.recent_incidents.slice(0, 9)]
        };
      });
    };

    socketService.on('pass_detected', handlePass);
    socketService.on('incident_created', handleIncident);

    return () => {
      socketService.off('pass_detected', handlePass);
      socketService.off('incident_created', handleIncident);
    };
  }, []);

  const kpis = stats?.kpis || {
    total_people: 0,
    total_known: 0,
    total_unknown: 0,
    active_cameras: 0,
    total_cameras: 0,
    today_entries: 0,
    today_exits: 0,
    today_incidents: 0,
    live_people_count: 0
  };

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ color: '#f3f4f6', margin: 0 }}>Surveillance Operations Command Center</Title>
          <Text style={{ color: '#9ca3af', fontSize: '13px' }}>Real-time spatial tracking, biometric identification & behavioral analysis</Text>
        </div>
        <Space>
          <Button icon={<Activity size={15} />} onClick={fetchDashboardData} style={{ background: '#162238', borderColor: '#1f2d47', color: '#f3f4f6' }}>
            Sync Dashboard
          </Button>
          <Button type="primary" icon={<Video size={15} />} onClick={() => navigate('/live-cameras')}>
            Live Multi-Grid
          </Button>
        </Space>
      </div>

      {/* Top KPI Metric Cards */}
      <Row gutter={[14, 14]} style={{ marginBottom: '20px' }}>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic
              title={<span style={{ color: '#9ca3af', fontSize: '12px' }}>Total People</span>}
              value={kpis.total_people}
              prefix={<Users size={16} color="#00f2fe" style={{ marginRight: '6px' }} />}
              valueStyle={{ color: '#00f2fe', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic
              title={<span style={{ color: '#9ca3af', fontSize: '12px' }}>Known Staff</span>}
              value={kpis.total_known}
              prefix={<UserCheck size={16} color="#10b981" style={{ marginRight: '6px' }} />}
              valueStyle={{ color: '#10b981', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic
              title={<span style={{ color: '#9ca3af', fontSize: '12px' }}>Unknown Visitors</span>}
              value={kpis.total_unknown}
              prefix={<UserX size={16} color="#f59e0b" style={{ marginRight: '6px' }} />}
              valueStyle={{ color: '#f59e0b', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic
              title={<span style={{ color: '#9ca3af', fontSize: '12px' }}>Active Cameras</span>}
              value={`${kpis.active_cameras}/${kpis.total_cameras}`}
              prefix={<Video size={16} color="#3b82f6" style={{ marginRight: '6px' }} />}
              valueStyle={{ color: '#3b82f6', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic
              title={<span style={{ color: '#9ca3af', fontSize: '12px' }}>Today Entries</span>}
              value={kpis.today_entries}
              prefix={<LogIn size={16} color="#10b981" style={{ marginRight: '6px' }} />}
              valueStyle={{ color: '#10b981', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic
              title={<span style={{ color: '#9ca3af', fontSize: '12px' }}>Today Exits</span>}
              value={kpis.today_exits}
              prefix={<LogOut size={16} color="#f97316" style={{ marginRight: '6px' }} />}
              valueStyle={{ color: '#f97316', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic
              title={<span style={{ color: '#9ca3af', fontSize: '12px' }}>Today Incidents</span>}
              value={kpis.today_incidents}
              prefix={<AlertTriangle size={16} color="#ef4444" style={{ marginRight: '6px' }} />}
              valueStyle={{ color: '#ef4444', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic
              title={<span style={{ color: '#9ca3af', fontSize: '12px' }}>Live On Camera</span>}
              value={kpis.live_people_count}
              prefix={<Activity size={16} color="#8b5cf6" style={{ marginRight: '6px' }} />}
              valueStyle={{ color: '#8b5cf6', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* CCTV Live Video Grid Preview */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <Text strong style={{ color: '#f3f4f6', fontSize: '15px' }}>Live Camera Feeds</Text>
          <Button type="link" onClick={() => navigate('/live-cameras')} style={{ color: '#00f2fe', padding: 0 }}>
            View Full Matrix <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
          </Button>
        </div>
        <Row gutter={[14, 14]}>
          {cameras.slice(0, 4).map((cam) => (
            <Col xs={24} md={12} key={cam.id}>
              <CameraPlayerCard camera={cam} />
            </Col>
          ))}
        </Row>
      </div>

      {/* Hourly Traffic Flow Graph & Incident Overview */}
      <Row gutter={[14, 14]}>
        <Col xs={24} lg={14}>
          <Card title="Today's Passage & Traffic Flow (Hourly)" size="small">
            <div style={{ height: '260px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.hourly_traffic || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2d47" />
                  <XAxis dataKey="hour" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#162032', borderColor: '#1f2d47', borderRadius: '6px', color: '#fff' }} />
                  <Area type="monotone" dataKey="entries" stroke="#10b981" fillOpacity={1} fill="url(#colorEntries)" name="Entries" />
                  <Area type="monotone" dataKey="exits" stroke="#f97316" fillOpacity={1} fill="url(#colorExits)" name="Exits" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Recent Line Pass Events" size="small" extra={<Button type="link" size="small" onClick={() => navigate('/events')}>View All</Button>}>
            <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
              {(stats?.recent_passes || []).map((p) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1f2d47' }}>
                  <Space>
                    <Tag color={p.direction === 'ENTRY' ? 'green' : 'orange'}>{p.direction}</Tag>
                    <span style={{ color: '#f3f4f6', fontSize: '13px', fontWeight: 500 }}>
                      {p.person_name || p.unknown_id || 'Unknown'}
                    </span>
                  </Space>
                  <Space orientation="horizontal" size={8}>
                    <span style={{ color: '#38bdf8', fontSize: '11px' }}>{p.camera_id}</span>
                    <span style={{ color: '#6b7280', fontSize: '11px' }}>
                      {p.timestamp ? new Date(p.timestamp).toLocaleTimeString() : ''}
                    </span>
                  </Space>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
