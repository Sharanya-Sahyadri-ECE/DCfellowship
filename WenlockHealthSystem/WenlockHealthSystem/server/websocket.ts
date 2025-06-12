import { WebSocketServer, WebSocket } from "ws";
import { IStorage } from "./storage";
import { WebSocketMessage } from "@shared/schema";

interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
}

export function setupWebSocket(wss: WebSocketServer, storage: IStorage) {
  const clients = new Set<ExtendedWebSocket>();

  // Handle WebSocket server errors
  wss.on('error', (error) => {
    console.error('WebSocket Server Error:', error);
  });

  // Broadcast to all connected clients
  function broadcast(message: WebSocketMessage) {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
          clients.delete(client);
        }
      }
    });
  }

  // Handle new connections
  wss.on("connection", (ws: ExtendedWebSocket) => {
    ws.isAlive = true;
    clients.add(ws);
    
    console.log("New WebSocket connection established");

    // Send connection status
    const connectionMessage: WebSocketMessage = {
      type: "connection_status",
      data: { status: "connected", clientCount: clients.size },
      timestamp: new Date().toISOString(),
    };
    ws.send(JSON.stringify(connectionMessage));

    // Handle heartbeat
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    // Handle client disconnect
    ws.on("close", (code, reason) => {
      clients.delete(ws);
      console.log(`WebSocket connection closed: ${code} ${reason}`);
    });

    // Handle messages from client
    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log("Received WebSocket message:", message);

        // Handle different message types
        switch (message.type) {
          case "ping":
            ws.send(JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }));
            break;
          case "request_data":
            // Send current data to client
            await sendCurrentData(ws);
            break;
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    });
  });

  // Send current system data to a specific client
  async function sendCurrentData(ws: WebSocket) {
    try {
      const [departments, doctors, tokens, medicines, alerts, logs] = await Promise.all([
        storage.getAllDepartments(),
        storage.getAllDoctors(),
        storage.getAllTokens(),
        storage.getAllMedicines(),
        storage.getActiveEmergencyAlerts(),
        storage.getRecentActivityLogs(20),
      ]);

      const dataMessage: WebSocketMessage = {
        type: "connection_status",
        data: {
          departments,
          doctors,
          tokens,
          medicines,
          alerts,
          logs,
        },
        timestamp: new Date().toISOString(),
      };

      ws.send(JSON.stringify(dataMessage));
    } catch (error) {
      console.error("Error sending current data:", error);
    }
  }

  // Periodic heartbeat to detect broken connections
  const heartbeatInterval = setInterval(() => {
    clients.forEach(client => {
      if (!client.isAlive) {
        clients.delete(client);
        return client.terminate();
      }
      
      client.isAlive = false;
      client.ping();
    });
  }, 30000); // 30 seconds

  // Clean up on server shutdown
  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });

  // Create periodic data sync
  const syncInterval = setInterval(async () => {
    try {
      // Check for low stock medicines and create alerts
      const lowStockMedicines = await storage.getLowStockMedicines();
      
      if (lowStockMedicines.length > 0) {
        const inventoryMessage: WebSocketMessage = {
          type: "inventory_update",
          data: { lowStockMedicines },
          timestamp: new Date().toISOString(),
        };
        broadcast(inventoryMessage);
      }

      // Broadcast system status
      const statusMessage: WebSocketMessage = {
        type: "connection_status",
        data: { 
          status: "synced", 
          clientCount: clients.size,
          lastSync: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
      broadcast(statusMessage);
    } catch (error) {
      console.error("Error in periodic sync:", error);
    }
  }, 30000); // 30 seconds

  // Return broadcast function for use in routes
  return { broadcast };
}
