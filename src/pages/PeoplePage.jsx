import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, Tag, Space, Modal, Form, Typography, Avatar, Upload, message, Tooltip } from 'antd';
import { Users, UserPlus, Search, Eye, Edit, Trash2, Camera, UploadCloud, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const PeoplePage = () => {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  
  // Registration Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [uploadedImages, setUploadedImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const { isOperator, isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchPeople = async () => {
    setLoading(true);
    try {
      const res = await api.get('/people', {
        params: { search, department: departmentFilter }
      });
      setPeople(res.data.people || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, [search, departmentFilter]);

  const handleRegister = async (values) => {
    setSubmitting(true);
    try {
      await api.post('/people', {
        employee_id: values.employee_id,
        full_name: values.full_name,
        department: values.department,
        notes: values.notes,
        images: uploadedImages
      });
      message.success('Employee registered and face embeddings generated');
      setModalVisible(false);
      form.resetFields();
      setUploadedImages([]);
      fetchPeople();
    } catch (err) {
      message.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImages((prev) => [...prev, reader.result]);
    };
    reader.readAsDataURL(file);
    return false; // Prevent default upload
  };

  const handleDelete = async (id, name) => {
    Modal.confirm({
      title: `Delete employee '${name}'?`,
      content: 'This will remove registered biometric face embeddings and historical records.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await api.delete(`/people/${id}`);
          message.success('Employee deleted');
          fetchPeople();
        } catch (err) {
          message.error('Failed to delete employee');
        }
      }
    });
  };

  const columns = [
    {
      title: 'Profile',
      dataIndex: 'profile_photo',
      key: 'profile_photo',
      width: 70,
      render: (photo, record) => (
        <Avatar
          src={photo}
          size={44}
          style={{ background: '#2563eb', border: '1px solid #1f2d47' }}
        >
          {record.full_name[0]}
        </Avatar>
      )
    },
    {
      title: 'Employee ID',
      dataIndex: 'employee_id',
      key: 'employee_id',
      render: (id) => <strong style={{ color: '#00f2fe' }}>{id}</strong>
    },
    {
      title: 'Full Name',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (name) => <span style={{ fontWeight: 600, color: '#f3f4f6' }}>{name}</span>
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept) => <Tag color="blue">{dept}</Tag>
    },
    {
      title: 'Biometrics',
      dataIndex: 'embeddings_count',
      key: 'embeddings_count',
      render: (count) => (
        <Tag color={count > 0 ? 'green' : 'orange'}>
          {count > 0 ? `${count} Embeddings Active` : 'No Faces'}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'active_status',
      key: 'active_status',
      render: (active) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      )
    },
    {
      title: 'Registered On',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => (date ? new Date(date).toLocaleDateString() : '-')
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Complete Activity Timeline">
            <Button
              size="small"
              type="primary"
              icon={<Eye size={13} />}
              onClick={() => navigate(`/people/${record.id}`)}
              style={{ background: '#3b82f6' }}
            />
          </Tooltip>
          {isAdmin() && (
            <Tooltip title="Delete Employee">
              <Button
                size="small"
                danger
                icon={<Trash2 size={13} />}
                onClick={() => handleDelete(record.id, record.full_name)}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <Title level={3} style={{ color: '#f3f4f6', margin: 0 }}>Registered Personnel & Staff Directory</Title>
          <Text style={{ color: '#9ca3af', fontSize: '13px' }}>Manage employee registrations, multi-angle face embeddings & biometrics</Text>
        </div>

        {isOperator() && (
          <Button
            type="primary"
            icon={<UserPlus size={15} />}
            onClick={() => setModalVisible(true)}
            style={{ background: '#10b981', borderColor: '#10b981' }}
          >
            Register Employee
          </Button>
        )}
      </div>

      <Card size="small" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Input
            placeholder="Search by name or employee ID..."
            prefix={<Search size={14} color="#6b7280" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '280px', background: '#162238', borderColor: '#1f2d47', color: '#fff' }}
          />
          <Select
            placeholder="Filter by Department"
            value={departmentFilter || undefined}
            onChange={(val) => setDepartmentFilter(val || '')}
            allowClear
            style={{ width: '200px' }}
            options={[
              { label: 'All Departments', value: '' },
              { label: 'AI Research & Engineering', value: 'AI Research & Engineering' },
              { label: 'Operations & Security', value: 'Operations & Security' },
              { label: 'Facility Infrastructure', value: 'Facility Infrastructure' },
              { label: 'General Staff', value: 'General Staff' },
            ]}
          />
        </div>
      </Card>

      <Table
        dataSource={people}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Registration Modal with Multi-Angle Face Biometric Upload */}
      <Modal
        title={<span><UserPlus size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Register New Employee Face Biometrics</span>}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setUploadedImages([]); }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleRegister}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Form.Item name="employee_id" label="Employee ID" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="e.g. EMP-104" />
            </Form.Item>
            <Form.Item name="full_name" label="Full Name" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="e.g. John Doe" />
            </Form.Item>
          </div>

          <Form.Item name="department" label="Department" initialValue="General Staff">
            <Select>
              <Select.Option value="AI Research & Engineering">AI Research & Engineering</Select.Option>
              <Select.Option value="Operations & Security">Operations & Security</Select.Option>
              <Select.Option value="Facility Infrastructure">Facility Infrastructure</Select.Option>
              <Select.Option value="Executive Staff">Executive Staff</Select.Option>
              <Select.Option value="General Staff">General Staff</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Face Portrait Photos (Upload Frontal & Angle Images for Embeddings)">
            <Upload.Dragger
              multiple
              beforeUpload={handleImageUpload}
              showUploadList={false}
              style={{ background: '#162238', borderColor: '#1f2d47', padding: '16px 0' }}
            >
              <p className="ant-upload-drag-icon">
                <UploadCloud size={32} color="#00f2fe" style={{ margin: '0 auto' }} />
              </p>
              <p style={{ color: '#f3f4f6', fontWeight: 500 }}>Click or drag face portraits here</p>
              <p style={{ color: '#9ca3af', fontSize: '12px' }}>Supports multiple angles (Front, Left, Right) to build robust embeddings</p>
            </Upload.Dragger>

            {/* Thumbnail Preview */}
            {uploadedImages.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                {uploadedImages.map((img, i) => (
                  <div key={i} style={{ width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #00f2fe' }}>
                    <img src={img} alt={`Upload ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
                <Tag color="green" style={{ alignSelf: 'center', marginLeft: '6px' }}>
                  {uploadedImages.length} Image(s) Attached
                </Tag>
              </div>
            )}
          </Form.Item>

          <Form.Item name="notes" label="Notes / Access Clearance">
            <Input.TextArea rows={2} placeholder="Optional notes regarding clearance or work schedule..." />
          </Form.Item>

          <Button type="primary" htmlType="submit" size="large" block loading={submitting} style={{ background: '#10b981', borderColor: '#10b981' }}>
            Generate Biometric Embeddings & Save
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default PeoplePage;
