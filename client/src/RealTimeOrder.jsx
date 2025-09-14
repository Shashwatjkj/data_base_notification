import React, { useEffect, useRef, useState } from "react";

// RealtimeOrders.jsx
// Tailwind-based React component that mirrors the original HTML page behavior.
// Usage: <RealtimeOrders socketUrl="ws://localhost:8080" maxItems={50} />

export default function RealtimeOrders({ socketUrl = "ws://localhost:8080", maxItems = 50 }) {
  const [status, setStatus] = useState("—");
  const [updates, setUpdates] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(socketUrl);
    wsRef.current = ws;

    ws.onopen = () => setStatus("connected");
    ws.onclose = () => setStatus("closed");
    ws.onerror = (e) => {
      setStatus("error");
      console.error("WS error", e);
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === "init" && Array.isArray(msg.data)) {
          msg.data.forEach((item) => prependUpdate("snapshot", item));
        } else if (msg.type === "db_event") {
          prependUpdate(msg.operation, msg.data);
        } else {
          console.log("unknown message", msg);
        }
      } catch (err) {
        console.error("failed to parse", err);
      }
    };

    return () => {
      try {
        ws.close();
      } catch (err) {
        /* ignore */
      }
      wsRef.current = null;
    };
  }, [socketUrl]);

  function prependUpdate(op, data) {
    setUpdates((prev) => {
      const item = {
        key: `${op}-${data?.id ?? Date.now()}`,
        op,
        data,
      };
      const next = [item, ...prev];
      if (next.length > maxItems) next.splice(maxItems);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-start justify-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Realtime Orders</h2>

        <div className="mb-4">
          <strong className="mr-2">WebSocket status:</strong>
          <span
            id="status"
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              status === "connected"
                ? "bg-green-100 text-green-800"
                : status === "closed"
                ? "bg-gray-100 text-gray-800"
                : status === "error"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {status}
          </span>
        </div>

        <ul id="updates" className="space-y-2 max-h-96 overflow-auto">
          {updates.length === 0 && (
            <li className="text-sm text-gray-500">No updates yet.</li>
          )}

          {updates.map((u) => (
            <li key={u.key} className="flex items-start space-x-3">
              <span className="op text-xs font-bold uppercase tracking-wide bg-gray-100 px-2 py-1 rounded">{u.op}</span>
              <span className="meta text-sm text-gray-600">
                — Order #{u.data?.id ?? "—"} • {u.data?.customer_name ?? "Unknown"} • {u.data?.product_name ?? "—"} • {u.data?.status ?? "—"}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => {
              // manual reconnect
              try {
                wsRef.current?.close();
              } catch (err) {
                /* ignore */
              }
              setStatus("—");
              // re-create websocket by changing socketUrl reference (simple approach)
              // In practice you might want a more robust reconnect/backoff strategy.
              setTimeout(() => {
                // re-run effect by recreating ref: recreate WebSocket manually
                const ws = new WebSocket(socketUrl);
                wsRef.current = ws;
                ws.onopen = () => setStatus("connected");
                ws.onclose = () => setStatus("closed");
                ws.onerror = (e) => {
                  setStatus("error");
                  console.error("WS error", e);
                };
                ws.onmessage = (evt) => {
                  try {
                    const msg = JSON.parse(evt.data);
                    if (msg.type === "init" && Array.isArray(msg.data)) {
                      msg.data.forEach((item) => prependUpdate("snapshot", item));
                    } else if (msg.type === "db_event") {
                      prependUpdate(msg.operation, msg.data);
                    }
                  } catch (err) {
                    console.error("failed to parse", err);
                  }
                };
              }, 200);
            }}
            className="px-3 py-1 rounded bg-sky-500 text-white text-sm shadow-sm hover:opacity-95"
          >
            Reconnect
          </button>

          <button
            onClick={() => setUpdates([])}
            className="px-3 py-1 rounded border text-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            Clear
          </button>

          <div className="ml-auto text-sm text-gray-500">Showing {updates.length} updates</div>
        </div>
      </div>
    </div>
  );
}
