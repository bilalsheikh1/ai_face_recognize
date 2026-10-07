import React, { useEffect, useRef, useState } from 'react';
import { getCctvSocket, getWebcamSocket } from '../services/camSocket';

const fill = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' };
const COLORS = { known: '#3cc83c', unknown: '#e63232', uncertain: '#ffa500' };

// CCTV: server se base64 frames
const CctvFeed = ({ camera }) => {
  const [image, setImage] = useState(null);

  useEffect(() => {
    const sock = getCctvSocket();
    const onFrame = (d) => {
      if (d.camera_id === camera.camera_id) setImage(d.image);
    };
    sock.on('cctv_frame', onFrame);
    return () => sock.off('cctv_frame', onFrame);
  }, [camera.camera_id]);

  if (!image) {
    return <div style={{ ...fill, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Waiting for stream...</div>;
  }
  return <img src={`data:image/jpeg;base64,${image}`} alt={camera.name} style={fill} />;
};

// Webcam: browser camera -> server -> chehre wapas
const WebcamFeed = ({ camera }) => {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const sock = getWebcamSocket();
    const grab = document.createElement('canvas');
    let stream = null;
    let timer = null;
    let busy = false;

    const draw = (faces) => {
      const v = videoRef.current;
      const c = overlayRef.current;
      if (!v || !c) return;
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.lineWidth = 3;
      ctx.font = '20px sans-serif';
      faces.forEach((f) => {
        const [x1, y1, x2, y2] = f.box;
        const color = COLORS[f.kind] || '#cccccc';
        ctx.strokeStyle = color;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        const text = f.kind === 'known' ? `${f.label} ${f.sim}` : f.label;
        const w = ctx.measureText(text).width + 8;
        ctx.fillStyle = color;
        ctx.fillRect(x1, y1 - 26, w, 26);
        ctx.fillStyle = '#fff';
        ctx.fillText(text, x1 + 4, y1 - 6);
      });
    };

    const send = () => {
      const v = videoRef.current;
      if (busy || !v || !v.videoWidth || !sock.connected) return;
      grab.width = v.videoWidth;
      grab.height = v.videoHeight;
      grab.getContext('2d').drawImage(v, 0, 0);
      busy = true;
      sock.emit('frame', { image: grab.toDataURL('image/jpeg', 0.7) }, (res) => {
        busy = false;
        // Abhi backend {ok, faces} deta hai; Step 14 ke baad {success, data:{faces}}
        draw((res && (res.faces || (res.data && res.data.faces))) || []);
      });
    };

    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
        timer = setInterval(send, 300);
      })
      .catch(() => setError('Camera permission nahi mili (browser mein Allow karein).'));

    return () => {
      clearInterval(timer);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [camera.camera_id]);

  return (
    <>
      <video ref={videoRef} muted playsInline style={fill} />
      <canvas ref={overlayRef} style={fill} />
      {error && (
        <div style={{ ...fill, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', textAlign: 'center', padding: 12 }}>
          {error}
        </div>
      )}
    </>
  );
};

const LiveFeed = ({ camera }) =>
  camera.type === 'webcam' ? <WebcamFeed camera={camera} /> : <CctvFeed camera={camera} />;

export default LiveFeed;