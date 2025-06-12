import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";
import { wsManager } from "@/lib/websocket";
import { WebSocketMessage } from "@shared/schema";
import { Activity, Stethoscope, SkipForward, RotateCcw, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function TokenManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch data
  const { data: departments = [] } = useQuery({ queryKey: ['/api/departments'] });
  const { data: doctors = [] } = useQuery({ queryKey: ['/api/doctors'] });
  const { data: tokens = [] } = useQuery({ queryKey: ['/api/tokens'] });

  // WebSocket updates
  useEffect(() => {
    const unsubscribe = wsManager.subscribe((message: WebSocketMessage) => {
      if (message.type === 'token_update') {
        queryClient.invalidateQueries({ queryKey: ['/api/tokens'] });
        queryClient.invalidateQueries({ queryKey: ['/api/doctors'] });
      }
    });

    return unsubscribe;
  }, [queryClient]);

  // Get departments
  const otDept = departments.find(d => d.code === 'OT');
  const consultationDept = departments.find(d => d.code === 'CONSULT');

  // Get OT tokens
  const otTokens = tokens.filter(t => t.departmentId === otDept?.id);
  const currentOTToken = otTokens.find(t => t.status === 'active');
  const waitingOTCount = otTokens.filter(t => t.status === 'waiting').length;

  // Get consultation doctors
  const consultationDoctors = doctors.filter(d => d.departmentId === consultationDept?.id && d.isActive);

  // Mutations
  const nextOTTokenMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tokens/ot/next");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tokens'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-logs'] });
      toast({
        title: "Success",
        description: "OT token advanced successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to advance OT token.",
        variant: "destructive",
      });
    },
  });

  const resetOTQueueMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tokens/ot/reset");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tokens'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-logs'] });
      toast({
        title: "Success",
        description: "OT queue reset successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset OT queue.",
        variant: "destructive",
      });
    },
  });

  const nextConsultationTokenMutation = useMutation({
    mutationFn: async (doctorId: number) => {
      const res = await apiRequest("POST", `/api/doctors/${doctorId}/next-token`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-logs'] });
      toast({
        title: "Success",
        description: "Consultation token advanced successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to advance consultation token.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* OT Token Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="text-white h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Operation Theatre</h3>
              <p className="text-sm text-gray-600">Token Queue Management</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-full">
              <div className="w-2 h-2 bg-white rounded-full inline-block mr-1"></div>
              Active
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">
              {currentOTToken?.number || "0"}
            </div>
            <div className="text-sm text-gray-600">Current Token</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-orange-600">{waitingOTCount}</div>
            <div className="text-sm text-gray-600">Waiting</div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => nextOTTokenMutation.mutate()}
            disabled={nextOTTokenMutation.isPending}
          >
            <SkipForward className="mr-2 h-4 w-4" />
            {nextOTTokenMutation.isPending ? "Processing..." : "Next Token"}
          </Button>
          <Button 
            variant="secondary"
            className="flex-1"
            onClick={() => resetOTQueueMutation.mutate()}
            disabled={resetOTQueueMutation.isPending}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {resetOTQueueMutation.isPending ? "Resetting..." : "Reset Queue"}
          </Button>
        </div>
      </div>
      
      {/* Consultation Token Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="text-white h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Consultation</h3>
              <p className="text-sm text-gray-600">Multiple Doctors Available</p>
            </div>
          </div>
        </div>
        
        {/* Doctor-wise Token Display */}
        <div className="space-y-4">
          {consultationDoctors.map((doctor) => (
            <div key={doctor.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {doctor.avatar && (
                    <img 
                      src={doctor.avatar} 
                      alt={doctor.name} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{doctor.name}</div>
                    <div className="text-sm text-gray-600">{doctor.specialty}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{doctor.currentToken}</div>
                  <div className="text-sm text-gray-600">Current</div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm"
                  onClick={() => nextConsultationTokenMutation.mutate(doctor.id)}
                  disabled={nextConsultationTokenMutation.isPending}
                >
                  {nextConsultationTokenMutation.isPending ? "Processing..." : "Next Patient"}
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className="px-3"
                >
                  <Pause className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
