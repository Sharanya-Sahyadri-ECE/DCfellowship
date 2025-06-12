import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import TokenManagement from "./token-management";
import PharmacyInventory from "./pharmacy-inventory";
import SystemStatus from "./system-status";
import { AlertTriangle, Plus, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function StaffDashboard() {
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState("");
  const [emergencyType, setEmergencyType] = useState("general");
  const [addPatientDialogOpen, setAddPatientDialogOpen] = useState(false);
  const [patientDepartment, setPatientDepartment] = useState("");
  const [patientDoctor, setPatientDoctor] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch data for patient form
  const { data: departments = [] } = useQuery({ queryKey: ['/api/departments'] });
  const { data: doctors = [] } = useQuery({ queryKey: ['/api/doctors'] });

  const emergencyMutation = useMutation({
    mutationFn: async (data: { message: string; type: string }) => {
      const res = await apiRequest("POST", "/api/emergency-alerts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-alerts'] });
      setEmergencyDialogOpen(false);
      setEmergencyMessage("");
      setEmergencyType("general");
      toast({
        title: "Emergency Alert Sent",
        description: "The emergency alert has been broadcast to all displays.",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send emergency alert. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addPatientMutation = useMutation({
    mutationFn: async (data: { departmentId: number; doctorId?: number }) => {
      const res = await apiRequest("POST", "/api/tokens", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tokens'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-logs'] });
      setAddPatientDialogOpen(false);
      setPatientDepartment("");
      setPatientDoctor("");
      toast({
        title: "Patient Added",
        description: "New patient has been added to the queue successfully.",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add patient. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEmergencyAlert = () => {
    if (!emergencyMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter an emergency message.",
        variant: "destructive",
      });
      return;
    }

    emergencyMutation.mutate({
      message: emergencyMessage,
      type: emergencyType,
    });
  };

  const handleAddPatient = () => {
    if (!patientDepartment) {
      toast({
        title: "Error",
        description: "Please select a department.",
        variant: "destructive",
      });
      return;
    }

    const departmentId = parseInt(patientDepartment);
    const doctorId = patientDoctor ? parseInt(patientDoctor) : undefined;

    addPatientMutation.mutate({
      departmentId,
      doctorId,
    });
  };

  // Filter doctors by selected department
  const filteredDoctors = doctors.filter((doctor: any) => 
    patientDepartment ? doctor.departmentId === parseInt(patientDepartment) : true
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Dialog open={emergencyDialogOpen} onOpenChange={setEmergencyDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Emergency Alert</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Emergency Alert</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="alert-type">Alert Type</Label>
                  <Select value={emergencyType} onValueChange={setEmergencyType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select alert type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Alert</SelectItem>
                      <SelectItem value="code_blue">Code Blue</SelectItem>
                      <SelectItem value="fire">Fire Emergency</SelectItem>
                      <SelectItem value="evacuation">Evacuation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="alert-message">Alert Message</Label>
                  <Textarea
                    id="alert-message"
                    value={emergencyMessage}
                    onChange={(e) => setEmergencyMessage(e.target.value)}
                    placeholder="Enter emergency message..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setEmergencyDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEmergencyAlert}
                    disabled={emergencyMutation.isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {emergencyMutation.isPending ? "Sending..." : "Send Alert"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={addPatientDialogOpen} onOpenChange={setAddPatientDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4" />
                <span className="font-medium">Add Patient</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="patient-department">Department</Label>
                  <Select value={patientDepartment} onValueChange={setPatientDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept: any) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {patientDepartment && filteredDoctors.length > 0 && (
                  <div>
                    <Label htmlFor="patient-doctor">Doctor (Optional)</Label>
                    <Select value={patientDoctor} onValueChange={setPatientDoctor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select doctor (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any available doctor</SelectItem>
                        {filteredDoctors.map((doctor: any) => (
                          <SelectItem key={doctor.id} value={doctor.id.toString()}>
                            {doctor.name} - {doctor.specialty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setAddPatientDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddPatient}
                    disabled={addPatientMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {addPatientMutation.isPending ? "Adding..." : "Add Patient"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white">
            <Package className="h-4 w-4" />
            <span className="font-medium">Update Stock</span>
          </Button>

          <Button className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">Reports</span>
          </Button>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Token Management - Takes 2/3 of the space */}
        <div className="xl:col-span-2">
          <TokenManagement />
        </div>

        {/* Sidebar Components */}
        <div className="space-y-6">
          <PharmacyInventory />
          <SystemStatus />
        </div>
      </div>
    </div>
  );
}
