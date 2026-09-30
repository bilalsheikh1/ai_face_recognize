import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, Tag, Space, Modal, Form, Typography, Switch, InputNumber, message, Tooltip, Upload } from 'antd';
import { Camera, Plus, Edit, Trash2, Video, RefreshCw, Layers, CheckCircle2, XCircle, Activity, UploadCloud } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ZoneEditorModal from '../components/ZoneEditorModal';

const { Title, Text } = Typography;

const CamerasPage = () => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [selectedZoneCam, setSelectedZoneCam] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [form] = Form.useForm();
  const currentStreamType = Form.useWatch('stream_type', form);

  const { isAdmin, isOperator } = useAuth();

  const fetchCameras = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cameras');
      setCameras(res.data.cameras || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  const handleOpenCreate = () => {
    setEditingCamera(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleOpenEdit = (record) => {
    setEditingCamera(record);
    form.setFieldsValue({
      camera_id: record.camera_id,
      name: record.name,
      rtsp_url: record.rtsp_url,
      stream_type: record.stream_type,
      location: record.location,
      fps: record.fps,
      resolution: record.resolution
    });
    setModalVisible(true);
  };

  const handleSaveCamera = async (values) => {
    try {
      if (editingCamera) {
        await api.put(`/cameras/${editingCamera.id}`, values);
        message.success(`Camera ${editingCamera.camera_id} updated`);
      } else {
        await api.post('/cameras', values);
        message.success(`Camera ${values.camera_id} added`);
      }
      setModalVisible(false);
      form.resetFields();
      fetchCameras();
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to save camera');
    }
  };

  const handleToggleEnable = async (record) => {
    try {
      const res = await api.post(`/cameras/${record.id}/toggle`);
      message.success(res.data.message);
      fetchCameras();
    } catch (err) {
      message.error('Failed to toggle camera state');
    }
  };

  const handleTestConnection = async () => {
    const url = form.getFieldValue('rtsp_url');
    const type = form.getFieldValue('stream_type');
    setTestingConnection(true);
    try {
      const res = await api.post('/cameras/test-connection', { rtsp_url: url, stream_type: type });
      if (res.data.success) {
        message.success(`Connection verified! ${res.data.message}`);
      } else {
        message.error(res.data.error || 'Connection failed');
      }
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to connect');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleUploadVideo = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploadingVideo(true);
    try {
      const res = await api.post(`${import.meta.env.VITE_API_URL}/api/cameras/upload-video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        form.setFieldsValue({
          rtsp_url: res.data.file_path,
          resolution: res.data.resolution || '1280x720'
        });
        message.success(`Video uploaded successfully (${res.data.filename})`);
      } else {
        message.error(res.data.error || 'Failed to upload video');
      }
    } catch (err) {
      message.error(err.response?.data?.error || 'Video upload failed');
    } finally {
      setUploadingVideo(false);
    }
    return false; // Prevent default upload behavior
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: `Delete Camera '${record.camera_id}'?`,
      content: 'This will stop stream processing and remove associated zones & virtual lines.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await api.delete(`/cameras/${record.id}`);
          message.success('Camera deleted');
          fetchCameras();
        } catch (err) {
          message.error('Failed to delete camera');
        }
      }
    });
  };

  const columns = [
    {
      title: 'Status',
      dataIndex: 'is_online',
      key: 'is_online',
      width: 90,
      render: (online, record) => (
        <Space>
          <span className="live-badge-dot" style={{ backgroundColor: record.is_enabled && online ? '#10b981' : '#ef4444' }} />
          <span style={{ fontSize: '11px', color: record.is_enabled && online ? '#10b981' : '#ef4444' }}>
            {record.is_enabled ? (online ? 'ONLINE' : 'OFFLINE') : 'DISABLED'}
          </span>
        </Space>
      )
    },
    {
      title: 'Camera ID',
      dataIndex: 'camera_id',
      key: 'camera_id',
      render: (id) => <strong style={{ color: '#00f2fe' }}>{id}</strong>
    },
    {
      title: 'Camera Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <span style={{ fontWeight: 600, color: '#f3f4f6' }}>{name}</span>
    },
    {
      title: 'Stream Type',
      dataIndex: 'stream_type',
      key: 'stream_type',
      render: (type) => <Tag color="blue">{type.toUpperCase()}</Tag>
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location'
    },
    {
      title: 'Parameters',
      key: 'params',
      render: (_, r) => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{r.resolution} @ {r.fps}fps</span>
    },
    {
      title: 'Zones / Lines',
      key: 'zones_lines',
      render: (_, r) => (
        <Space>
          <Tag color="gold">{r.zones_count || 0} Zones</Tag>
          <Tag color="cyan">{r.lines_count || 0} Tripwires</Tag>
        </Space>
      )
    },
    {
      title: 'Enabled',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      render: (enabled, record) => (
        <Switch
          checked={enabled}
          onChange={() => handleToggleEnable(record)}
          disabled={!isOperator()}
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Configure Polygon Zones & Virtual Lines">
            <Button
              size="small"
              icon={<Layers size={13} />}
              onClick={() => setSelectedZoneCam(record)}
              style={{ background: '#162238', borderColor: '#1f2d47', color: '#00f2fe' }}
            />
          </Tooltip>
          {isOperator() && (
            <Tooltip title="Edit Camera Settings">
              <Button
                size="small"
                icon={<Edit size={13} />}
                onClick={() => handleOpenEdit(record)}
              />
            </Tooltip>
          )}
          {isAdmin() && (
            <Tooltip title="Delete Camera">
              <Button
                size="small"
                danger
                icon={<Trash2 size={13} />}
                onClick={() => handleDelete(record)}
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
          <Title level={3} style={{ color: '#f3f4f6', margin: 0 }}>CCTV Camera Network & Sensor Management</Title>
          <Text style={{ color: '#9ca3af', fontSize: '13px' }}>Configure RTSP endpoints, webcam devices, resolution, polygon zones, and tripwires</Text>
        </div>

        {isOperator() && (
          <Button
            type="primary"
            icon={<Plus size={15} />}
            onClick={handleOpenCreate}
            style={{ background: '#3b82f6' }}
          >
            Add CCTV Camera
          </Button>
        )}
      </div>

      <Table
        dataSource={cameras}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Add / Edit Camera Modal */}
      <Modal
        title={<span><Video size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> {editingCamera ? `Edit Camera: ${editingCamera.camera_id}` : 'Add New CCTV Camera'}</span>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSaveCamera} initialValues={{ stream_type: 'synthetic', fps: 15, resolution: '1280x720' }}>
          <Form.Item name="camera_id" label="Camera ID" rules={[{ required: true }]}>
            <Input placeholder="e.g. CAM-05" disabled={!!editingCamera} />
          </Form.Item>

          <Form.Item name="name" label="Camera Name / Label" rules={[{ required: true }]}>
            <Input placeholder="e.g. East Perimeter Corridor" />
          </Form.Item>

          <Form.Item name="stream_type" label="Stream Input Source" rules={[{ required: true }]}>
            <Select onChange={(val) => {
              const currentUrl = form.getFieldValue('rtsp_url');
              if (val === 'webcam' && (!currentUrl || currentUrl === 'synthetic')) {
                form.setFieldsValue({ rtsp_url: '0' });
              } else if (val === 'synthetic' && (!currentUrl || currentUrl === '0')) {
                form.setFieldsValue({ rtsp_url: 'synthetic' });
              }
            }}>
              <Select.Option value="synthetic">Synthetic AI Simulation Stream (No physical camera needed)</Select.Option>
              <Select.Option value="rtsp">RTSP Stream (rtsp://user:pass@ip:port/h264)</Select.Option>
              <Select.Option value="webcam">Local USB / Integrated Webcam (Index 0, 1)</Select.Option>
              <Select.Option value="file">Video File / Offline CCTV Footage (MP4, AVI, MKV)</Select.Option>
            </Select>
          </Form.Item>

          {currentStreamType === 'file' && (
            <div style={{ marginBottom: '16px', background: '#1f2937', padding: '12px', borderRadius: '8px', border: '1px dashed #4b5563' }}>
              <Text style={{ color: '#9ca3af', display: 'block', marginBottom: '8px', fontSize: '13px' }}>
                Upload an MP4, AVI, or MKV video file directly from your computer (e.g. CCTV recorded clips, WhatsApp videos, test footage):
              </Text>
              <Upload
                beforeUpload={handleUploadVideo}
                showUploadList={false}
                accept=".mp4,.avi,.mov,.mkv,.webm"
              >
                <Button icon={<UploadCloud size={15} />} loading={uploadingVideo} style={{ background: '#374151', color: '#f3f4f6', borderColor: '#4b5563' }}>
                  {uploadingVideo ? 'Uploading Video...' : 'Select & Upload Video File'}
                </Button>
              </Upload>
            </div>
          )}

          <Form.Item name="rtsp_url" label="RTSP URL / Webcam Index / File Path" tooltip="For Webcam use 0 for default device. For synthetic leave as synthetic. For Video files provide local path or upload above.">
            <Input placeholder={currentStreamType === 'file' ? 'storage/uploads/video.mp4 or /path/to/video.mp4' : 'e.g. 0 (webcam), synthetic, or rtsp://...'} />
          </Form.Item>

          <Button
            type="dashed"
            htmlType="button"
            block
            loading={testingConnection}
            onClick={handleTestConnection}
            style={{ marginBottom: '16px' }}
          >
            Test Connection & Stream Readability
          </Button>

          <Form.Item name="location" label="Physical Location">
            <Input placeholder="e.g. Building C - Level 1" />
          </Form.Item>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Form.Item name="fps" label="Target FPS" style={{ flex: 1 }}>
              <InputNumber min={5} max={30} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="resolution" label="Resolution" style={{ flex: 1 }}>
              <Select>
                <Select.Option value="1920x1080">1920x1080 (1080p)</Select.Option>
                <Select.Option value="1280x720">1280x720 (720p)</Select.Option>
                <Select.Option value="640x480">640x480 (VGA)</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Button type="primary" htmlType="submit" block size="large" style={{ background: '#3b82f6' }}>
            {editingCamera ? 'Update Camera Configuration' : 'Save & Initialize Pipeline'}
          </Button>
        </Form>
      </Modal>

      {/* Zone Editor Modal */}
      {selectedZoneCam && (
        <ZoneEditorModal
          visible={!!selectedZoneCam}
          camera={selectedZoneCam}
          onClose={() => setSelectedZoneCam(null)}
          onRefresh={fetchCameras}
        />
      )}
    </div>
  );
};

export default CamerasPage;
