import { useEffect, useRef, useState } from 'react';
import { API_BASE } from '../config';

export function getWebSocketUrl(): string {
  if (API_BASE) {
    // Replaces both http:// and https:// with ws:// and wss://
    return API_BASE.replace(/^http/, 'ws');
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
}

export interface TelemetryPayload {
  type: string;
  state: any;
  insights: any[];
  decisions: any[];
}

export function useTelemetryWebSocket(onUpdate: (payload: TelemetryPayload) => void) {
  const [connected, setConnected] = useState(false);
  const onUpdateRef = useRef(onUpdate);

  // Keep dynamic callback reference updated to prevent effect re-triggering
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    function connect() {
      if (!isMounted) return;

      const wsUrl = getWebSocketUrl();
      console.log(`Connecting to WebSocket: ${wsUrl}`);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (isMounted) {
          setConnected(true);
          console.log('WebSocket connection established');
        }
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as TelemetryPayload;
          if (payload.type === 'TELEMETRY_UPDATE') {
            onUpdateRef.current(payload);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        if (isMounted) {
          setConnected(false);
          console.log('WebSocket connection closed. Attempting reconnect in 3 seconds...');
          reconnectTimeoutId = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket connection error:', error);
        ws?.close();
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (ws) {
        ws.close();
      }
      if (reconnectTimeoutId) {
        clearTimeout(reconnectTimeoutId);
      }
    };
  }, []);

  return { connected };
}
