import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Button, Typography, Space, Table, Tag, Statistic } from 'antd';
import { Download, BarChart3, TrendingUp, PieChart, Calendar, FileSpreadsheet } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import api from '../services/api';

const { Title, Text } = Typography;

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#00f2fe'];

const ReportsPage = () => {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/analytics?days=${days}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const handleDownloadCsv = (type) => {
    window.open(`/api/reports/export-csv?type=${type}`, '_blank');
  };

  return (
    <div>
      <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <Title level={3} style={{ color: '#f3f4f6', margin: 0 }}>Surveillance Analytics & Intelligence Reports</Title>
          <Text style={{ color: '#9ca3af', fontSize: '13px' }}>Aggregated passage metrics, incident distributions, and forensic audit exports</Text>
        </div>

        <Space wrap>
          <Select value={days} onChange={setDays} style={{ width: 140 }}>
            <Select.Option value={7}>Last 7 Days</Select.Option>
            <Select.Option value={14}>Last 14 Days</Select.Option>
            <Select.Option value={30}>Last 30 Days</Select.Option>
          </Select>

          <Button
            type="primary"
            icon={<Download size={14} />}
            onClick={() => handleDownloadCsv('events')}
            style={{ background: '#2563eb' }}
          >
            Export Events CSV
          </Button>

          <Button
            icon={<FileSpreadsheet size={14} />}
            onClick={() => handleDownloadCsv('passes')}
            style={{ background: '#162238', borderColor: '#1f2d47', color: '#f3f4f6' }}
          >
            Export Passes CSV
          </Button>
        </Space>
      </div>

      {/* Row 1: Traffic Trends & Known/Unknown Proportion */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} lg={16}>
          <Card title="Daily Passage Trends (Entries vs Exits)" size="small">
            <div style={{ height: '280px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.daily_traffic || []}>
                  <defs>
                    <linearGradient id="colorEnt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2d47" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#162032', borderColor: '#1f2d47', borderRadius: '6px', color: '#fff' }} />
                  <Legend />
                  <Area type="monotone" dataKey="entries" stroke="#10b981" fillOpacity={1} fill="url(#colorEnt)" name="Entries" />
                  <Area type="monotone" dataKey="exits" stroke="#f59e0b" fillOpacity={1} fill="url(#colorExt)" name="Exits" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Staff vs Unknown Visitors" size="small">
            <div style={{ height: '280px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={data?.known_vs_unknown || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(data?.known_vs_unknown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#162032', borderColor: '#1f2d47', borderRadius: '6px', color: '#fff' }} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 2: Camera Traffic Volume & Incident Breakdown */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Passage Volume by Camera Node" size="small">
            <div style={{ height: '260px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.camera_traffic || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2d47" />
                  <XAxis dataKey="camera_id" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#162032', borderColor: '#1f2d47', borderRadius: '6px', color: '#fff' }} />
                  <Bar dataKey="total_events" fill="#00f2fe" name="Total Events Recorded" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Security Incidents by Type" size="small">
            <div style={{ height: '260px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.incident_types || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2d47" />
                  <XAxis type="number" stroke="#6b7280" fontSize={11} />
                  <YAxis type="category" dataKey="event_type" stroke="#6b7280" fontSize={10} width={130} />
                  <Tooltip contentStyle={{ background: '#162032', borderColor: '#1f2d47', borderRadius: '6px', color: '#fff' }} />
                  <Bar dataKey="count" fill="#ef4444" name="Incidents" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReportsPage;
