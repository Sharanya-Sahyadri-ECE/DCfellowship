import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import StaffDashboard from "@/components/staff-dashboard";
import PatientDisplay from "@/components/patient-display";
import EmergencyBanner from "@/components/emergency-banner";
import { wsManager } from "@/lib/websocket";
import { WebSocketMessage } from "@shared/schema";

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<'staff' | 'patient'>('staff');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch emergency alerts
  const { data: emergencyAlerts = [], refetch: refetchAlerts } = useQuery({
    queryKey: ['/api/emergency-alerts'],
  });

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // WebSocket message handling
  useEffect(() => {
    const unsubscribe = wsManager.subscribe((message: WebSocketMessage) => {
      console.log('Received WebSocket message:', message);
      
      switch (message.type) {
        case 'emergency_alert':
          refetchAlerts();
          break;
        case 'token_update':
        case 'inventory_update':
          // These will be handled by individual components
          break;
      }
    });

    return unsubscribe;
  }, [refetchAlerts]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Emergency Alert Banner */}
      <EmergencyBanner alerts={emergencyAlerts} />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 01-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Wenlock Hospital</h1>
                  <p className="text-sm text-gray-600">Management System</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setCurrentView('staff')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'staff'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Staff Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('patient')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'patient'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                  Patient Display
                </button>
              </div>
              
              {/* Time Display */}
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{formatTime(currentTime)}</div>
                <div className="text-xs text-gray-500">{formatDate(currentTime)}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {currentView === 'staff' ? <StaffDashboard /> : <PatientDisplay />}
    </div>
  );
}
