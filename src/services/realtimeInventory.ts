import { AppState, AppStateStatus } from 'react-native';

const SUPABASE_REALTIME_URL =
  'wss://llvulxhjpyztuoorcacz.supabase.co/realtime/v1/websocket';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsdnVseGhqcHl6dHVvb3JjYWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzExNjAsImV4cCI6MjA5ODY0NzE2MH0.yVEm7ra2IjJ6xZWIIQj9KBJbCdsE6KItkLOjHM64zcU';

export type InventoryChangeAction = 'added' | 'updated' | 'deleted';

export interface InventoryChangeEvent {
  action: InventoryChangeAction;
  vendorId: string;
  item: Record<string, any>;
}

/**
 * Lightweight, zero-dependency Supabase Realtime subscriber over native WebSocket.
 * Connects only while subscribed in foreground and pauses on background to minimize
 * mobile battery, CPU, and cellular/Wi-Fi usage.
 */
export function subscribeVendorInventory(
  vendorId: string,
  onEvent: (evt: InventoryChangeEvent) => void,
  onReconnect?: () => void
): () => void {
  if (!vendorId) return () => {};

  let ws: WebSocket | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closedByCaller = false;
  let hasConnectedOnce = false;
  let backoffMs = 2000;
  let refCounter = 1;
  const topic = `realtime:vendor-inventory:${vendorId}`;

  const clearTimers = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const disconnect = () => {
    clearTimers();
    if (ws) {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ topic, event: 'phx_leave', payload: {}, ref: String(refCounter++) }));
        }
        ws.close();
      } catch {}
      ws = null;
    }
  };

  const connect = () => {
    if (closedByCaller || AppState.currentState !== 'active') return;
    disconnect();

    try {
      ws = new WebSocket(`${SUPABASE_REALTIME_URL}?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`);

      ws.onopen = () => {
        if (closedByCaller || !ws) return;
        backoffMs = 2000;

        ws.send(
          JSON.stringify({
            topic,
            event: 'phx_join',
            payload: { config: { broadcast: { self: false } } },
            ref: String(refCounter++),
          })
        );

        heartbeatTimer = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                topic: 'phoenix',
                event: 'heartbeat',
                payload: {},
                ref: String(refCounter++),
              })
            );
          }
        }, 25000);

        if (hasConnectedOnce) {
          onReconnect?.();
        }
        hasConnectedOnce = true;
      };

      ws.onmessage = (msg) => {
        try {
          const parsed = JSON.parse(String(msg.data));
          if (parsed?.event === 'broadcast' && parsed?.payload?.event === 'inventory_change') {
            const inner = parsed.payload.payload as InventoryChangeEvent;
            if (inner && inner.vendorId === vendorId) {
              onEvent(inner);
            }
          }
        } catch {}
      };

      ws.onclose = () => {
        clearTimers();
        if (!closedByCaller && AppState.currentState === 'active') {
          reconnectTimer = setTimeout(connect, backoffMs);
          backoffMs = Math.min(backoffMs * 2, 30000);
        }
      };

      ws.onerror = () => {
        // Handled cleanly by onclose backoff reconnect
      };
    } catch {}
  };

  const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (closedByCaller) return;
    if (nextState === 'active') {
      connect();
    } else {
      disconnect();
    }
  });

  connect();

  return () => {
    closedByCaller = true;
    appStateSub.remove();
    disconnect();
  };
}
