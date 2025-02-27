"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DeliveryClient } from "@/features/delivery/delivery.client";

interface TimeWindow {
  startTime: string;
  endTime: string;
  maxOrders: number;
}

interface DeliveryCalendarProps {
  zipCode: string;
  onSelect: (
    date: Date,
    timeSlot: { startTime: string; endTime: string }
  ) => void;
  selectedDate?: Date;
  selectedTimeSlot?: { startTime: string; endTime: string };
  showLabels?: boolean;
}

export function DeliveryCalendar({
  zipCode,
  onSelect,
  selectedDate,
  selectedTimeSlot,
  showLabels = false,
}: DeliveryCalendarProps) {
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [timeWindows, setTimeWindows] = useState<TimeWindow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available dates when component mounts or zip code changes
  useEffect(() => {
    const fetchAvailableDates = async () => {
      if (!zipCode || zipCode.length !== 5) return;

      setIsLoading(true);
      try {
        const dates = await DeliveryClient.getAvailableDates(
          zipCode,
          new Date()
        );
        // Convert string dates to Date objects and ensure they're in local timezone
        const parsedDates = dates.map((date) => {
          const d = new Date(date);
          // Reset time to midnight in local timezone
          d.setHours(0, 0, 0, 0);
          return d;
        });
        console.log("Available dates:", parsedDates); // Debug log
        setAvailableDates(parsedDates);
      } catch (error) {
        console.error("Error fetching available dates:", error);
        setError("Failed to fetch available dates");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableDates();
  }, [zipCode]);

  // Fetch time windows when date changes
  useEffect(() => {
    const fetchDeliveryData = async () => {
      if (!zipCode || zipCode.length !== 5 || !selectedDate) return;

      setIsLoading(true);
      try {
        const slots = await DeliveryClient.getAvailableTimeSlots(
          selectedDate,
          zipCode
        );
        setTimeWindows(slots);
      } catch (error) {
        console.error("Error fetching delivery data:", error);
        setError("Failed to fetch delivery information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeliveryData();
  }, [zipCode, selectedDate]);

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date || !zipCode || zipCode.length !== 5) return;

    setIsLoading(true);
    try {
      // Get available time slots for the selected date and zip code
      const slots = await DeliveryClient.getAvailableTimeSlots(date, zipCode);
      setTimeWindows(slots);

      // If there are available slots, select the first one by default
      if (slots.length > 0) {
        onSelect(date, {
          startTime: slots[0].startTime,
          endTime: slots[0].endTime,
        });
      }
    } catch (error) {
      console.error("Error fetching time slots:", error);
      setError("Failed to fetch available time slots");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeSelect = (startTime: string) => {
    if (!selectedDate) return;

    const selectedWindow = timeWindows.find(
      (window) => window.startTime === startTime
    );
    if (selectedWindow) {
      onSelect(selectedDate, {
        startTime: selectedWindow.startTime,
        endTime: selectedWindow.endTime,
      });
    }
  };

  const isDateAvailable = (date: Date) => {
    return availableDates.some((availableDate) => {
      // Compare dates by converting them to local date strings
      return date.toLocaleDateString() === availableDate.toLocaleDateString();
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        {showLabels && <Label>Delivery Date</Label>}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
              disabled={isLoading}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? (
                format(selectedDate, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today || !isDateAvailable(date);
              }}
              modifiers={{
                available: (date) => isDateAvailable(date),
              }}
              modifiersClassNames={{
                available:
                  "bg-green-600 text-white font-medium hover:bg-green-700 cursor-pointer rounded-md",
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
                  "text-muted-foreground opacity-50" // Make unavailable dates more muted
                ),
                day_selected:
                  "bg-green-700 text-white hover:bg-green-800 hover:text-white focus:bg-green-800 focus:text-white rounded-md",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "opacity-25", // Make outside dates even more muted
                day_disabled: "opacity-25 cursor-not-allowed", // Make disabled dates more muted
                day_hidden: "invisible",
                day_range_middle:
                  "aria-selected:bg-accent aria-selected:text-accent-foreground",
              }}
              initialFocus
            />
            {availableDates.length === 0 && !isLoading && (
              <div className="p-3 text-center text-sm text-muted-foreground">
                No delivery dates available for this ZIP code.
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {selectedDate && (
        <div className="grid gap-2">
          {showLabels && <Label>Delivery Time</Label>}
          <Select
            value={selectedTimeSlot?.startTime}
            onValueChange={handleTimeSelect}
            disabled={isLoading || timeWindows.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a time slot" />
            </SelectTrigger>
            <SelectContent>
              {timeWindows.map((window) => (
                <SelectItem key={window.startTime} value={window.startTime}>
                  {format(
                    new Date(`2000-01-01T${window.startTime}:00`),
                    "h:mm a"
                  )}
                  {" - "}
                  {format(
                    new Date(`2000-01-01T${window.endTime}:00`),
                    "h:mm a"
                  )}{" "}
                  ({window.maxOrders}{" "}
                  {window.maxOrders === 1 ? "slot" : "slots"} available)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
