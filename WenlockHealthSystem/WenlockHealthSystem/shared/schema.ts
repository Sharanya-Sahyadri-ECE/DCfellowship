import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
});

export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  currentToken: text("current_token"),
  isActive: boolean("is_active").notNull().default(true),
  avatar: text("avatar"),
});

export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  number: text("number").notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  doctorId: integer("doctor_id").references(() => doctors.id),
  status: text("status").notNull().default("waiting"), // waiting, active, completed
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const medicines = pgTable("medicines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  currentStock: integer("current_stock").notNull().default(0),
  minimumThreshold: integer("minimum_threshold").notNull().default(10),
  unit: text("unit").notNull(), // tablets, capsules, vials, ml, etc
});

export const emergencyAlerts = pgTable("emergency_alerts", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  type: text("type").notNull().default("general"), // general, code_blue, fire, etc
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  dismissedAt: timestamp("dismissed_at"),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  type: text("type").notNull(), // token_update, inventory_update, emergency, etc
  departmentId: integer("department_id").references(() => departments.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
});

export const insertDoctorSchema = createInsertSchema(doctors).omit({
  id: true,
});

export const insertTokenSchema = createInsertSchema(tokens).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertMedicineSchema = createInsertSchema(medicines).omit({
  id: true,
});

export const insertEmergencyAlertSchema = createInsertSchema(emergencyAlerts).omit({
  id: true,
  createdAt: true,
  dismissedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;

export type Token = typeof tokens.$inferSelect;
export type InsertToken = z.infer<typeof insertTokenSchema>;

export type Medicine = typeof medicines.$inferSelect;
export type InsertMedicine = z.infer<typeof insertMedicineSchema>;

export type EmergencyAlert = typeof emergencyAlerts.$inferSelect;
export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// WebSocket message types
export interface WebSocketMessage {
  type: 'token_update' | 'inventory_update' | 'emergency_alert' | 'activity_log' | 'connection_status' | 'request_data';
  data: any;
  timestamp: string;
}
