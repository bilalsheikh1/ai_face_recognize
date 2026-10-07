import { io } from 'socket.io-client';

const opts = { transports: ['websocket', 'polling'], reconnectionAttempts: 10 };

let _cctv = null;
let _webcam = null;

// Pehli baar maangne par hi connect hota hai
export const getCctvSocket = () => {
  if (!_cctv) _cctv = io('/cctv', opts);
  return _cctv;
};

export const getWebcamSocket = () => {
  if (!_webcam) _webcam = io('/webcam', opts);
  return _webcam;
};