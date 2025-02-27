"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DeliveryCalendar } from "@/components/delivery/delivery-calendar";
import { DeliveryService } from "@/features/delivery/delivery.service";

interface DeliverySelectionProps {
  onDeliverySelected: (delivery: {
    zipCode: string;
    date: Date;
    timeSlot: { startTime: string; endTime: string };
    fee: number;
  }) => void;
  cartTotal: number;
}

export function DeliverySelection({
  onDeliverySelected,
  cartTotal,
}: DeliverySelectionProps) {
  const [zipCode, setZipCode] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    startTime: string;
    endTime: string;
  }>();
  const [error, setError] = useState<string>("");

  const handleZipCodeChange = (value: string) => {
    // Only allow numbers and limit to 5 digits
    const cleanValue = value.replace(/\D/g, "").slice(0, 5);
    setZipCode(cleanValue);
    setError("");
  };

  const handleDeliverySelect = async (
    date: Date,
    timeSlot: { startTime: string; endTime: string }
  ) => {
    setSelectedDate(date);
    setSelectedTimeSlot(timeSlot);

    if (!zipCode || zipCode.length !== 5) {
      setError("Please enter a valid 5-digit ZIP code");
      return;
    }

    try {
      if (timeSlot.startTime && timeSlot.endTime) {
        const deliveryFee = await DeliveryService.getDeliveryFeeByZipCode(
          zipCode,
          cartTotal
        );
        onDeliverySelected({
          zipCode,
          date,
          timeSlot,
          fee: deliveryFee,
        });
      }
    } catch (err) {
      setError("Unable to calculate delivery fee for this ZIP code");
      console.error("Delivery fee calculation error:", err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Delivery Details</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="zipCode" className="text-sm font-medium">
            ZIP Code
          </label>
          <Input
            id="zipCode"
            type="text"
            value={zipCode}
            onChange={(e) => handleZipCodeChange(e.target.value)}
            placeholder="Enter ZIP code"
            maxLength={5}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {zipCode.length === 5 && (
          <DeliveryCalendar
            zipCode={zipCode}
            onDeliverySelect={handleDeliverySelect}
          />
        )}
      </CardContent>
    </Card>
  );
}
