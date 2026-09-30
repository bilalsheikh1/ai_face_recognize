import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Space, Tag, Typography, message } from 'antd';
import {
  LayoutDashboard,
  Video,
  Users,
  UserX,
  AlertOctagon,
  Camera,
  BarChart3,
  Settings,
  LogOut,
  User,
  Shield,
  Clock
} from 'lucide-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LiveIncidentSidebar from '../components/LiveIncidentSidebar';
import SnapshotModal from '../components/SnapshotModal';
import api from '../services/api';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString());
  const [selectedIncident, setSelectedIncident] = useState(null);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toUTCString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUpdateIncidentStatus = async (id, status) => {
    try {
      await api.put(`/events/${id}/status`, { status });
      message.success(`Incident status updated to ${status}`);
      setSelectedIncident(null);
    } catch (err) {
      message.error('Failed to update event status');
    }
  };

  const menuItems = [
    { key: '/', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { key: '/live-cameras', icon: <Video size={16} />, label: 'Live Cameras' },
    { key: '/people', icon: <Users size={16} />, label: 'Employees / Staff' },
    { key: '/unknown-persons', icon: <UserX size={16} />, label: 'Unknown Persons' },
    { key: '/events', icon: <AlertOctagon size={16} />, label: 'Events & Incidents' },
    { key: '/cameras', icon: <Camera size={16} />, label: 'Cameras & Zones' },
    { key: '/reports', icon: <BarChart3 size={16} />, label: 'Reports & Analytics' },
    { key: '/settings', icon: <Settings size={16} />, label: 'System & Health' },
  ];

  const userMenuItems = {
    items: [
      {
        key: 'user-info',
        label: (
          <div style={{ padding: '4px 8px' }}>
            <strong>{user?.username}</strong>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{user?.email}</div>
          </div>
        ),
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogOut size={14} />,
        label: 'Logout',
        onClick: () => {
          logout();
          navigate('/login');
        },
      },
    ]
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#0b0f19' }}>
      {/* Top Command Center Header */}
      <Header style={{
        background: '#0e1524',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #1f2d47',
        height: '60px',
        zIndex: 10
      }}>
        <Space orientation="horizontal" size={12}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="live-badge-dot" />
            <Text strong style={{ color: '#00f2fe', fontSize: '16px', letterSpacing: '0.5px' }}>
              AI CCTV INTELLIGENCE
            </Text>
          </div>
          <Tag color="geekblue" style={{ fontSize: '11px', fontWeight: 600 }}>SURVEILLANCE CORE v2.4</Tag>
        </Space>

        <Space orientation="horizontal" size={20}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9ca3af', fontSize: '12px' }}>
            <Clock size={14} color="#00f2fe" />
            <span className="mono">{currentTime}</span>
          </div>

          <Dropdown menu={userMenuItems} placement="bottomRight">
            <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', background: '#162238' }}>
              <Avatar size="small" icon={<User size={14} />} style={{ background: '#3b82f6' }} />
              <span style={{ color: '#f3f4f6', fontSize: '13px', fontWeight: 500 }}>{user?.username || 'Operator'}</span>
              <Tag color="purple" style={{ fontSize: '10px', margin: 0 }}>{user?.role || 'Viewer'}</Tag>
            </Space>
          </Dropdown>
        </Space>
      </Header>

      <Layout>
        {/* Left Navigation Sider */}
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          width={220}
          style={{ background: '#0e1524', borderRight: '1px solid #1f2d47' }}
        >
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            onClick={({ key }) => navigate(key)}
            items={menuItems}
            style={{ background: 'transparent', borderRight: 0, marginTop: '8px' }}
          />
        </Sider>

        {/* Center Main Viewport */}
        <Content style={{ padding: '20px', background: '#0b0f19', overflowY: 'auto', minHeight: 'calc(100vh - 60px)' }}>
          <Outlet context={{ onOpenIncidentModal: (inc) => setSelectedIncident(inc) }} />
        </Content>

        {/* Right Sticky Live Incidents Feed */}
        <LiveIncidentSidebar onViewEvent={(inc) => setSelectedIncident(inc)} />
      </Layout>

      {/* Global Quick Incident Review Modal */}
      <SnapshotModal
        visible={!!selectedIncident}
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onUpdateStatus={handleUpdateIncidentStatus}
      />
    </Layout>
  );
};

export default MainLayout;
