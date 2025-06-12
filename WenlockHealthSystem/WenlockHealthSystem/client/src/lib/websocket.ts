import { WebSocketMessage } from "@shared/schema";

type WebSocketCallback = (message: WebSocketMessage) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private callbacks: WebSocketCallback[] = [];
  private reconnectInterval: number = 5000;
  private maxReconnectAttempts: number = 5;
  private reconnectAttempts: number = 0;
  private isConnecting: boolean = false;

  connect() {
    // Simple mock implementation for now - will refresh data periodically
    console.log('WebSocket mock mode - using polling for updates');
    this.startPolling();
  }

  private startPolling() {
    // Simulate periodic updates
    setInterval(() => {
      // This would normally trigger data refetch in components
      console.log('Polling for updates...');
    }, 30000);
  }

  private attemptReconnect() {
    // Mock implementation
    console.log('Mock reconnect attempt');
  }

  send(message: WebSocketMessage) {
    // Mock implementation
    console.log('Mock WebSocket send:', message);
  }

  subscribe(callback: WebSocketCallback) {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  disconnect() {
    console.log('Mock WebSocket disconnect');
    this.callbacks = [];
  }

  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' {
    return 'connected'; // Mock as always connected
  }
}

export const wsManager = new WebSocketManager();
