// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;
const DATABASE_URL = process.env.DATABASE_URL;

// Express app
const app = express();
app.use(cors());
app.use(express.json());

// Postgres client (single connection for LISTEN)
const pgClient = new Client({ connectionString: DATABASE_URL });

async function startPostgres() {
  await pgClient.connect();
  // Listen on channel
  await pgClient.query('LISTEN order_changes');
  console.log('Listening to Postgres channel: order_changes');
}

startPostgres().catch(err => {
  console.error('Failed to connect to Postgres', err);
  process.exit(1);
});

// In-memory heartbeat: keep clients alive
function heartbeat() {
  this.isAlive = true;
}

// HTTP endpoints
app.get('/', (req, res) => res.send('Realtime Orders WebSocket server'));

app.get('/orders', async (req, res) => {
  try {
    const { rows } = await pgClient.query('SELECT * FROM orders ORDER BY updated_at DESC LIMIT 200');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create HTTP server and attach WS
const server = app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
const wss = new WebSocketServer({ server });

// Broadcast helper
function broadcast(msg) {
  const data = typeof msg === 'string' ? msg : JSON.stringify(msg);
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  });
}

// When a DB NOTIFY arrives
pgClient.on('notification', (msg) => {
  try {
    // msg.payload is text; should be JSON string as we built in trigger
    const payload = JSON.parse(msg.payload);
    console.log('DB Notification:', payload.operation, (payload.data && payload.data.id) || '');
    // forward to ws clients
    broadcast({ type: 'db_event', ...payload });
  } catch (err) {
    console.error('Failed to parse notification payload', err);
  }
});

// WebSocket connection handling
wss.on('connection', async (ws, req) => {
  console.log('Client connected');

  // Setup heartbeat
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  // Send an initial snapshot of recent orders
  try {
    const { rows } = await pgClient.query('SELECT * FROM orders ORDER BY updated_at DESC LIMIT 100');
    ws.send(JSON.stringify({ type: 'init', data: rows }));
  } catch (err) {
    console.error('Failed to send init snapshot', err);
  }

  ws.on('message', (message) => {
    // You can process messages from client if required
    console.log('Received from client:', message.toString());
  });

  ws.on('close', () => console.log('Client disconnected'));
});

// Periodic ping to detect dead peers (clean up)
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping(() => {});
  });
}, 30000);

wss.on('close', () => clearInterval(interval));
