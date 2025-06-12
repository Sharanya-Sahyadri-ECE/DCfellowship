import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupWebSocket } from "./websocket";
import { insertEmergencyAlertSchema, insertActivityLogSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Departments
  app.get("/api/departments", async (_req, res) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  // Doctors
  app.get("/api/doctors", async (_req, res) => {
    try {
      const doctors = await storage.getAllDoctors();
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctors" });
    }
  });

  app.post("/api/doctors/:id/next-token", async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const doctor = await storage.getAllDoctors().then(doctors => 
        doctors.find(d => d.id === doctorId)
      );
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      // Generate next token
      const currentTokenParts = doctor.currentToken?.split('-') || ['C', '0'];
      const prefix = currentTokenParts[0];
      const number = parseInt(currentTokenParts[1] || '0') + 1;
      const nextToken = `${prefix}-${number.toString().padStart(2, '0')}`;

      const updatedDoctor = await storage.updateDoctorToken(doctorId, nextToken);
      
      // Log activity
      await storage.createActivityLog({
        message: `${doctor.name} now serving Token ${nextToken}`,
        type: "token_update",
        departmentId: doctor.departmentId,
      });

      res.json(updatedDoctor);
    } catch (error) {
      res.status(500).json({ message: "Failed to update doctor token" });
    }
  });

  // Tokens
  app.get("/api/tokens", async (_req, res) => {
    try {
      const tokens = await storage.getAllTokens();
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tokens" });
    }
  });

  app.post("/api/tokens", async (req, res) => {
    try {
      const { departmentId, doctorId } = req.body;
      
      if (!departmentId) {
        return res.status(400).json({ message: "Department ID is required" });
      }

      // Get next token number for the department
      const nextTokenNumber = await storage.getNextTokenNumber(departmentId);
      
      const token = await storage.createToken({
        number: nextTokenNumber,
        departmentId,
        doctorId: doctorId || null,
        status: "waiting",
      });

      // Log activity
      const departments = await storage.getAllDepartments();
      const department = departments.find(d => d.id === departmentId);
      await storage.createActivityLog({
        message: `New patient added to ${department?.name || 'department'} queue - Token ${nextTokenNumber}`,
        type: "token_update",
        departmentId,
      });

      res.json(token);
    } catch (error) {
      res.status(500).json({ message: "Failed to create token" });
    }
  });

  app.get("/api/tokens/department/:departmentId", async (req, res) => {
    try {
      const departmentId = parseInt(req.params.departmentId);
      const tokens = await storage.getTokensByDepartment(departmentId);
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch department tokens" });
    }
  });

  app.post("/api/tokens/ot/next", async (_req, res) => {
    try {
      const departments = await storage.getAllDepartments();
      const otDept = departments.find(d => d.code === "OT");
      
      if (!otDept) {
        return res.status(404).json({ message: "OT department not found" });
      }

      const tokens = await storage.getTokensByDepartment(otDept.id);
      const activeToken = tokens.find(t => t.status === "active");
      const waitingTokens = tokens.filter(t => t.status === "waiting").sort((a, b) => 
        parseInt(a.number) - parseInt(b.number)
      );

      // Complete current active token
      if (activeToken) {
        await storage.updateTokenStatus(activeToken.id, "completed");
      }

      // Activate next waiting token
      if (waitingTokens.length > 0) {
        const nextToken = waitingTokens[0];
        await storage.updateTokenStatus(nextToken.id, "active");
        
        // Log activity
        await storage.createActivityLog({
          message: `OT Token ${nextToken.number} now being served`,
          type: "token_update",
          departmentId: otDept.id,
        });

        res.json(nextToken);
      } else {
        res.status(400).json({ message: "No waiting tokens" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to progress OT token" });
    }
  });

  app.post("/api/tokens/ot/reset", async (_req, res) => {
    try {
      const departments = await storage.getAllDepartments();
      const otDept = departments.find(d => d.code === "OT");
      
      if (!otDept) {
        return res.status(404).json({ message: "OT department not found" });
      }

      // Reset all tokens to waiting
      const tokens = await storage.getTokensByDepartment(otDept.id);
      for (const token of tokens) {
        if (token.status !== "completed") {
          await storage.updateTokenStatus(token.id, "waiting");
        }
      }

      // Activate token 1
      const firstToken = tokens.find(t => t.number === "1") || tokens[0];
      if (firstToken) {
        await storage.updateTokenStatus(firstToken.id, "active");
      }

      // Log activity
      await storage.createActivityLog({
        message: "OT queue reset - starting from token 1",
        type: "token_update",
        departmentId: otDept.id,
      });

      res.json({ message: "OT queue reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset OT queue" });
    }
  });

  // Medicines
  app.get("/api/medicines", async (_req, res) => {
    try {
      const medicines = await storage.getAllMedicines();
      res.json(medicines);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch medicines" });
    }
  });

  app.get("/api/medicines/low-stock", async (_req, res) => {
    try {
      const medicines = await storage.getLowStockMedicines();
      res.json(medicines);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock medicines" });
    }
  });

  app.post("/api/medicines/:id/update-stock", async (req, res) => {
    try {
      const medicineId = parseInt(req.params.id);
      const { quantity } = req.body;

      if (typeof quantity !== "number") {
        return res.status(400).json({ message: "Quantity must be a number" });
      }

      const updatedMedicine = await storage.updateMedicineStock(medicineId, quantity);
      
      // Log activity
      await storage.createActivityLog({
        message: `${updatedMedicine.name} stock updated: ${quantity > 0 ? '+' : ''}${quantity} ${updatedMedicine.unit}`,
        type: "inventory_update",
        departmentId: null,
      });

      res.json(updatedMedicine);
    } catch (error) {
      res.status(500).json({ message: "Failed to update medicine stock" });
    }
  });

  // Emergency Alerts
  app.get("/api/emergency-alerts", async (_req, res) => {
    try {
      const alerts = await storage.getActiveEmergencyAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch emergency alerts" });
    }
  });

  app.post("/api/emergency-alerts", async (req, res) => {
    try {
      const result = insertEmergencyAlertSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid alert data" });
      }

      const alert = await storage.createEmergencyAlert(result.data);
      
      // Log activity
      await storage.createActivityLog({
        message: `Emergency Alert: ${alert.message}`,
        type: "emergency",
        departmentId: null,
      });

      res.json(alert);
    } catch (error) {
      res.status(500).json({ message: "Failed to create emergency alert" });
    }
  });

  app.post("/api/emergency-alerts/:id/dismiss", async (req, res) => {
    try {
      const alertId = parseInt(req.params.id);
      const alert = await storage.dismissEmergencyAlert(alertId);
      res.json(alert);
    } catch (error) {
      res.status(500).json({ message: "Failed to dismiss emergency alert" });
    }
  });

  // Activity Logs
  app.get("/api/activity-logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const logs = await storage.getRecentActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  return httpServer;
}
