import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Tag, Space, Modal, Form, Typography, Avatar, Tooltip, message } from 'antd';
import { UserX, UserCheck, Search, Eye, MapPin, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const UnknownPersonsPage = () => {
  const [unknowns, setUnknowns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [promoteModal, setPromoteModal] = useState(null); // unknown object
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const { isOperator } = useAuth();
  const navigate = useNavigate();

  const fetchUnknowns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/unknown');
      setUnknowns(res.data.unknown_persons || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnknowns();
  }, []);

  const handlePromote = async (values) => {
    if (!promoteModal) return;
    setSubmitting(true);
    try {
      await api.post(`/unknown/${promoteModal.unknown_id}/promote`, {
        employee_id: values.employee_id,
        full_name: values.full_name,
        department: values.department,
        notes: values.notes
      });
      message.success(`Successfully promoted ${promoteModal.unknown_id} to ${values.full_name}`);
      setPromoteModal(null);
      form.resetFields();
      fetchUnknowns();
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to promote unknown person');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Unknown ID',
      dataIndex: 'unknown_id',
      key: 'unknown_id',
      render: (id) => <strong style={{ color: '#f59e0b', fontSize: '14px' }}>{id}</strong>
    },
    {
      title: 'Appearances',
      dataIndex: 'appearance_count',
      key: 'appearance_count',
      sorter: (a, b) => a.appearance_count - b.appearance_count,
      render: (count) => <Tag color="gold">{count} times observed</Tag>
    },
    {
      title: 'Cameras Observed',
      dataIndex: 'cameras',
      key: 'cameras',
      render: (cams) => (
        <Space wrap>
          {(cams || []).map((c) => (
            <Tag color="purple" key={c}>{c}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'First Seen',
      dataIndex: 'first_seen',
      key: 'first_seen',
      render: (d) => (d ? new Date(d).toLocaleString() : '-')
    },
    {
      title: 'Last Seen',
      dataIndex: 'last_seen',
      key: 'last_seen',
      render: (d) => (d ? new Date(d).toLocaleString() : '-')
    },
    {
      title: 'Recorded Events',
      dataIndex: 'incidents_count',
      key: 'incidents_count',
      render: (count) => (
        <Tag color={count > 0 ? 'red' : 'default'}>
          {count > 0 ? `${count} Incidents` : 'Clean'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {isOperator() && (
            <Button
              size="small"
              type="primary"
              icon={<UserCheck size={13} />}
              onClick={() => {
                setPromoteModal(record);
                form.setFieldsValue({ notes: `Promoted from ${record.unknown_id}` });
              }}
              style={{ background: '#10b981', borderColor: '#10b981' }}
            >
              Promote to Staff
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ color: '#f3f4f6', margin: 0 }}>Persistent Unknown Person Intelligence</Title>
          <Text style={{ color: '#9ca3af', fontSize: '13px' }}>Cross-camera trajectory association, temporal appearances & visitor identification</Text>
        </div>
      </div>

      <Table
        dataSource={unknowns}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Promotion Modal */}
      <Modal
        title={<span><UserCheck size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Promote {promoteModal?.unknown_id} to Registered Employee</span>}
        open={!!promoteModal}
        onCancel={() => setPromoteModal(null)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handlePromote}>
          <Form.Item name="employee_id" label="Assign Employee ID" rules={[{ required: true }]}>
            <Input placeholder="e.g. EMP-105" />
          </Form.Item>
          <Form.Item name="full_name" label="Full Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Alex Morgan" />
          </Form.Item>
          <Form.Item name="department" label="Department" initialValue="General Staff">
            <Input placeholder="Department" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large" loading={submitting} style={{ background: '#10b981', borderColor: '#10b981' }}>
            Confirm Promotion & Link Embeddings
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default UnknownPersonsPage;
