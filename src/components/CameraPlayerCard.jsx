import React, { useState } from 'react';
import { Card, Tag, Button, Tooltip, Space, Badge } from 'antd';
import { Maximize2, Layers, Camera as CameraIcon, RefreshCw, MapPin } from 'lucide-react';

const CameraPlayerCard = ({ camera, onOpenZoneModal }) => {
  const [annotated, setAnnotated] = useState(true);
  const [streamError, setStreamError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(Date.now());

  const streamUrl = `${import.meta.env.VITE_API_URL}/api/stream/${camera.camera_id}/live?annotated=${annotated}&k=${refreshKey}`;

  const handleRefresh = () => {
    setStreamError(false);
    setRefreshKey(Date.now());
  };

  const handleSnapshot = () => {
    const a = document.createElement('a');
    a.href = streamUrl;
    a.download = `${camera.camera_id}_snapshot_${Date.now()}.jpg`;
    a.target = '_blank';
    a.click();
  };

  return (
    <Card
      size="small"
      style={{
        background: '#121c2e',
        border: '1px solid #1f2d47',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
      bodyStyle={{ padding: '0' }}
    >
      {/* Camera Header Bar */}
      <div style={{
        padding: '10px 14px',
        background: '#0d1524',
        borderBottom: '1px solid #1f2d47',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Space>
          <span className="live-badge-dot" style={{ backgroundColor: camera.is_online ? '#10b981' : '#ef4444' }} />
          <strong style={{ color: '#f3f4f6', fontSize: '13px' }}>{camera.camera_id}</strong>
          <span style={{ color: '#9ca3af', fontSize: '12px' }}>{camera.name}</span>
        </Space>
        <Space orientation="horizontal" size={6}>
          <Tag color="cyan" style={{ fontSize: '10px', margin: 0 }}>
            {camera.resolution || '1080p'} @ {camera.fps || 15}fps
          </Tag>
          {camera.active_tracks_count !== undefined && (
            <Tag color="blue" style={{ fontSize: '10px', margin: 0 }}>
              {camera.active_tracks_count} detected
            </Tag>
          )}
        </Space>
      </div>

      {/* Video Viewport */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: '56.25%', // 16:9 Aspect Ratio
        background: '#050811',
        overflow: 'hidden'
      }}>
        {!streamError ? (
          <img
            src={streamUrl}
            alt={camera.name}
            onError={() => setStreamError(true)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        ) : (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444'
          }}>
            <p style={{ fontWeight: 600 }}>🔴 STREAM OFFLINE / CONNECTING</p>
            <Button size="small" icon={<RefreshCw size={13} />} onClick={handleRefresh} style={{ marginTop: '8px' }}>
              Reconnect Stream
            </Button>
          </div>
        )}

        {/* Floating Controls Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          display: 'flex',
          gap: '6px',
          background: 'rgba(11, 15, 25, 0.75)',
          padding: '4px 6px',
          borderRadius: '6px',
          backdropFilter: 'blur(4px)'
        }}>
          <Tooltip title={annotated ? "Hide AI Overlays" : "Show AI Overlays"}>
            <Button
              size="small"
              type={annotated ? "primary" : "default"}
              icon={<Layers size={13} />}
              onClick={() => setAnnotated(!annotated)}
              style={{ fontSize: '11px', height: '26px', padding: '0 8px' }}
            >
              AI HUD
            </Button>
          </Tooltip>

          {onOpenZoneModal && (
            <Tooltip title="Configure Zones & Tripwires">
              <Button
                size="small"
                icon={<MapPin size={13} />}
                onClick={() => onOpenZoneModal(camera)}
                style={{ fontSize: '11px', height: '26px', padding: '0 8px' }}
              >
                Zones
              </Button>
            </Tooltip>
          )}

          <Tooltip title="Capture Snapshot">
            <Button
              size="small"
              icon={<CameraIcon size={13} />}
              onClick={handleSnapshot}
              style={{ fontSize: '11px', height: '26px', padding: '0 8px' }}
            />
          </Tooltip>
        </div>
      </div>
    </Card>
  );
};

export default CameraPlayerCard;
