import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { EmergencyAlert } from "@shared/schema";
import { AlertTriangle, X } from "lucide-react";

interface EmergencyBannerProps {
  alerts: EmergencyAlert[];
}

export default function EmergencyBanner({ alerts }: EmergencyBannerProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  const dismissMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const res = await apiRequest("POST", `/api/emergency-alerts/${alertId}/dismiss`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-alerts'] });
    },
  });

  const handleDismiss = (alertId: number) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    dismissMutation.mutate(alertId);
  };

  const activeAlerts = alerts.filter(alert => 
    alert.isActive && !dismissedAlerts.has(alert.id)
  );

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {activeAlerts.map((alert) => (
        <div key={alert.id} className="bg-red-600 text-white px-4 py-3 shadow-lg">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">{alert.message}</span>
            </div>
            <button
              onClick={() => handleDismiss(alert.id)}
              className="text-white hover:text-gray-200 transition-colors"
              disabled={dismissMutation.isPending}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
