import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { getCurrentState } from '../engines/simulator.js';
import { generateAllInsights } from '../engines/crowdIntelligence.js';
import { evaluateDecisions } from '../engines/decisionEngine.js';

let wss: WebSocketServer | null = null;

export function initWebSocketServer(server: Server): WebSocketServer {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    // Send initial stadium telemetry state upon connection
    try {
      const state = getCurrentState();
      const insights = generateAllInsights(state.zones, state.incidents);
      const decisions = evaluateDecisions(state);
      
      ws.send(JSON.stringify({
        type: 'TELEMETRY_UPDATE',
        state,
        insights,
        decisions,
      }));
    } catch (err) {
      console.error('Error sending initial WS state:', err);
    }

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  });

  return wss;
}

export function broadcastTelemetryUpdate(): void {
  if (!wss) {
    return;
  }

  try {
    const state = getCurrentState();
    const insights = generateAllInsights(state.zones, state.incidents);
    const decisions = evaluateDecisions(state);
    
    const payload = JSON.stringify({
      type: 'TELEMETRY_UPDATE',
      state,
      insights,
      decisions,
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  } catch (err) {
    console.error('Error broadcasting telemetry update:', err);
  }
}
