import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Radio, Space, Typography, Tag, Select, Empty } from 'antd';
import { Video, Grid, Plus, RefreshCw, Layers } from 'lucide-react';
import api from '../services/api';
import CameraPlayerCard from '../components/CameraPlayerCard';
import ZoneEditorModal from '../components/ZoneEditorModal';

const { Title, Text } = Typography;

const LiveCamerasPage = () => {
  const [cameras, setCameras] = useState([]);
  const [gridSize, setGridSize] = useState(2); // 1 = 1x1, 2 = 2x2, 3 = 3x3
  const [selectedCameraForZone, setSelectedCameraForZone] = useState(null);
  const [locationFilter, setLocationFilter] = useState('ALL');

  const fetchCameras = async () => {
    try {
      const res = await api.get('/cameras');
      setCameras(res.data.data?.cameras || []);
    } catch (err) {
      console.error('Error fetching cameras:', err);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  const locations = ['ALL', ...new Set(cameras.map((c) => c.location).filter(Boolean))];

  const filteredCameras = cameras.filter((c) => {
    if (locationFilter !== 'ALL' && c.location !== locationFilter) return false;
    return true;
  });

  const getColSpan = () => {
    if (gridSize === 1) return 24;
    if (gridSize === 2) return 12;
    if (gridSize === 3) return 8;
    return 6;
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <Title level={3} style={{ color: '#f3f4f6', margin: 0 }}>Live Surveillance Video Matrix</Title>
          <Text style={{ color: '#9ca3af', fontSize: '13px' }}>Multi-stream real-time tracking, tripwires & behavioral monitoring</Text>
        </div>

        <Space wrap>
          <Select
            value={locationFilter}
            onChange={setLocationFilter}
            style={{ width: 160 }}
            options={locations.map((loc) => ({ label: loc === 'ALL' ? 'All Locations' : loc, value: loc }))}
          />

          <Radio.Group value={gridSize} onChange={(e) => setGridSize(e.target.value)} buttonStyle="solid">
            <Radio.Button value={1}>1 × 1</Radio.Button>
            <Radio.Button value={2}>2 × 2</Radio.Button>
            <Radio.Button value={3}>3 × 3</Radio.Button>
          </Radio.Group>

          <Button icon={<RefreshCw size={14} />} onClick={fetchCameras} style={{ background: '#162238', borderColor: '#1f2d47', color: '#f3f4f6' }}>
            Refresh
          </Button>
        </Space>
      </div>

      {/* Camera Grid View */}
      {filteredCameras.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <Empty description={<span style={{ color: '#9ca3af' }}>No cameras connected for this filter</span>} />
        </Card>
      ) : (
        <Row gutter={[14, 14]}>
          {filteredCameras.map((cam) => (
            <Col xs={24} sm={gridSize === 1 ? 24 : 12} lg={getColSpan()} key={cam.id}>
              <CameraPlayerCard
                camera={cam}
                onOpenZoneModal={(c) => setSelectedCameraForZone(c)}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* Interactive Zone & Line Editor Modal */}
      {selectedCameraForZone && (
        <ZoneEditorModal
          visible={!!selectedCameraForZone}
          camera={selectedCameraForZone}
          onClose={() => setSelectedCameraForZone(null)}
          onRefresh={fetchCameras}
        />
      )}
    </div>
  );
};

export default LiveCamerasPage;
