import React, { useState, useRef, useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Button, Space, Typography, Table, Tag, message } from 'antd';
import { Plus, Trash2, MapPin, Slash } from 'lucide-react';
import api from '../services/api';

const { Text } = Typography;

const ZoneEditorModal = ({ visible, camera, onClose, onRefresh }) => {
  const [zones, setZones] = useState([]);
  const [lines, setLines] = useState([]);
  const [drawMode, setDrawMode] = useState(null); // 'polygon' or 'line'
  const [currentPoints, setCurrentPoints] = useState([]);
  
  const [zoneForm] = Form.useForm();
  const [lineForm] = Form.useForm();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (camera && visible) {
      loadZonesAndLines();
    }
  }, [camera, visible]);

  const loadZonesAndLines = async () => {
    try {
      const res = await api.get(`/zones?camera_id=${camera.camera_id}`);
      setZones(res.data.zones || []);
      setLines(res.data.lines || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCanvasClick = (e) => {
    if (!drawMode) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    if (drawMode === 'polygon') {
      setCurrentPoints([...currentPoints, [x, y]]);
    } else if (drawMode === 'line') {
      if (currentPoints.length < 2) {
        setCurrentPoints([...currentPoints, [x, y]]);
      }
    }
  };

  const handleCreateZone = async (values) => {
    if (currentPoints.length < 3) {
      message.error('Click on the camera viewport to add at least 3 points for a polygon zone');
      return;
    }
    try {
      await api.post('/zones', {
        camera_id: camera.camera_id,
        name: values.name,
        zone_type: values.zone_type,
        polygon_coords: currentPoints,
        loitering_threshold_sec: values.loitering_threshold_sec || 30,
        crowd_limit: values.crowd_limit || 10
      });
      message.success('Zone created successfully');
      setCurrentPoints([]);
      setDrawMode(null);
      zoneForm.resetFields();
      loadZonesAndLines();
      if (onRefresh) onRefresh();
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to create zone');
    }
  };

  const handleCreateLine = async (values) => {
    if (currentPoints.length !== 2) {
      message.error('Click on the camera viewport to place start and end points for the line');
      return;
    }
    try {
      await api.post('/zones/lines', {
        camera_id: camera.camera_id,
        name: values.name,
        line_type: values.line_type || 'entry_exit',
        pt1: currentPoints[0],
        pt2: currentPoints[1],
        entry_direction: values.entry_direction || 'LEFT_TO_RIGHT'
      });
      message.success('Virtual Line created successfully');
      setCurrentPoints([]);
      setDrawMode(null);
      lineForm.resetFields();
      loadZonesAndLines();
      if (onRefresh) onRefresh();
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to create virtual line');
    }
  };

  const handleDeleteZone = async (id) => {
    try {
      await api.delete(`/zones/${id}`);
      message.success('Zone deleted');
      loadZonesAndLines();
      if (onRefresh) onRefresh();
    } catch (err) {
      message.error('Failed to delete zone');
    }
  };

  const handleDeleteLine = async (id) => {
    try {
      await api.delete(`/zones/lines/${id}`);
      message.success('Line deleted');
      loadZonesAndLines();
      if (onRefresh) onRefresh();
    } catch (err) {
      message.error('Failed to delete line');
    }
  };

  return (
    <Modal
      title={<span><MapPin size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Zone & Tripwire Line Editor - {camera?.camera_id}</span>}
      open={visible}
      onCancel={onClose}
      width={940}
      footer={null}
      destroyOnClose
    >
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Left: Interactive Canvas Viewport */}
        <div style={{ flex: 1 }}>
          <div style={{
            position: 'relative',
            width: '480px',
            height: '320px',
            background: '#050811',
            borderRadius: '6px',
            border: '1px solid #1f2d47',
            cursor: drawMode ? 'crosshair' : 'default',
            overflow: 'hidden'
          }}>
            {/* Live stream background */}
            <img
              src={`/api/stream/${camera?.camera_id}/live?annotated=false`}
              alt="Stream Background"
              style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain' }}
            />

            {/* SVG overlay for drawing existing and active shapes */}
            <svg
              ref={canvasRef}
              onClick={handleCanvasClick}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            >
              {/* Existing Zones */}
              {zones.map((z) => {
                const pts = z.polygon_coords.map(p => `${p[0]},${p[1]}`).join(' ');
                return (
                  <g key={`zone_${z.id}`}>
                    <polygon points={pts} fill={z.zone_type === 'restricted' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'} stroke={z.zone_type === 'restricted' ? '#ef4444' : '#f59e0b'} strokeWidth="2" />
                    {z.polygon_coords[0] && (
                      <text x={z.polygon_coords[0][0]} y={z.polygon_coords[0][1] - 5} fill="#fff" fontSize="11" fontWeight="bold">
                        {z.name}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Existing Lines */}
              {lines.map((l) => (
                <g key={`line_${l.id}`}>
                  <line x1={l.pt1[0]} y1={l.pt1[1]} x2={l.pt2[0]} y2={l.pt2[1]} stroke="#00f2fe" strokeWidth="3" />
                  <text x={l.pt1[0]} y={l.pt1[1] - 5} fill="#00f2fe" fontSize="11" fontWeight="bold">
                    {l.name}
                  </text>
                </g>
              ))}

              {/* Points currently being drawn */}
              {drawMode === 'polygon' && currentPoints.length > 0 && (
                <polygon points={currentPoints.map(p => `${p[0]},${p[1]}`).join(' ')} fill="rgba(0, 255, 170, 0.25)" stroke="#00ffaa" strokeWidth="2" strokeDasharray="4" />
              )}
              {drawMode === 'line' && currentPoints.length === 2 && (
                <line x1={currentPoints[0][0]} y1={currentPoints[0][1]} x2={currentPoints[1][0]} y2={currentPoints[1][1]} stroke="#00ffaa" strokeWidth="3" strokeDasharray="4" />
              )}
              {currentPoints.map((pt, i) => (
                <circle key={i} cx={pt[0]} cy={pt[1]} r="4" fill="#00ffaa" />
              ))}
            </svg>
          </div>

          <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
            <Button
              size="small"
              type={drawMode === 'polygon' ? 'primary' : 'default'}
              icon={<Plus size={13} />}
              onClick={() => { setDrawMode('polygon'); setCurrentPoints([]); }}
            >
              Draw Polygon Zone
            </Button>
            <Button
              size="small"
              type={drawMode === 'line' ? 'primary' : 'default'}
              icon={<Slash size={13} />}
              onClick={() => { setDrawMode('line'); setCurrentPoints([]); }}
            >
              Draw Virtual Line
            </Button>
            {drawMode && (
              <Button size="small" danger onClick={() => { setDrawMode(null); setCurrentPoints([]); }}>
                Cancel Draw
              </Button>
            )}
          </div>
          {drawMode && (
            <Text style={{ fontSize: '12px', color: '#00f2fe', display: 'block', marginTop: '4px' }}>
              {drawMode === 'polygon' ? `Click points on viewport to outline zone (${currentPoints.length} points added)` : `Click start and end points for line crossing (${currentPoints.length}/2)`}
            </Text>
          )}
        </div>

        {/* Right: Forms for saving zone/line and table of existing items */}
        <div style={{ width: '380px' }}>
          {drawMode === 'polygon' ? (
            <Form form={zoneForm} layout="vertical" onFinish={handleCreateZone}>
              <Form.Item name="name" label="Zone Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Server Room Area" />
              </Form.Item>
              <Form.Item name="zone_type" label="Zone Type" initialValue="restricted">
                <Select>
                  <Select.Option value="restricted">Restricted (Intrusion Alert)</Select.Option>
                  <Select.Option value="loitering">Loitering Detection Area</Select.Option>
                  <Select.Option value="crowd">Crowd Capacity Area</Select.Option>
                </Select>
              </Form.Item>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Form.Item name="loitering_threshold_sec" label="Loiter Sec" initialValue={30} style={{ flex: 1 }}>
                  <InputNumber min={5} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="crowd_limit" label="Max People" initialValue={10} style={{ flex: 1 }}>
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </div>
              <Button type="primary" htmlType="submit" block>Save Polygon Zone</Button>
            </Form>
          ) : drawMode === 'line' ? (
            <Form form={lineForm} layout="vertical" onFinish={handleCreateLine}>
              <Form.Item name="name" label="Line Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Gate A Entry Line" />
              </Form.Item>
              <Form.Item name="line_type" label="Line Function" initialValue="entry_exit">
                <Select>
                  <Select.Option value="entry_exit">Entry / Exit Crossing Line</Select.Option>
                  <Select.Option value="tripwire">Security Tripwire</Select.Option>
                </Select>
              </Form.Item>
              <Button type="primary" htmlType="submit" block>Save Virtual Line</Button>
            </Form>
          ) : (
            <div>
              <Text strong style={{ color: '#f3f4f6', display: 'block', marginBottom: '8px' }}>Configured Zones ({zones.length})</Text>
              <div style={{ maxHeight: '140px', overflowY: 'auto', marginBottom: '14px' }}>
                {zones.map(z => (
                  <div key={z.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#162238', borderRadius: '4px', marginBottom: '4px' }}>
                    <span>{z.name} <Tag color="gold" style={{ fontSize: '10px' }}>{z.zone_type}</Tag></span>
                    <Button type="text" danger size="small" icon={<Trash2 size={13} />} onClick={() => handleDeleteZone(z.id)} />
                  </div>
                ))}
              </div>

              <Text strong style={{ color: '#f3f4f6', display: 'block', marginBottom: '8px' }}>Configured Virtual Lines ({lines.length})</Text>
              <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
                {lines.map(l => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#162238', borderRadius: '4px', marginBottom: '4px' }}>
                    <span>{l.name} <Tag color="cyan" style={{ fontSize: '10px' }}>{l.line_type}</Tag></span>
                    <Button type="text" danger size="small" icon={<Trash2 size={13} />} onClick={() => handleDeleteLine(l.id)} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ZoneEditorModal;
