import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { wsManager } from "@/lib/websocket";
import { WebSocketMessage } from "@shared/schema";
import { PillBottle, AlertTriangle, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function PharmacyInventory() {
  const [selectedMedicine, setSelectedMedicine] = useState<string>("");
  const [updateQuantity, setUpdateQuantity] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch data
  const { data: medicines = [], refetch: refetchMedicines } = useQuery({ 
    queryKey: ['/api/medicines'] 
  });
  const { data: lowStockMedicines = [] } = useQuery({ 
    queryKey: ['/api/medicines/low-stock'] 
  });

  // WebSocket updates
  useEffect(() => {
    const unsubscribe = wsManager.subscribe((message: WebSocketMessage) => {
      if (message.type === 'inventory_update') {
        queryClient.invalidateQueries({ queryKey: ['/api/medicines'] });
        queryClient.invalidateQueries({ queryKey: ['/api/medicines/low-stock'] });
      }
    });

    return unsubscribe;
  }, [queryClient]);

  // Mutations
  const updateStockMutation = useMutation({
    mutationFn: async ({ medicineId, quantity }: { medicineId: number; quantity: number }) => {
      const res = await apiRequest("POST", `/api/medicines/${medicineId}/update-stock`, { quantity });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medicines'] });
      queryClient.invalidateQueries({ queryKey: ['/api/medicines/low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-logs'] });
      setSelectedMedicine("");
      setUpdateQuantity("");
      toast({
        title: "Success",
        description: "Medicine stock updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update medicine stock.",
        variant: "destructive",
      });
    },
  });

  const refreshInventoryMutation = useMutation({
    mutationFn: async () => {
      await refetchMedicines();
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory refreshed successfully.",
      });
    },
  });

  const handleUpdateStock = () => {
    if (!selectedMedicine || !updateQuantity) {
      toast({
        title: "Error",
        description: "Please select a medicine and enter quantity.",
        variant: "destructive",
      });
      return;
    }

    const quantity = parseInt(updateQuantity);
    if (isNaN(quantity)) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity.",
        variant: "destructive",
      });
      return;
    }

    updateStockMutation.mutate({
      medicineId: parseInt(selectedMedicine),
      quantity,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <PillBottle className="text-white h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pharmacy</h3>
            <p className="text-sm text-gray-600">Drug Inventory</p>
          </div>
        </div>
        <Button 
          size="sm"
          variant="outline"
          onClick={() => refreshInventoryMutation.mutate()}
          disabled={refreshInventoryMutation.isPending}
        >
          <RefreshCw className="mr-1 h-4 w-4" />
          {refreshInventoryMutation.isPending ? "Syncing..." : "Sync"}
        </Button>
      </div>
      
      {/* Low Stock Alerts */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <AlertTriangle className="text-orange-600 h-4 w-4" />
          <span className="font-medium text-gray-900">Low Stock Alerts</span>
          <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded-full">
            {lowStockMedicines.length}
          </span>
        </div>
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {lowStockMedicines.length === 0 ? (
            <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
              No low stock alerts at this time.
            </div>
          ) : (
            lowStockMedicines.map((medicine) => (
              <div key={medicine.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{medicine.name}</div>
                  <div className="text-sm text-gray-600">{medicine.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-orange-600">{medicine.currentStock}</div>
                  <div className="text-xs text-gray-600">{medicine.unit} left</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Quick Stock Update */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Quick Update</h4>
        <div className="space-y-3">
          <Select value={selectedMedicine} onValueChange={setSelectedMedicine}>
            <SelectTrigger>
              <SelectValue placeholder="Select Medicine" />
            </SelectTrigger>
            <SelectContent>
              {medicines.map((medicine) => (
                <SelectItem key={medicine.id} value={medicine.id.toString()}>
                  {medicine.name} ({medicine.currentStock} {medicine.unit})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Quantity"
              value={updateQuantity}
              onChange={(e) => setUpdateQuantity(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleUpdateStock}
              disabled={updateStockMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="mr-1 h-4 w-4" />
              {updateStockMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
