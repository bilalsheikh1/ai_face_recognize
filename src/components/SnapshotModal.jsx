import React from 'react';
import { Modal, Tag, Button, Space, Typography, Descriptions } from 'antd';
import { ShieldAlert, Play, UserCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const { Text, Title } = Typography;

const SnapshotModal = ({ visible, incident, onClose, onUpdateStatus }) => {
  const navigate = useNavigate();
  if (!incident) return null;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={780}
      title={
        <Space>
          <ShieldAlert size={18} color="#ef4444" />
          <span>Incident Evidence Review: {incident.event_type?.replace(/_/g, ' ')}</span>
        </Space>
      }
      footer={[
        <Button key="close" onClick={onClose}>Close</Button>,
        <Button
          key="play"
          type="primary"
          icon={<Play size={14} />}
          style={{ background: '#3b82f6' }}
          onClick={() => {
            onClose();
            navigate(`/events/${incident.id}`);
          }}
        >
          Investigate & Play Clip
        </Button>,
        <Button
          key="confirm"
          type="primary"
          icon={<CheckCircle2 size={14} />}
          style={{ background: '#10b981', borderColor: '#10b981' }}
          onClick={() => onUpdateStatus && onUpdateStatus(incident.id, 'CONFIRMED')}
        >
          Confirm Event
        </Button>,
        <Button
          key="false"
          danger
          icon={<XCircle size={14} />}
          onClick={() => onUpdateStatus && onUpdateStatus(incident.id, 'FALSE_POSITIVE')}
        >
          False Positive
        </Button>
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {incident.snapshot_path ? (
          <div style={{ width: '100%', height: '360px', background: '#000', borderRadius: '6px', overflow: 'hidden' }}>
            <img
              src={incident.snapshot_path}
              alt="Snapshot"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        ) : (
          <div style={{ height: '180px', background: '#0e1524', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', color: '#6b7280' }}>
            No Snapshot Available
          </div>
        )}

        <Descriptions bordered size="small" column={2} style={{ background: '#162238' }}>
          <Descriptions.Item label="Event Type">
            <Tag color="red">{incident.event_type?.replace(/_/g, ' ')}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Confidence">
            <span style={{ color: '#10b981', fontWeight: 600 }}>
              {Math.round(Number(incident.confidence) > 1 ? Number(incident.confidence) : Number(incident.confidence) * 100)}%
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Camera ID">
            <span style={{ color: '#38bdf8' }}>{incident.camera_id}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={incident.status === 'CONFIRMED' ? 'green' : incident.status === 'FALSE_POSITIVE' ? 'default' : 'orange'}>
              {incident.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Associated Person">
            <strong>
              {incident.person_name ? `${incident.person_name} (${incident.employee_id})` : (incident.unknown_id || 'UNKNOWN')}
            </strong>
          </Descriptions.Item>
          <Descriptions.Item label="Detected At">
            <Space orientation="horizontal" size={4}>
              <Clock size={12} color="#9ca3af" />
              <span>{incident.created_at ? new Date(incident.created_at).toLocaleString() : 'N/A'}</span>
            </Space>
          </Descriptions.Item>
          {incident.operator_notes && (
            <Descriptions.Item label="Notes" span={2}>
              {incident.operator_notes}
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>
    </Modal>
  );
};

export default SnapshotModal;
