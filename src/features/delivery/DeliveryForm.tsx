"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DeliveryClient, Borough, TimeWindow } from "./delivery.client";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import type { HTMLAttributes } from "react";

export const DeliveryForm = ({ borough = "Manhattan" as Borough }) => {
  const [deliveryDate, setDeliveryDate] = useState<Date>(new Date());
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeWindow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingWindow, setEditingWindow] = useState<TimeWindow | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        setIsLoading(true);
        const startDate = new Date();
        const dates = await DeliveryClient.getAvailableDates(
          borough,
          startDate
        );
        setAvailableDates(dates);
      } catch (error) {
        console.error("Failed to fetch available dates:", error);
        toast({
          title: "Error",
          description: "Failed to fetch available dates",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableDates();
  }, [borough]);

  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (deliveryDate) {
        try {
          const slots = await DeliveryClient.getAvailableTimeSlots(
            deliveryDate,
            borough
          );
          setTimeSlots(slots);
        } catch (error) {
          console.error("Failed to fetch time slots:", error);
          toast({
            title: "Error",
            description: "Failed to fetch time slots",
            variant: "destructive",
          });
        }
      }
    };

    const currentDateStr = deliveryDate.toISOString().split("T")[0];
    // Only fetch if date changed and there wasn't a recent update
    if (currentDateStr !== lastUpdate) {
      fetchTimeSlots();
    }
  }, [deliveryDate, borough, lastUpdate]);

  const handleEditWindow = async (window: TimeWindow) => {
    try {
      const currentDateStr = deliveryDate.toISOString().split("T")[0];
      const updatedWindows = timeSlots.map((w) =>
        w === editingWindow ? { ...window, date: currentDateStr } : w
      );

      const result = await DeliveryClient.updateDeliveryWindows(
        borough,
        updatedWindows
      );
      setTimeSlots(result);
      setIsEditDialogOpen(false);
      setEditingWindow(null);
      setLastUpdate(currentDateStr);

      toast({
        title: "Success",
        description: "Delivery window updated successfully",
      });
    } catch (error) {
      console.error("Failed to update delivery window:", error);
      toast({
        title: "Error",
        description: "Failed to update delivery window",
        variant: "destructive",
      });
    }
  };

  const handleRemoveWindow = async (window: TimeWindow) => {
    try {
      const currentDateStr = deliveryDate.toISOString().split("T")[0];
      const updatedWindows = timeSlots.filter((w) => w !== window);

      const result = await DeliveryClient.updateDeliveryWindows(
        borough,
        updatedWindows
      );
      setTimeSlots(result);
      setLastUpdate(currentDateStr);

      toast({
        title: "Success",
        description: "Delivery window removed successfully",
      });
    } catch (error) {
      console.error("Failed to remove delivery window:", error);
      toast({
        title: "Error",
        description: "Failed to remove delivery window",
        variant: "destructive",
      });
    }
  };

  const isDateAvailable = (date: Date) => {
    return availableDates.some(
      (availableDate) =>
        availableDate.toISOString().split("T")[0] ===
        date.toISOString().split("T")[0]
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border-border shadow-none rounded-lg border">
        <Calendar
          mode="single"
          selected={deliveryDate}
          onSelect={(date) => date && setDeliveryDate(date)}
          className="w-full"
          disabled={(date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date < today || !isDateAvailable(date);
          }}
          classNames={{
            months:
              "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              "h-7 w-7 bg-transparent p-0 hover:opacity-100",
              "opacity-50 hover:opacity-100"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "grid grid-cols-7",
            head_cell:
              "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
            row: "grid grid-cols-7 mt-2",
            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: cn(
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
              "hover:bg-accent hover:text-accent-foreground",
              "focus:bg-accent focus:text-accent-foreground",
              isLoading ? "opacity-50" : "text-muted-foreground"
            ),
            day_selected:
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
            day_hidden: "invisible",
          }}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Available Time Slots</h3>
        <div className="grid gap-2">
          {timeSlots.map((window, index) => (
            <Card key={index}>
              <CardContent className="flex items-center justify-between p-4">
                <span>
                  {window.startTime} - {window.endTime}
                </span>
                <div className="flex gap-2">
                  <Dialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setEditingWindow(window)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Delivery Window</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <Input
                              type="time"
                              defaultValue={editingWindow?.startTime}
                              onChange={(e) =>
                                setEditingWindow((prev) => ({
                                  ...prev!,
                                  startTime: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="flex-1">
                            <Input
                              type="time"
                              defaultValue={editingWindow?.endTime}
                              onChange={(e) =>
                                setEditingWindow((prev) => ({
                                  ...prev!,
                                  endTime: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() =>
                            editingWindow && handleEditWindow(editingWindow)
                          }
                        >
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveWindow(window)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
