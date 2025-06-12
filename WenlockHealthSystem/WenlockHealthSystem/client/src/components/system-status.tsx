import { useState, useEffect } from "react";
import { wsManager } from "@/lib/websocket";
import { WebSocketMessage } from "@shared/schema";
import { Wifi, Database, Clock } from "lucide-react";

export default function SystemStatus() {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [clientCount, setClientCount] = useState<number>(0);

  useEffect(() => {
    // Initial connection status
    setConnectionStatus(wsManager.getConnectionStatus());

    // Subscribe to WebSocket messages
    const unsubscribe = wsManager.subscribe((message: WebSocketMessage) => {
      if (message.type === 'connection_status') {
        setConnectionStatus('connected');
        setLastUpdate(new Date());
        if (message.data.clientCount !== undefined) {
          setClientCount(message.data.clientCount);
        }
      }
    });

    // Check connection status periodically
    const statusInterval = setInterval(() => {
      const status = wsManager.getConnectionStatus();
      setConnectionStatus(status);
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(statusInterval);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-600';
      case 'connecting':
        return 'bg-yellow-600';
      case 'disconnected':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 flex items-center">
            <Wifi className="mr-2 h-4 w-4" />
            WebSocket Connection
          </span>
          <span className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(connectionStatus)}`}></div>
            <span className={`text-sm font-medium ${
              connectionStatus === 'connected' ? 'text-green-600' :
              connectionStatus === 'connecting' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {getStatusText(connectionStatus)}
            </span>
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 flex items-center">
            <Database className="mr-2 h-4 w-4" />
            Database Sync
          </span>
          <span className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(connectionStatus)}`}></div>
            <span className={`text-sm font-medium ${
              connectionStatus === 'connected' ? 'text-green-600' : 'text-gray-600'
            }`}>
              {connectionStatus === 'connected' ? 'Synced' : 'Offline'}
            </span>
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            Last Update
          </span>
          <span className="text-sm font-medium text-gray-900">
            {formatTime(lastUpdate)}
          </span>
        </div>

        {clientCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Connected Clients</span>
            <span className="text-sm font-medium text-gray-900">{clientCount}</span>
          </div>
        )}
      </div>
    </div>
  );
}
