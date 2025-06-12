import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { wsManager } from "@/lib/websocket";
import { WebSocketMessage, Doctor, Token, Medicine, ActivityLog } from "@shared/schema";
import { Clock, Stethoscope, Activity, PillBottle, Info, VenetianMask, Phone } from "lucide-react";

export default function PatientDisplay() {
  const [liveData, setLiveData] = useState<{
    doctors: Doctor[];
    tokens: Token[];
    medicines: Medicine[];
    logs: ActivityLog[];
  }>({
    doctors: [],
    tokens: [],
    medicines: [],
    logs: [],
  });

  // Fetch initial data
  const { data: doctors = [] } = useQuery({ queryKey: ['/api/doctors'] });
  const { data: tokens = [] } = useQuery({ queryKey: ['/api/tokens'] });
  const { data: medicines = [] } = useQuery({ queryKey: ['/api/medicines'] });
  const { data: logs = [] } = useQuery({ queryKey: ['/api/activity-logs'] });

  // Update live data when queries load - using refs to prevent infinite loops
  useEffect(() => {
    if (doctors.length > 0 || tokens.length > 0 || medicines.length > 0 || logs.length > 0) {
      setLiveData({ doctors, tokens, medicines, logs });
    }
  }, [doctors.length, tokens.length, medicines.length, logs.length]);

  // WebSocket updates
  useEffect(() => {
    const unsubscribe = wsManager.subscribe((message: WebSocketMessage) => {
      if (message.type === 'connection_status' && message.data.departments) {
        // Full data update
        setLiveData({
          doctors: message.data.doctors || [],
          tokens: message.data.tokens || [],
          medicines: message.data.medicines || [],
          logs: message.data.logs || [],
        });
      }
    });

    return unsubscribe;
  }, []);

  // Get current OT token
  const otTokens = liveData.tokens.filter(t => t.departmentId === 1); // Assuming OT is department 1
  const currentOTToken = otTokens.find(t => t.status === 'active');
  const waitingOTTokens = otTokens.filter(t => t.status === 'waiting').slice(0, 3);
  const completedOTToday = otTokens.filter(t => t.status === 'completed').length;

  // Get active doctors
  const activeDoctors = liveData.doctors.filter(d => d.isActive);

  // Get upcoming consultation tokens
  const consultationTokens = liveData.tokens.filter(t => t.departmentId === 2); // Assuming Consultation is department 2
  const upcomingConsultationTokens = consultationTokens.filter(t => t.status === 'waiting').slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Current Token Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OT Display */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Activity className="text-white text-2xl h-8 w-8" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Operation Theatre</h2>
          <p className="text-gray-600 mb-8">Current Token Being Served</p>
          
          <div className="mb-8">
            <div className="text-6xl font-bold text-blue-600 mb-2">
              {currentOTToken?.number || "0"}
            </div>
            <div className="text-lg text-gray-600">Token Number</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {otTokens.filter(t => t.status === 'waiting').length}
              </div>
              <div className="text-sm text-gray-600">Waiting</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedOTToday}</div>
              <div className="text-sm text-gray-600">Completed Today</div>
            </div>
          </div>
        </div>
        
        {/* Consultation Display */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <Stethoscope className="text-white text-2xl h-8 w-8" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Consultation</h2>
          <p className="text-gray-600 mb-8 text-center">Active Doctors</p>
          
          {/* Doctor Status Cards */}
          <div className="space-y-4">
            {activeDoctors.map((doctor) => (
              <div key={doctor.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-4 mb-3">
                  {doctor.avatar && (
                    <img 
                      src={doctor.avatar} 
                      alt={doctor.name} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{doctor.name}</div>
                    <div className="text-sm text-gray-600">{doctor.specialty}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{doctor.currentToken}</div>
                    <div className="text-xs text-gray-600">Current</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Upcoming Tokens & Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Tokens */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Tokens</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OT Queue */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <Activity className="text-blue-600 mr-2 h-4 w-4" />
                Operation Theatre
              </h4>
              <div className="space-y-2">
                {waitingOTTokens.map((token, index) => (
                  <div key={token.id} className={`flex items-center justify-between p-3 rounded-lg ${
                    index === 0 ? 'bg-blue-50' : 'bg-gray-50'
                  }`}>
                    <span className="font-medium">{token.number}</span>
                    <span className="text-sm text-gray-600">
                      ~{(index + 1) * 15} min
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Consultation Queue */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <Stethoscope className="text-green-600 mr-2 h-4 w-4" />
                Consultation
              </h4>
              <div className="space-y-2">
                {upcomingConsultationTokens.map((token, index) => {
                  const doctor = activeDoctors.find(d => d.id === token.doctorId);
                  return (
                    <div key={token.id} className={`flex items-center justify-between p-3 rounded-lg ${
                      index < 2 ? 'bg-green-50' : 'bg-gray-50'
                    }`}>
                      <span className="font-medium">{token.number}</span>
                      <span className="text-sm text-gray-600">
                        {doctor ? doctor.name.split(' ')[1] : 'TBD'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Hospital Information */}
        <div className="space-y-6">
          {/* Pharmacy Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PillBottle className="text-green-600 mr-2 h-5 w-5" />
              Pharmacy Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Service Status</span>
                <span className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span className="text-sm font-medium text-green-600">Open</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Wait</span>
                <span className="text-sm font-medium text-gray-900">5-10 min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Medicines Available</span>
                <span className="text-sm font-medium text-green-600">Most items</span>
              </div>
            </div>
          </div>
          
          {/* General Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Information</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <Info className="mt-0.5 text-blue-600 h-4 w-4" />
                <span>Please arrive 15 minutes before your scheduled time</span>
              </div>
              <div className="flex items-start space-x-2">
                <VenetianMask className="mt-0.5 text-blue-600 h-4 w-4" />
                <span>Face masks are required in all hospital areas</span>
              </div>
              <div className="flex items-start space-x-2">
                <Phone className="mt-0.5 text-blue-600 h-4 w-4" />
                <span>Keep mobile phones on silent mode</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Live Updates Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Clock className="text-blue-600 mr-2 h-5 w-5" />
          Live Updates
        </h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {liveData.logs.slice(0, 10).map((log) => (
            <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                log.type === 'emergency' ? 'bg-red-600' :
                log.type === 'token_update' ? 'bg-blue-600' :
                log.type === 'inventory_update' ? 'bg-orange-600' :
                'bg-green-600'
              }`}></div>
              <div className="flex-1">
                <div className="text-sm text-gray-900">{log.message}</div>
                <div className="text-xs text-gray-500">
                  {log.createdAt ? new Date(log.createdAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  }) : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
