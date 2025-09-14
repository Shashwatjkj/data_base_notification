# 🚀 Realtime Orders

[![Postgres](https://img.shields.io/badge/Postgres-12%2B-blue?logo=postgresql)](https://www.postgresql.org/)  
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)](https://nodejs.org/)  
[![WebSocket](https://img.shields.io/badge/WebSocket-enabled-orange?logo=websocket)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

A realtime demo showing **Postgres → Node.js (pg + WebSockets) → Clients (Browser + CLI)**.  
Whenever rows in the `orders` table are inserted/updated/deleted, events stream instantly to connected clients.

---

## 📂 Project Structure

├── sql/
│ └── schema.sql # Orders table + trigger + function
├── backend/
│ ├── package.json
│ ├── server.js
│ └── .env.example # Copy → .env and set DATABASE_URL
└── client/
├── client.html # Browser client (open in browser)
└── cli-client.js # CLI client (Node.js)

