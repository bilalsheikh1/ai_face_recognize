import React, { useState, useEffect } from 'react';
import { Card, Tag, Button, Badge, Empty, Typography, Space } from 'antd';
import { AlertTriangle, ShieldAlert, Eye, Clock, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socket';
import api from '../services/api';

const { Text } = Typography;

const getEventColor = (type) => {
  if (type.includes('FIGHT') || type.includes('WEAPON')) return 'red';
  if (type.includes('FALL') || type.includes('SNATCH')) return 'volcano';
  if (type.includes('RESTRICTED') || type.includes('VANDAL')) return 'orange';
  if (type.includes('LOITER') || type.includes('CROWD')) return 'gold';
  return 'blue';
};

const LiveIncidentSidebar = ({ onViewEvent }) => {
  const [incidents, setIncidents] = useState([]);
  const [newIncidentId, setNewIncidentId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initial fetch of recent incidents
    api.get('/events?limit=8')
      .then((res) => {
        setIncidents(res.data.events || []);
      })
      .catch(console.error);

    // Real-time listener for incoming incidents
    const handleNewIncident = (event) => {
      setIncidents((prev) => [event, ...prev.slice(0, 19)]);
      setNewIncidentId(event.id);
      
      // Clear glow pulse after 4s
      setTimeout(() => setNewIncidentId(null), 4000);
    };

    const handleIncidentUpdate = (updatedEvent) => {
      setIncidents((prev) =>
        prev.map((e) => (e.id === updatedEvent.id ? { ...e, ...updatedEvent } : e))
      );
    };

    socketService.on('incident_created', handleNewIncident);
    socketService.on('incident_updated', handleIncidentUpdate);

    return () => {
      socketService.off('incident_created', handleNewIncident);
      socketService.off('incident_updated', handleIncidentUpdate);
    };
  }, []);

  return (
    <div style={{ width: '320px', height: '100%', background: '#0e1524', borderLeft: '1px solid #1f2d47', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #1f2d47', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <AlertTriangle size={18} color="#ef4444" />
          <Text strong style={{ color: '#f3f4f6', fontSize: '15px' }}>LIVE INCIDENTS</Text>
        </Space>
        <Badge count={incidents.length} overflowCount={99} style={{ backgroundColor: '#ef4444' }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {incidents.length === 0 ? (
          <Empty description={<span style={{ color: '#6b7280' }}>No incidents detected</span>} style={{ marginTop: '40px' }} />
        ) : (
          incidents.map((inc) => {
            const isNew = inc.id === newIncidentId;
            return (
              <Card
                key={inc.id || `${inc.camera_id}_${inc.created_at}`}
                size="small"
                className={isNew ? 'incident-alert-pulse' : ''}
                style={{
                  marginBottom: '10px',
                  background: '#162238',
                  border: isNew ? '1px solid #ef4444' : '1px solid #1f2d47',
                  borderRadius: '6px'
                }}
                bodyStyle={{ padding: '10px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <Tag color={getEventColor(inc.event_type)} style={{ fontWeight: 600, fontSize: '11px', margin: 0 }}>
                    {inc.event_type.replace(/_/g, ' ')}
                  </Tag>
                  <Tag color={inc.status === 'CONFIRMED' ? 'green' : inc.status === 'FALSE_POSITIVE' ? 'default' : 'orange'} style={{ fontSize: '10px' }}>
                    {inc.status}
                  </Tag>
                </div>

                {/* Snapshot Thumbnail if available */}
                {inc.snapshot_path ? (
                  <div style={{ width: '100%', height: '110px', background: '#000', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                    <img
                      src={inc.snapshot_path}
                      alt="Incident Snapshot"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '40px', background: '#0b0f19', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                    <Video size={16} color="#6b7280" />
                    <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: '6px' }}>Recorded Feed</span>
                  </div>
                )}

                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Target:</span>
                    <strong style={{ color: '#e5e7eb' }}>
                      {inc.person_name ? `${inc.person_name} (${inc.employee_id})` : (inc.unknown_id || 'Unknown')}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Camera:</span>
                    <span style={{ color: '#38bdf8' }}>{inc.camera_id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Confidence:</span>
                    <span style={{ color: '#10b981' }}>{intVal(inc.confidence)}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Time:</span>
                    <span style={{ color: '#6b7280', fontSize: '11px' }}>
                      {inc.created_at ? new Date(inc.created_at).toLocaleTimeString() : 'Just now'}
                    </span>
                  </div>
                </div>

                <Button
                  type="primary"
                  size="small"
                  block
                  icon={<Eye size={13} />}
                  onClick={() => {
                    if (onViewEvent) {
                      onViewEvent(inc);
                    } else {
                      navigate(`/events/${inc.id}`);
                    }
                  }}
                  style={{ background: '#2563eb', borderColor: '#2563eb', fontSize: '12px' }}
                >
                  VIEW EVENT
                </Button>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

const intVal = (val) => {
  if (!val) return 85;
  return Math.round(Number(val) > 1 ? Number(val) : Number(val) * 100);
};

export default LiveIncidentSidebar;
