# 🚀 Realtime Orders

A realtime demo showing **Postgres → Node.js (pg + WebSockets) → Clients (Browser + CLI)**.  
Whenever rows in the `orders` table are inserted/updated/deleted, events stream instantly to connected clients.

---

## 📂 Project Structure

```
realtime-orders/
├─ sql/
│  └─ schema.sql
├─ server/
│  ├─ package.json
│  ├─ .env
│  └─ server.js
└─ client/
    └─src/
        ├─App.jsx
        ├─index.css
        ├─ main.jsx
        ├─ RealTimeOrders
        └─ index.html
  
```
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
## Backend Setup
cd sever
npm install
npm run start

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
## Client Setup
cd client
npm install
npm run dev

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
### backend/.env (Example)

```
# Copy this to backend/.env and fill DATABASE_URL
DATABASE_URL=postgres://password:postgres@localhost:5432/realtime_orders
PORT=8080
```

> If your Postgres runs on different host/credentials, update the `DATABASE_URL`.
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
### postgresSql
Run in new terminal or PowerShell or CMD:
psql -U postgres
```
enter Password
```
\c realtime_orders
```
run these command to make changes in database
```
```-- Insert```
INSERT INTO orders (customer_name, product_name, status) VALUES ('Alice', 'Keyboard', 'pending');

```-- Update```
UPDATE orders SET status = 'shipped', updated_at = NOW() WHERE id = 1;

```-- Delete```
DELETE FROM orders WHERE id = 1;
