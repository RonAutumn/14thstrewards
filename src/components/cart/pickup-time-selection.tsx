"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface TimeSlot {
  startTime: string;
  endTime: string;
  maxOrders: number;
  currentOrders: number;
  isAvailable: boolean;
}

interface PickupTimeSelectionProps {
  onPickupSelected: (pickup: {
    date: Date;
    timeSlot: { startTime: string; endTime: string };
  }) => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export function PickupTimeSelection({
  onPickupSelected,
}: PickupTimeSelectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [storeSchedule, setStoreSchedule] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());

  // Fetch store settings and available dates when component mounts
  useEffect(() => {
    const fetchStoreSettings = async (retryAttempt = 0) => {
      try {
        setIsLoading(true);
        setError(undefined);

        console.log("Fetching store settings...");
        const response = await fetch(
          "/api/pickup/settings?storeId=default-store",
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          console.error("Settings response not OK:", response.status);
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        const data = await response.json();
        console.log("Store settings received:", data.settings);

        if (!data.settings) {
          throw new Error("No settings data received");
        }

        setStoreSchedule(data.settings);
        await fetchAvailableDates(data.settings);
        setRetryCount(0);
      } catch (error) {
        console.error("Error fetching store settings:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load store settings"
        );
        setStoreSchedule(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreSettings();
  }, [retryCount]);

  const fetchAvailableDates = async (settings: any) => {
    console.log("Fetching available dates with settings:", settings);
    const now = new Date();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + (settings.advanceBookingDays || 7));

    const dates = new Set<string>();
    const currentDate = new Date(now);

    while (currentDate <= maxDate) {
      const isAvailable = await checkDateAvailability(
        new Date(currentDate),
        settings
      );
      console.log(
        `Checking date ${currentDate.toDateString()}: ${isAvailable}`
      );
      if (isAvailable) {
        dates.add(currentDate.toDateString());
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log("Final available dates:", Array.from(dates));
    setAvailableDates(dates);
  };

  const checkDateAvailability = async (date: Date, settings: any) => {
    // Basic validation checks
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (!settings.isPickupEnabled || compareDate < today) {
      console.log("Date not available - pickup disabled or past date:", {
        date: compareDate.toISOString(),
        today: today.toISOString(),
        isEnabled: settings.isPickupEnabled,
      });
      return false;
    }

    const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });
    console.log(
      "Checking schedule for:",
      dayOfWeek,
      "Schedule:",
      settings.schedule
    );

    const daySchedule = settings.schedule?.find(
      (s: any) => s.day_of_week === dayOfWeek
    );

    console.log("Found day schedule:", daySchedule);

    if (!daySchedule?.is_open) {
      console.log("Day is not open:", { date, dayOfWeek, daySchedule });
      return false;
    }

    const isHoliday = settings.holidayDates?.some(
      (h: any) =>
        new Date(h.date).toDateString() === date.toDateString() && !h.is_open
    );

    if (isHoliday) {
      console.log("Date is a holiday:", { date });
      return false;
    }

    // Check time slots availability
    try {
      console.log("Fetching slots for date:", date.toISOString());
      const response = await fetch(
        `/api/pickup/slots?storeId=default-store&date=${date.toISOString()}`
      );

      if (!response.ok) {
        console.error("Slots response not OK:", response.status);
        return false;
      }

      const data = await response.json();
      console.log("Received slots data:", data);

      const hasAvailableSlots =
        data.slots?.some((slot: TimeSlot) => slot.isAvailable) ?? false;

      console.log("Slots availability result:", {
        date: date.toDateString(),
        hasAvailableSlots,
        slotsCount: data.slots?.length ?? 0,
      });

      return hasAvailableSlots;
    } catch (error) {
      console.error("Error checking slots availability:", error);
      return false;
    }
  };

  const isDateAvailable = (date: Date) => {
    const dateString = date.toDateString();
    const isAvailable = availableDates.has(dateString);
    console.log(`Checking calendar date ${dateString}: ${isAvailable}`);
    return isAvailable;
  };

  useEffect(() => {
    if (selectedDate) {
      loadTimeSlots(selectedDate);
    }
  }, [selectedDate]);

  const loadTimeSlots = async (date: Date) => {
    try {
      setIsLoading(true);
      setError(undefined);
      setSelectedTimeSlot(undefined);

      const response = await fetch(
        `/api/pickup/slots?storeId=default-store&date=${date.toISOString()}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load time slots");
      }

      const data = await response.json();
      console.log("API Response:", data);

      if (!data.slots) {
        console.error("No slots array in response:", data);
        throw new Error("Invalid response format");
      }

      const slots = data.slots.map((slot: any) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxOrders: slot.maxOrders,
        currentOrders: slot.currentOrders,
        isAvailable: slot.isAvailable,
      }));

      console.log("Processed slots:", slots);
      setTimeSlots(slots);
    } catch (error) {
      console.error("Error loading time slots:", error);
      setError("Failed to load available time slots");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      console.log("Selected date:", date);
      setSelectedDate(date);
    }
  };

  const handleTimeSelect = async (startTime: string) => {
    console.log("Selected time:", startTime);
    const slot = timeSlots.find((s) => s.startTime === startTime);
    console.log("Found slot:", slot);
    if (!slot || !selectedDate) return;

    try {
      setIsLoading(true);
      setError(undefined);

      setSelectedTimeSlot(slot);
      onPickupSelected({
        date: selectedDate,
        timeSlot: {
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
      });
    } catch (error) {
      console.error("Error selecting time slot:", error);
      setError(
        error instanceof Error ? error.message : "Failed to select time slot"
      );
      setSelectedTimeSlot(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Pickup Time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Pickup Date</Label>
          {isLoading && !availableDates.size ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => {
                // Always disable dates if we're still loading available dates
                if (isLoading && !availableDates.size) {
                  return true;
                }
                return !isDateAvailable(date);
              }}
              defaultMonth={new Date()}
              fromDate={new Date()}
              toDate={(() => {
                const maxDate = new Date();
                maxDate.setDate(
                  maxDate.getDate() + (storeSchedule?.advanceBookingDays || 7)
                );
                return maxDate;
              })()}
              className="rounded-md border"
            />
          )}
        </div>

        {selectedDate && !isLoading && (
          <div className="grid gap-2">
            <Label>Pickup Time</Label>
            <Select
              onValueChange={handleTimeSelect}
              value={selectedTimeSlot?.startTime}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No time slots available
                  </SelectItem>
                ) : (
                  timeSlots.map((slot) => (
                    <SelectItem
                      key={slot.startTime}
                      value={slot.startTime}
                      disabled={!slot.isAvailable}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {format(
                            new Date(`2000-01-01T${slot.startTime}`),
                            "h:mm a"
                          )}{" "}
                          -{" "}
                          {format(
                            new Date(`2000-01-01T${slot.endTime}`),
                            "h:mm a"
                          )}
                        </span>
                        {slot.maxOrders - slot.currentOrders < 3 && (
                          <Badge variant="secondary" className="ml-2">
                            {slot.maxOrders - slot.currentOrders} slots left
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
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
      </CardContent>
    </Card>
  );
}
