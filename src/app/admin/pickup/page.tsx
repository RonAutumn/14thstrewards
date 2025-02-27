"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

interface TimeSlot {
  startTime: string;
  endTime: string;
  maxOrders: number;
  currentOrders: number;
  isAvailable: boolean;
}

interface DaySchedule {
  dayOfWeek: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  timeSlots: TimeSlot[];
  maxOrdersPerSlot: number;
  slotDuration: number;
}

interface PickupSettings {
  storeId: string;
  isPickupEnabled: boolean;
  defaultMaxOrdersPerSlot: number;
  defaultSlotDuration: number;
  advanceBookingDays: number;
  minAdvanceBookingHours: number;
  schedule: DaySchedule[];
  holidayDates: {
    date: Date;
    reason?: string;
    isOpen: boolean;
  }[];
  specialHours: {
    date: Date;
    openTime: string;
    closeTime: string;
    reason?: string;
  }[];
}

export default function PickupManagementPage() {
  const [settings, setSettings] = useState<PickupSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showHolidayDialog, setShowHolidayDialog] = useState(false);
  const [showSpecialHoursDialog, setShowSpecialHoursDialog] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DaySchedule | null>(null);
  const { toast } = useToast();

  // Form states
  const [holidayDate, setHolidayDate] = useState<Date>();
  const [holidayReason, setHolidayReason] = useState("");
  const [holidayIsOpen, setHolidayIsOpen] = useState(false);
  const [specialDate, setSpecialDate] = useState<Date>();
  const [specialOpenTime, setSpecialOpenTime] = useState("10:00");
  const [specialCloseTime, setSpecialCloseTime] = useState("20:00");
  const [specialReason, setSpecialReason] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        "/api/pickup/settings?storeId=default-store"
      );
      if (!response.ok) throw new Error("Failed to load settings");
      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({
        title: "Error",
        description: "Failed to load pickup settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSchedule = async (day: DaySchedule) => {
    try {
      const response = await fetch("/api/pickup/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: "default-store",
          schedule: settings?.schedule.map((d) =>
            d.dayOfWeek === day.dayOfWeek ? day : d
          ),
        }),
      });

      if (!response.ok) throw new Error("Failed to update schedule");

      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });

      await loadSettings();
      setShowScheduleDialog(false);
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive",
      });
    }
  };

  const handleAddHoliday = async () => {
    if (!holidayDate) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedHolidays = [
        ...(settings?.holidayDates || []),
        {
          date: holidayDate,
          reason: holidayReason,
          isOpen: holidayIsOpen,
        },
      ];

      const response = await fetch("/api/pickup/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: "default-store",
          holidays: updatedHolidays,
        }),
      });

      if (!response.ok) throw new Error("Failed to add holiday");

      toast({
        title: "Success",
        description: "Holiday added successfully",
      });

      await loadSettings();
      setShowHolidayDialog(false);
      setHolidayDate(undefined);
      setHolidayReason("");
      setHolidayIsOpen(false);
    } catch (error) {
      console.error("Error adding holiday:", error);
      toast({
        title: "Error",
        description: "Failed to add holiday",
        variant: "destructive",
      });
    }
  };

  const handleAddSpecialHours = async () => {
    if (!specialDate) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedSpecialHours = [
        ...(settings?.specialHours || []),
        {
          date: specialDate,
          openTime: specialOpenTime,
          closeTime: specialCloseTime,
          reason: specialReason,
        },
      ];

      const response = await fetch("/api/pickup/special-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: "default-store",
          specialHours: updatedSpecialHours,
        }),
      });

      if (!response.ok) throw new Error("Failed to add special hours");

      toast({
        title: "Success",
        description: "Special hours added successfully",
      });

      await loadSettings();
      setShowSpecialHoursDialog(false);
      setSpecialDate(undefined);
      setSpecialOpenTime("10:00");
      setSpecialCloseTime("20:00");
      setSpecialReason("");
    } catch (error) {
      console.error("Error adding special hours:", error);
      toast({
        title: "Error",
        description: "Failed to add special hours",
        variant: "destructive",
      });
    }
  };

  const handleDeleteHoliday = async (date: Date) => {
    try {
      const updatedHolidays = settings?.holidayDates.filter(
        (h) => h.date.toString() !== date.toString()
      );

      const response = await fetch("/api/pickup/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: "default-store",
          holidays: updatedHolidays,
        }),
      });

      if (!response.ok) throw new Error("Failed to delete holiday");

      toast({
        title: "Success",
        description: "Holiday deleted successfully",
      });

      await loadSettings();
    } catch (error) {
      console.error("Error deleting holiday:", error);
      toast({
        title: "Error",
        description: "Failed to delete holiday",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSpecialHours = async (date: Date) => {
    try {
      const updatedSpecialHours = settings?.specialHours.filter(
        (h) => h.date.toString() !== date.toString()
      );

      const response = await fetch("/api/pickup/special-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: "default-store",
          specialHours: updatedSpecialHours,
        }),
      });

      if (!response.ok) throw new Error("Failed to delete special hours");

      toast({
        title: "Success",
        description: "Special hours deleted successfully",
      });

      await loadSettings();
    } catch (error) {
      console.error("Error deleting special hours:", error);
      toast({
        title: "Error",
        description: "Failed to delete special hours",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Pickup Management</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="pickup-enabled">Pickup Enabled</Label>
              <Switch
                id="pickup-enabled"
                checked={settings?.isPickupEnabled}
                onCheckedChange={async (checked) => {
                  try {
                    const response = await fetch("/api/pickup/settings", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        storeId: "default-store",
                        isPickupEnabled: checked,
                      }),
                    });

                    if (!response.ok)
                      throw new Error("Failed to update status");

                    toast({
                      title: "Success",
                      description: `Pickup ${
                        checked ? "enabled" : "disabled"
                      } successfully`,
                    });

                    await loadSettings();
                  } catch (error) {
                    console.error("Error updating pickup status:", error);
                    toast({
                      title: "Error",
                      description: "Failed to update pickup status",
                      variant: "destructive",
                    });
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="slot-duration">Default Slot Duration (min)</Label>
              <Input
                id="slot-duration"
                type="number"
                min="15"
                step="15"
                className="w-24"
                value={settings?.defaultSlotDuration}
                onChange={async (e) => {
                  try {
                    const duration = parseInt(e.target.value);
                    if (duration < 15) return;

                    const response = await fetch("/api/pickup/settings", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        storeId: "default-store",
                        defaultSlotDuration: duration,
                      }),
                    });

                    if (!response.ok)
                      throw new Error("Failed to update slot duration");

                    toast({
                      title: "Success",
                      description: "Slot duration updated successfully",
                    });

                    await loadSettings();
                  } catch (error) {
                    console.error("Error updating slot duration:", error);
                    toast({
                      title: "Error",
                      description: "Failed to update slot duration",
                      variant: "destructive",
                    });
                  }
                }}
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="schedule" className="space-y-4">
          <TabsList>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="holidays">Holidays</TabsTrigger>
            <TabsTrigger value="special">Special Hours</TabsTrigger>
            <TabsTrigger value="slots">Time Slots</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings?.schedule.map((day) => (
                    <TableRow key={day.dayOfWeek}>
                      <TableCell>{day.dayOfWeek}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            day.isOpen
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {day.isOpen ? "Open" : "Closed"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {day.isOpen
                          ? `${day.openTime} - ${day.closeTime}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedDay(day);
                            setShowScheduleDialog(true);
                          }}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="holidays">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowHolidayDialog(true)}>
                Add Holiday
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings?.holidayDates.map((holiday) => (
                    <TableRow key={holiday.date.toString()}>
                      <TableCell>
                        {format(new Date(holiday.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{holiday.reason}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            holiday.isOpen
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {holiday.isOpen ? "Open" : "Closed"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteHoliday(holiday.date)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="special">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowSpecialHoursDialog(true)}>
                Add Special Hours
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings?.specialHours.map((special) => (
                    <TableRow key={special.date.toString()}>
                      <TableCell>
                        {format(new Date(special.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        {special.openTime} - {special.closeTime}
                      </TableCell>
                      <TableCell>{special.reason}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteSpecialHours(special.date)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="slots">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Time Slots Overview</h2>
                <div className="flex items-center gap-2">
                  <Label htmlFor="max-orders">
                    Default Max Orders per Slot
                  </Label>
                  <Input
                    id="max-orders"
                    type="number"
                    min="1"
                    className="w-24"
                    value={settings?.defaultMaxOrdersPerSlot}
                    onChange={async (e) => {
                      try {
                        const maxOrders = parseInt(e.target.value);
                        if (maxOrders < 1) return;

                        const response = await fetch("/api/pickup/settings", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            storeId: "default-store",
                            defaultMaxOrdersPerSlot: maxOrders,
                          }),
                        });

                        if (!response.ok)
                          throw new Error("Failed to update max orders");

                        toast({
                          title: "Success",
                          description: "Max orders updated successfully",
                        });

                        await loadSettings();
                      } catch (error) {
                        console.error("Error updating max orders:", error);
                        toast({
                          title: "Error",
                          description: "Failed to update max orders",
                          variant: "destructive",
                        });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Time Slot</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settings?.schedule.map((day) =>
                      day.timeSlots.map((slot, index) => (
                        <TableRow key={`${day.dayOfWeek}-${index}`}>
                          <TableCell>{day.dayOfWeek}</TableCell>
                          <TableCell>
                            {slot.startTime} - {slot.endTime}
                          </TableCell>
                          <TableCell>
                            {slot.currentOrders} / {slot.maxOrders}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-sm ${
                                slot.isAvailable
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {slot.isAvailable ? "Available" : "Full"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Handle slot edit
                              }}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Schedule Edit Dialog */}
        <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Edit Schedule - {selectedDay?.dayOfWeek}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="is-open">Open</Label>
                <Switch
                  id="is-open"
                  checked={selectedDay?.isOpen}
                  onCheckedChange={(checked) =>
                    setSelectedDay(
                      selectedDay ? { ...selectedDay, isOpen: checked } : null
                    )
                  }
                />
              </div>
              {selectedDay?.isOpen && (
                <>
                  <div>
                    <Label htmlFor="open-time">Open Time</Label>
                    <Input
                      id="open-time"
                      type="time"
                      value={selectedDay.openTime}
                      onChange={(e) =>
                        setSelectedDay({
                          ...selectedDay,
                          openTime: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="close-time">Close Time</Label>
                    <Input
                      id="close-time"
                      type="time"
                      value={selectedDay.closeTime}
                      onChange={(e) =>
                        setSelectedDay({
                          ...selectedDay,
                          closeTime: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-orders">Max Orders per Slot</Label>
                    <Input
                      id="max-orders"
                      type="number"
                      min="1"
                      value={selectedDay.maxOrdersPerSlot}
                      onChange={(e) =>
                        setSelectedDay({
                          ...selectedDay,
                          maxOrdersPerSlot: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowScheduleDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    selectedDay && handleUpdateSchedule(selectedDay)
                  }
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Holiday Add Dialog */}
        <Dialog open={showHolidayDialog} onOpenChange={setShowHolidayDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Holiday</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Date</Label>
                <Calendar
                  mode="single"
                  selected={holidayDate}
                  onSelect={setHolidayDate}
                  className="rounded-md border"
                />
              </div>
              <div>
                <Label htmlFor="holiday-reason">Reason</Label>
                <Input
                  id="holiday-reason"
                  value={holidayReason}
                  onChange={(e) => setHolidayReason(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="holiday-open">Open</Label>
                <Switch
                  id="holiday-open"
                  checked={holidayIsOpen}
                  onCheckedChange={setHolidayIsOpen}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowHolidayDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddHoliday}>Add</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Special Hours Add Dialog */}
        <Dialog
          open={showSpecialHoursDialog}
          onOpenChange={setShowSpecialHoursDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Special Hours</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Date</Label>
                <Calendar
                  mode="single"
                  selected={specialDate}
                  onSelect={setSpecialDate}
                  className="rounded-md border"
                />
              </div>
              <div>
                <Label htmlFor="special-open-time">Open Time</Label>
                <Input
                  id="special-open-time"
                  type="time"
                  value={specialOpenTime}
                  onChange={(e) => setSpecialOpenTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="special-close-time">Close Time</Label>
                <Input
                  id="special-close-time"
                  type="time"
                  value={specialCloseTime}
                  onChange={(e) => setSpecialCloseTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="special-reason">Reason</Label>
                <Input
                  id="special-reason"
                  value={specialReason}
                  onChange={(e) => setSpecialReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSpecialHoursDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddSpecialHours}>Add</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
}
