import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Space } from 'antd';
import { Shield, Lock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      await login(values.username, values.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #111e38 0%, #070a12 100%)',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#0e1524',
          border: '1px solid #1f2d47',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            padding: '12px',
            background: 'rgba(0, 242, 254, 0.1)',
            borderRadius: '12px',
            color: '#00f2fe',
            marginBottom: '12px'
          }}>
            <Shield size={32} />
          </div>
          <Title level={3} style={{ color: '#f3f4f6', margin: 0 }}>AI CCTV SURVEILLANCE</Title>
          <Text style={{ color: '#9ca3af', fontSize: '13px' }}>Security Command & Intelligence System</Text>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginBottom: '20px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444' }}
          />
        )}

        <Form layout="vertical" onFinish={onFinish} initialValues={{ username: 'admin', password: 'admin123' }}>
          <Form.Item
            label={<span style={{ color: '#e5e7eb' }}>Username or Email</span>}
            name="username"
            rules={[{ required: true, message: 'Please input username' }]}
          >
            <Input
              prefix={<User size={15} color="#6b7280" />}
              placeholder="e.g. admin"
              size="large"
              style={{ background: '#162238', borderColor: '#1f2d47', color: '#fff' }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ color: '#e5e7eb' }}>Password</span>}
            name="password"
            rules={[{ required: true, message: 'Please input password' }]}
          >
            <Input.Password
              prefix={<Lock size={15} color="#6b7280" />}
              placeholder="••••••••"
              size="large"
              style={{ background: '#162238', borderColor: '#1f2d47', color: '#fff' }}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            style={{
              background: 'linear-gradient(90deg, #00c6ff 0%, #0072ff 100%)',
              borderColor: 'transparent',
              fontWeight: 600,
              marginTop: '10px'
            }}
          >
            ACCESS SURVEILLANCE SYSTEM
          </Button>

          <div style={{ marginTop: '20px', padding: '10px', background: '#162238', borderRadius: '6px', fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
            <span>Default demo credentials: <strong>admin</strong> / <strong>admin123</strong></span>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
