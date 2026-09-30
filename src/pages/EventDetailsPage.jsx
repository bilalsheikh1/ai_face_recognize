import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Tag, Button, Space, Descriptions, Input, message, Modal, Empty, Tooltip } from 'antd';
import { ArrowLeft, Play, ShieldAlert, CheckCircle2, XCircle, Clock, Video, User, MapPin, Eye } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const EventDetailsPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const { isOperator } = useAuth();
  const navigate = useNavigate();

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data.event);
      setNotes(res.data.event.operator_notes || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      await api.put(`/events/${id}/status`, {
        status: newStatus,
        operator_notes: notes
      });
      message.success(`Event status updated to ${newStatus}`);
      fetchEvent();
    } catch (err) {
      message.error('Failed to update event status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <Card loading style={{ margin: '20px' }} />;
  if (!event) return <Empty description="Incident Event not found" />;

  return (
    <div>
      <Button
        icon={<ArrowLeft size={14} />}
        onClick={() => navigate('/events')}
        style={{ marginBottom: '16px', background: '#162238', borderColor: '#1f2d47', color: '#f3f4f6' }}
      >
        Back to Events Ledger
      </Button>

      {/* Header Banner */}
      <Card style={{ marginBottom: '20px' }} bodyStyle={{ padding: '18px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <Space>
              <ShieldAlert size={22} color="#ef4444" />
              <Title level={3} style={{ color: '#f3f4f6', margin: 0 }}>
                {event.event_type.replace(/_/g, ' ')}
              </Title>
              <Tag color={event.status === 'CONFIRMED' ? 'green' : event.status === 'FALSE_POSITIVE' ? 'default' : 'orange'} style={{ fontSize: '13px', padding: '2px 8px' }}>
                {event.status}
              </Tag>
            </Space>
            <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>
              Incident Reference #{event.id} | Recorded on {new Date(event.created_at).toLocaleString()}
            </div>
          </div>

          {isOperator() && (
            <Space wrap>
              <Button
                type="primary"
                icon={<CheckCircle2 size={14} />}
                onClick={() => handleUpdateStatus('CONFIRMED')}
                loading={updating}
                style={{ background: '#10b981', borderColor: '#10b981' }}
              >
                Confirm Incident
              </Button>
              <Button
                type="primary"
                icon={<Eye size={14} />}
                onClick={() => handleUpdateStatus('REVIEWING')}
                loading={updating}
                style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
              >
                Mark Under Review
              </Button>
              <Button
                danger
                icon={<XCircle size={14} />}
                onClick={() => handleUpdateStatus('FALSE_POSITIVE')}
                loading={updating}
              >
                False Positive
              </Button>
            </Space>
          )}
        </div>
      </Card>

      <Row gutter={[20, 20]}>
        {/* Left: Video Clip and Snapshot Evidence */}
        <Col xs={24} lg={14}>
          <Card title="Video Buffer Playback (Pre & Post Event Clip)" size="small" style={{ marginBottom: '20px' }}>
            {event.clip_path ? (
              <div style={{ width: '100%', borderRadius: '6px', overflow: 'hidden', background: '#000' }}>
                <video
                  controls
                  autoPlay
                  loop
                  style={{ width: '100%', maxHeight: '380px' }}
                  src={event.clip_path}
                >
                  Your browser does not support video tag.
                </video>
              </div>
            ) : (
              <div style={{ height: '220px', background: '#0e1524', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', color: '#9ca3af' }}>
                <Video size={32} color="#6b7280" />
                <p style={{ marginTop: '8px', fontSize: '13px' }}>Pre/Post Video Buffer Encoding or Live Stream Frame Captured</p>
              </div>
            )}
          </Card>

          <Card title="Annotated High-Resolution Snapshot Evidence" size="small">
            {event.snapshot_path ? (
              <div style={{ width: '100%', borderRadius: '6px', overflow: 'hidden', background: '#000' }}>
                <img
                  src={event.snapshot_path}
                  alt="Evidence"
                  style={{ width: '100%', objectFit: 'contain', maxHeight: '400px' }}
                />
              </div>
            ) : (
              <Empty description="No snapshot evidence available" />
            )}
          </Card>
        </Col>

        {/* Right: Detailed Metadata & Notes */}
        <Col xs={24} lg={10}>
          <Card title="Incident Metadata & Telemetry" size="small" style={{ marginBottom: '20px' }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Camera ID">
                <Tag color="cyan">{event.camera_id}</Tag> {event.camera_name}
              </Descriptions.Item>
              <Descriptions.Item label="Location">
                {event.camera_location || 'Main Security Facility'}
              </Descriptions.Item>
              <Descriptions.Item label="AI Confidence Score">
                <span style={{ color: '#10b981', fontWeight: 700, fontSize: '14px' }}>
                  {Math.round(Number(event.confidence) > 1 ? Number(event.confidence) : Number(event.confidence) * 100)}%
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Involved Track ID">
                <span className="mono" style={{ color: '#00f2fe' }}>#{event.track_id || 'N/A'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Associated Identity">
                {event.person_name ? (
                  <Space>
                    <strong>{event.person_name}</strong>
                    <Tag color="blue">{event.employee_id}</Tag>
                    {event.person_id && (
                      <Button size="small" type="link" onClick={() => navigate(`/people/${event.person_id}`)}>
                        View Profile
                      </Button>
                    )}
                  </Space>
                ) : (
                  <span style={{ color: '#f59e0b' }}>{event.unknown_id || 'Unknown Person'}</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Zone Context">
                {event.zone_name ? <Tag color="gold">{event.zone_name}</Tag> : 'General Camera View'}
              </Descriptions.Item>
              <Descriptions.Item label="Event Start">
                <span className="mono" style={{ fontSize: '12px' }}>{event.started_at ? new Date(event.started_at).toLocaleString() : 'N/A'}</span>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Operator Forensic Notes & Log" size="small">
            <Input.TextArea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record investigation notes, eyewitness accounts, or security log entries..."
              style={{ background: '#162238', borderColor: '#1f2d47', color: '#fff', marginBottom: '12px' }}
            />
            {isOperator() && (
              <Button
                type="primary"
                block
                loading={updating}
                onClick={() => handleUpdateStatus(event.status)}
                style={{ background: '#3b82f6' }}
              >
                Save Investigation Notes
              </Button>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EventDetailsPage;
