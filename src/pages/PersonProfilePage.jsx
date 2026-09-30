import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Tag, Avatar, Timeline, Table, Button, Space, Statistic, Descriptions, Empty } from 'antd';
import { ArrowLeft, UserCheck, ShieldAlert, Clock, Video, LogIn, LogOut, MapPin, Eye } from 'lucide-react';
import api from '../services/api';

const { Title, Text } = Typography;

const PersonProfilePage = () => {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/people/${id}`)
      .then((res) => {
        setPerson(res.data.person);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Card loading style={{ margin: '20px' }} />;
  if (!person) return <Empty description="Person not found" />;

  return (
    <div>
      <Button
        icon={<ArrowLeft size={14} />}
        onClick={() => navigate('/people')}
        style={{ marginBottom: '16px', background: '#162238', borderColor: '#1f2d47', color: '#f3f4f6' }}
      >
        Back to Staff Directory
      </Button>

      {/* Profile Overview Card */}
      <Card style={{ marginBottom: '20px' }} bodyStyle={{ padding: '24px' }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={4} style={{ textAlign: 'center' }}>
            <Avatar
              src={person.profile_photo}
              size={110}
              style={{ background: '#2563eb', border: '2px solid #00f2fe' }}
            >
              {person.full_name[0]}
            </Avatar>
          </Col>

          <Col xs={24} md={12}>
            <Space direction="vertical" size={4}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Title level={3} style={{ color: '#f3f4f6', margin: 0 }}>{person.full_name}</Title>
                <Tag color="cyan" style={{ fontSize: '12px' }}>{person.employee_id}</Tag>
                <Tag color={person.active_status ? 'green' : 'default'}>
                  {person.active_status ? 'ACTIVE' : 'INACTIVE'}
                </Tag>
              </div>
              <Text style={{ color: '#9ca3af', fontSize: '14px' }}>Department: <strong style={{ color: '#e5e7eb' }}>{person.department}</strong></Text>
              {person.notes && <Text style={{ color: '#6b7280', fontSize: '12px' }}>{person.notes}</Text>}
            </Space>
          </Col>

          <Col xs={24} md={8}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card size="small" bodyStyle={{ padding: '10px' }} style={{ background: '#0e1524' }}>
                  <Statistic title="Total Passes" value={person.total_passes || 0} valueStyle={{ color: '#00f2fe' }} />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" bodyStyle={{ padding: '10px' }} style={{ background: '#0e1524' }}>
                  <Statistic title="Entries / Exits" value={`${person.entries_count || 0} / ${person.exits_count || 0}`} valueStyle={{ color: '#10b981' }} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Row gutter={[20, 20]}>
        {/* Left: Complete Activity Timeline */}
        <Col xs={24} lg={14}>
          <Card title="Activity & Spatial Movement Timeline" size="small">
            {(!person.activity_timeline || person.activity_timeline.length === 0) ? (
              <Empty description="No movement history recorded yet" />
            ) : (
              <Timeline mode="left" style={{ marginTop: '16px' }}>
                {person.activity_timeline.map((item, idx) => {
                  const isPass = item.type === 'PASS';
                  const isEntry = item.title.includes('ENTRY');
                  return (
                    <Timeline.Item
                      key={idx}
                      color={isPass ? (isEntry ? 'green' : 'orange') : 'red'}
                      label={<span className="mono" style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(item.timestamp).toLocaleTimeString()}</span>}
                    >
                      <div style={{ background: '#162238', padding: '10px', borderRadius: '6px', border: '1px solid #1f2d47' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <strong style={{ color: '#f3f4f6' }}>{item.title}</strong>
                          <Tag color="blue">{item.camera_id}</Tag>
                        </div>
                        <Text style={{ color: '#9ca3af', fontSize: '12px' }}>{item.details}</Text>
                        {item.snapshot_path && (
                          <div style={{ marginTop: '8px', width: '120px', height: '65px', borderRadius: '4px', overflow: 'hidden' }}>
                            <img src={item.snapshot_path} alt="Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                      </div>
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            )}
          </Card>
        </Col>

        {/* Right: Security Details & Incident History */}
        <Col xs={24} lg={10}>
          <Card title="Observed Cameras & Topology" size="small" style={{ marginBottom: '16px' }}>
            <Space wrap>
              {(person.cameras_seen || []).map((cam) => (
                <Tag color="purple" key={cam} style={{ fontSize: '12px', padding: '4px 8px' }}>
                  <MapPin size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  {cam}
                </Tag>
              ))}
            </Space>
          </Card>

          <Card title="Safety & Behavioral Incidents" size="small">
            {(!person.incident_events || person.incident_events.length === 0) ? (
              <div style={{ color: '#10b981', textAlign: 'center', padding: '20px' }}>
                ✓ No suspicious or abnormal behaviors recorded for this employee.
              </div>
            ) : (
              person.incident_events.map((inc) => (
                <div key={inc.id} style={{ padding: '10px', background: '#162238', borderRadius: '6px', marginBottom: '8px', border: '1px solid #1f2d47' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Tag color="red">{inc.event_type.replace(/_/g, ' ')}</Tag>
                    <span style={{ color: '#6b7280', fontSize: '11px' }}>{new Date(inc.created_at).toLocaleString()}</span>
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '12px', color: '#9ca3af' }}>{inc.operator_notes}</div>
                </div>
              ))
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PersonProfilePage;
