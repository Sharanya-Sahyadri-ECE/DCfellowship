import {
  Department, InsertDepartment,
  Doctor, InsertDoctor,
  Token, InsertToken,
  Medicine, InsertMedicine,
  EmergencyAlert, InsertEmergencyAlert,
  ActivityLog, InsertActivityLog
} from "@shared/schema";

export interface IStorage {
  // Departments
  getAllDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  
  // Doctors
  getAllDoctors(): Promise<Doctor[]>;
  getDoctorsByDepartment(departmentId: number): Promise<Doctor[]>;
  updateDoctorToken(doctorId: number, currentToken: string): Promise<Doctor>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  
  // Tokens
  getAllTokens(): Promise<Token[]>;
  getTokensByDepartment(departmentId: number): Promise<Token[]>;
  getActiveTokens(): Promise<Token[]>;
  createToken(token: InsertToken): Promise<Token>;
  updateTokenStatus(tokenId: number, status: string): Promise<Token>;
  getNextTokenNumber(departmentId: number): Promise<string>;
  
  // Medicines
  getAllMedicines(): Promise<Medicine[]>;
  getLowStockMedicines(): Promise<Medicine[]>;
  updateMedicineStock(medicineId: number, quantity: number): Promise<Medicine>;
  createMedicine(medicine: InsertMedicine): Promise<Medicine>;
  
  // Emergency Alerts
  getActiveEmergencyAlerts(): Promise<EmergencyAlert[]>;
  createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert>;
  dismissEmergencyAlert(alertId: number): Promise<EmergencyAlert>;
  
  // Activity Logs
  getRecentActivityLogs(limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
}

export class MemStorage implements IStorage {
  private departments: Map<number, Department>;
  private doctors: Map<number, Doctor>;
  private tokens: Map<number, Token>;
  private medicines: Map<number, Medicine>;
  private emergencyAlerts: Map<number, EmergencyAlert>;
  private activityLogs: Map<number, ActivityLog>;
  private currentId: { [key: string]: number };

  constructor() {
    this.departments = new Map();
    this.doctors = new Map();
    this.tokens = new Map();
    this.medicines = new Map();
    this.emergencyAlerts = new Map();
    this.activityLogs = new Map();
    this.currentId = {
      departments: 1,
      doctors: 1,
      tokens: 1,
      medicines: 1,
      emergencyAlerts: 1,
      activityLogs: 1,
    };
    
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    // Initialize departments
    const otDept: Department = {
      id: this.currentId.departments++,
      name: "Operation Theatre",
      code: "OT",
      isActive: true,
    };
    const consultationDept: Department = {
      id: this.currentId.departments++,
      name: "Consultation",
      code: "CONSULT",
      isActive: true,
    };
    
    this.departments.set(otDept.id, otDept);
    this.departments.set(consultationDept.id, consultationDept);

    // Initialize doctors
    const drJohnson: Doctor = {
      id: this.currentId.doctors++,
      name: "Dr. Sarah Johnson",
      specialty: "Cardiology",
      departmentId: consultationDept.id,
      currentToken: "C-05",
      isActive: true,
      avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    };

    const drChen: Doctor = {
      id: this.currentId.doctors++,
      name: "Dr. Michael Chen",
      specialty: "General Medicine",
      departmentId: consultationDept.id,
      currentToken: "G-18",
      isActive: true,
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    };

    this.doctors.set(drJohnson.id, drJohnson);
    this.doctors.set(drChen.id, drChen);

    // Initialize medicines
    const medicines = [
      { name: "Paracetamol 500mg", category: "Pain Relief", currentStock: 12, minimumThreshold: 20, unit: "tablets" },
      { name: "Amoxicillin 250mg", category: "Antibiotic", currentStock: 8, minimumThreshold: 15, unit: "capsules" },
      { name: "Insulin Injection", category: "Diabetes", currentStock: 3, minimumThreshold: 10, unit: "vials" },
      { name: "Aspirin 75mg", category: "Cardiovascular", currentStock: 45, minimumThreshold: 25, unit: "tablets" },
      { name: "Metformin 500mg", category: "Diabetes", currentStock: 32, minimumThreshold: 20, unit: "tablets" },
    ];

    medicines.forEach(med => {
      const medicine: Medicine = {
        id: this.currentId.medicines++,
        ...med,
      };
      this.medicines.set(medicine.id, medicine);
    });

    // Initialize some tokens
    const otToken: Token = {
      id: this.currentId.tokens++,
      number: "12",
      departmentId: otDept.id,
      doctorId: null,
      status: "active",
      createdAt: new Date(),
      completedAt: null,
    };
    this.tokens.set(otToken.id, otToken);

    for (let i = 13; i <= 20; i++) {
      const token: Token = {
        id: this.currentId.tokens++,
        number: i.toString(),
        departmentId: otDept.id,
        doctorId: null,
        status: "waiting",
        createdAt: new Date(),
        completedAt: null,
      };
      this.tokens.set(token.id, token);
    }
  }

  // Department methods
  async getAllDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values()).filter(d => d.isActive);
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = this.currentId.departments++;
    const department: Department = { 
      ...insertDepartment, 
      id,
      isActive: insertDepartment.isActive ?? true
    };
    this.departments.set(id, department);
    return department;
  }

  // Doctor methods
  async getAllDoctors(): Promise<Doctor[]> {
    return Array.from(this.doctors.values()).filter(d => d.isActive);
  }

  async getDoctorsByDepartment(departmentId: number): Promise<Doctor[]> {
    return Array.from(this.doctors.values()).filter(d => d.departmentId === departmentId && d.isActive);
  }

  async updateDoctorToken(doctorId: number, currentToken: string): Promise<Doctor> {
    const doctor = this.doctors.get(doctorId);
    if (!doctor) throw new Error("Doctor not found");
    
    doctor.currentToken = currentToken;
    this.doctors.set(doctorId, doctor);
    return doctor;
  }

  async createDoctor(insertDoctor: InsertDoctor): Promise<Doctor> {
    const id = this.currentId.doctors++;
    const doctor: Doctor = { 
      ...insertDoctor, 
      id,
      isActive: insertDoctor.isActive ?? true,
      departmentId: insertDoctor.departmentId ?? null,
      currentToken: insertDoctor.currentToken ?? null,
      avatar: insertDoctor.avatar ?? null
    };
    this.doctors.set(id, doctor);
    return doctor;
  }

  // Token methods
  async getAllTokens(): Promise<Token[]> {
    return Array.from(this.tokens.values());
  }

  async getTokensByDepartment(departmentId: number): Promise<Token[]> {
    return Array.from(this.tokens.values()).filter(t => t.departmentId === departmentId);
  }

  async getActiveTokens(): Promise<Token[]> {
    return Array.from(this.tokens.values()).filter(t => t.status === "active");
  }

  async createToken(insertToken: InsertToken): Promise<Token> {
    const id = this.currentId.tokens++;
    const token: Token = { 
      ...insertToken, 
      id,
      status: insertToken.status ?? "waiting",
      departmentId: insertToken.departmentId ?? null,
      doctorId: insertToken.doctorId ?? null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.tokens.set(id, token);
    return token;
  }

  async updateTokenStatus(tokenId: number, status: string): Promise<Token> {
    const token = this.tokens.get(tokenId);
    if (!token) throw new Error("Token not found");
    
    token.status = status;
    if (status === "completed") {
      token.completedAt = new Date();
    }
    this.tokens.set(tokenId, token);
    return token;
  }

  async getNextTokenNumber(departmentId: number): Promise<string> {
    const tokens = await this.getTokensByDepartment(departmentId);
    const numbers = tokens.map(t => parseInt(t.number) || 0);
    const maxNumber = Math.max(...numbers, 0);
    return (maxNumber + 1).toString();
  }

  // Medicine methods
  async getAllMedicines(): Promise<Medicine[]> {
    return Array.from(this.medicines.values());
  }

  async getLowStockMedicines(): Promise<Medicine[]> {
    return Array.from(this.medicines.values()).filter(m => m.currentStock <= m.minimumThreshold);
  }

  async updateMedicineStock(medicineId: number, quantity: number): Promise<Medicine> {
    const medicine = this.medicines.get(medicineId);
    if (!medicine) throw new Error("Medicine not found");
    
    medicine.currentStock += quantity;
    this.medicines.set(medicineId, medicine);
    return medicine;
  }

  async createMedicine(insertMedicine: InsertMedicine): Promise<Medicine> {
    const id = this.currentId.medicines++;
    const medicine: Medicine = { 
      ...insertMedicine, 
      id,
      currentStock: insertMedicine.currentStock ?? 0,
      minimumThreshold: insertMedicine.minimumThreshold ?? 10
    };
    this.medicines.set(id, medicine);
    return medicine;
  }

  // Emergency Alert methods
  async getActiveEmergencyAlerts(): Promise<EmergencyAlert[]> {
    return Array.from(this.emergencyAlerts.values()).filter(a => a.isActive);
  }

  async createEmergencyAlert(insertAlert: InsertEmergencyAlert): Promise<EmergencyAlert> {
    const id = this.currentId.emergencyAlerts++;
    const alert: EmergencyAlert = { 
      ...insertAlert, 
      id,
      type: insertAlert.type ?? "general",
      isActive: insertAlert.isActive ?? true,
      createdAt: new Date(),
      dismissedAt: null,
    };
    this.emergencyAlerts.set(id, alert);
    return alert;
  }

  async dismissEmergencyAlert(alertId: number): Promise<EmergencyAlert> {
    const alert = this.emergencyAlerts.get(alertId);
    if (!alert) throw new Error("Alert not found");
    
    alert.isActive = false;
    alert.dismissedAt = new Date();
    this.emergencyAlerts.set(alertId, alert);
    return alert;
  }

  // Activity Log methods
  async getRecentActivityLogs(limit: number = 10): Promise<ActivityLog[]> {
    const logs = Array.from(this.activityLogs.values());
    return logs
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentId.activityLogs++;
    const log: ActivityLog = { 
      ...insertLog, 
      id,
      departmentId: insertLog.departmentId ?? null,
      createdAt: new Date(),
    };
    this.activityLogs.set(id, log);
    return log;
  }
}

export const storage = new MemStorage();
