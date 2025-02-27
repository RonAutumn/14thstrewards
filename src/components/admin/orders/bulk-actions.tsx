"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface BulkActionsProps {
  selectedOrders: string[];
  onComplete?: () => void;
}

export function BulkActions({ selectedOrders, onComplete }: BulkActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const queryClient = useQueryClient();

  const handleAction = async (action: string) => {
    if (selectedOrders.length === 0) {
      toast.error("No orders selected");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: action })
        .in("id", selectedOrders);

      if (error) throw error;

      toast.success(`Successfully updated ${selectedOrders.length} orders`);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onComplete?.();
    } catch (error) {
      console.error("Error updating orders:", error);
      toast.error("Failed to update orders");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={selectedOrders.length === 0 || isLoading}
        >
          Bulk Actions ({selectedOrders.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleAction("processing")}>
          Mark as Processing
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction("completed")}>
          Mark as Completed
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction("cancelled")}>
          Mark as Cancelled
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
