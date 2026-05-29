const http = require('http');
const WebSocket = require('ws');
const port = process.env.WS_PORT || 4001;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    });
    return res.end();
  }

  // Simple HTTP endpoint allowing external sites to POST messages to be broadcast
  if (req.method === 'POST' && req.url === '/broadcast') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const text = parsed && (parsed.text || parsed.message) ? String(parsed.text || parsed.message) : null;
        if (!text) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN });
          return res.end(JSON.stringify({ success: false, error: 'missing text' }));
        }

        const payload = JSON.stringify({ type: 'message', text });
        if (wss && wss.clients && wss.clients.size > 0) {
          wss.broadcast(payload, null);
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN });
        return res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN });
        return res.end(JSON.stringify({ success: false, error: 'invalid json' }));
      }
    });

    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

const wss = new WebSocket.Server({ server });

// Broadcast helper
wss.broadcast = function broadcast(data, sender) {
  wss.clients.forEach(function each(client) {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

wss.on('connection', function connection(ws, req) {
  console.log('client connected', req.socket.remoteAddress, req.headers.origin || '');

  ws.on('message', function incoming(message) {
    console.log('received:', message.toString());
    // Parse message text (either plain or JSON { text })
    let text;
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed && parsed.text) {
        text = String(parsed.text);
      } else {
        text = message.toString();
      }
    } catch (e) {
      text = message.toString();
    }

    const payloadForOthers = JSON.stringify({ type: 'message', text });
    const payloadForSender = JSON.stringify({ type: 'message', text, self: true });

    // Broadcast to everyone, but send a self-tagged payload to the sender
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          if (client === ws) {
            client.send(payloadForSender);
          } else {
            client.send(payloadForOthers);
          }
        } catch (e) {
          // ignore send errors per-client
        }
      }
    });
  });

  ws.on('close', () => console.log('client disconnected'));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`HTTP/WebSocket server listening on http://0.0.0.0:${port}`);
  console.log(`Allowed origin: ${ALLOWED_ORIGIN}`);
});
