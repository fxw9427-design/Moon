// bridge_node.mjs — Node.js toy bridge for Termux
// Usage: node bridge_node.mjs
// Exposes HTTP on :7799, connects to Intiface on ws://localhost:12345

import http from 'http';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const WebSocket = require('ws');
import { URL } from 'url';

let ws = null, deviceIndex = 0, deviceReady = false, msgId = 10;

function sendWS(msg) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function connect() {
  console.log('Connecting to Intiface...');
  ws = new WebSocket('ws://localhost:12345');
  ws.on('open', () => {
    console.log('Connected to Intiface');
    sendWS([{ RequestServerInfo: { Id: 1, ClientName: 'Ling', MessageVersion: 3 } }]);
  });
  ws.on('message', (data) => {
    const msgs = JSON.parse(data.toString());
    for (const msg of msgs) {
      if (msg.ServerInfo) {
        console.log('Handshake OK, scanning...');
        sendWS([{ RequestDeviceList: { Id: 2 } }, { StartScanning: { Id: 3 } }]);
      }
      if (msg.DeviceList) {
        for (const dev of msg.DeviceList.Devices) {
          console.log(`Device: ${dev.DeviceName} (${dev.DeviceIndex})`);
          if (!deviceReady || dev.DeviceName.toLowerCase().includes('svakom')) {
            deviceIndex = dev.DeviceIndex; deviceReady = true;
            console.log(`Using: ${dev.DeviceName}`);
          }
        }
      }
      if (msg.DeviceAdded) {
        const dev = msg.DeviceAdded;
        console.log(`Device added: ${dev.DeviceName} (${dev.DeviceIndex})`);
        if (!deviceReady || dev.DeviceName.toLowerCase().includes('svakom')) {
          deviceIndex = dev.DeviceIndex; deviceReady = true;
          console.log(`Using: ${dev.DeviceName}`);
        }
      }
    }
  });
  ws.on('close', () => {
    console.log('Disconnected, reconnecting in 5s...');
    deviceReady = false;
    setTimeout(connect, 5000);
  });
  ws.on('error', (e) => console.error('WS error:', e.message));
}

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  res.setHeader('Content-Type', 'application/json');
  if (u.pathname === '/status') {
    res.end(JSON.stringify({ connected: ws && ws.readyState === WebSocket.OPEN, deviceReady, deviceIndex }));
  } else if (u.pathname === '/vibrate2') {
    const s0 = Math.max(0, Math.min(1, parseFloat(u.searchParams.get('s0') || '0')));
    const s1 = Math.max(0, Math.min(1, parseFloat(u.searchParams.get('s1') || '0')));
    msgId++;
    sendWS([{ ScalarCmd: { Id: msgId, DeviceIndex: deviceIndex, Scalars: [
      { Index: 0, Scalar: s0, ActuatorType: 'Vibrate' },
      { Index: 1, Scalar: s1, ActuatorType: 'Vibrate' }
    ] } }]);
    res.end(JSON.stringify({ ok: true, s0, s1 }));
  } else if (u.pathname === '/stop') {
    msgId++;
    sendWS([{ StopDeviceCmd: { Id: msgId, DeviceIndex: deviceIndex } }]);
    res.end(JSON.stringify({ ok: true, stopped: true }));
  } else {
    res.end(JSON.stringify({ ok: true, endpoints: ['/status', '/vibrate2?s0=0.3&s1=0.2', '/stop'] }));
  }
}).listen(7799, () => console.log('HTTP bridge on :7799'));

connect();
