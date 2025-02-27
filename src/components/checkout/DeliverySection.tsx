"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Input,
  Textarea,
  RadioGroup,
  RadioGroupItem,
  AddressInput,
} from "@/components/ui";
import { DeliveryCalendar } from "@/components/delivery/delivery-calendar";
import { DeliveryClient } from "@/features/delivery/delivery.client";
import { toast } from "@/components/ui/use-toast";

export interface DeliveryInfo {
  address: string;
  city: string;
  zipCode: string;
  deliveryDate?: Date;
  deliveryTime: string;
  instructions: string;
  deliveryFee: number;
  freeDeliveryThreshold?: number;
  isDeliveryFree?: boolean;
}

interface DeliverySectionProps {
  onDeliveryInfoChange: (info: DeliveryInfo) => void;
  subtotal: number;
  errors: any;
  isDeliveryAddress?: boolean;
}

export function DeliverySection({
  onDeliveryInfoChange,
  subtotal,
  errors,
  isDeliveryAddress = true,
}: DeliverySectionProps) {
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [instructions, setInstructions] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);

  const handleDeliverySelect = async (
    date: Date,
    timeSlot: { startTime: string; endTime: string }
  ) => {
    setDeliveryDate(date);
    setDeliveryTime(`${timeSlot.startTime}-${timeSlot.endTime}`);

    if (zipCode) {
      try {
        const feeInfo = await DeliveryClient.getDeliveryFeeByZipCode(
          zipCode,
          subtotal
        );
        setDeliveryFee(feeInfo.fee);
        onDeliveryInfoChange({
          address,
          city,
          zipCode,
          deliveryDate: date,
          deliveryTime: `${timeSlot.startTime}-${timeSlot.endTime}`,
          instructions,
          deliveryFee: feeInfo.fee,
          freeDeliveryThreshold: feeInfo.freeDeliveryThreshold,
          isDeliveryFree: feeInfo.isDeliveryFree,
        });
      } catch (error) {
        console.error("Error calculating delivery fee:", error);
      }
    }
  };

  const handleAddressSelect = async (addressData: any) => {
    setAddress(addressData.street);
    setCity(addressData.city);
    setZipCode(addressData.zipCode);

    try {
      // Only fetch delivery fee when it's a delivery address (not shipping)
      if (isDeliveryAddress) {
        const feeInfo = await DeliveryClient.getDeliveryFeeByZipCode(
          addressData.zipCode,
          subtotal
        );
        setDeliveryFee(feeInfo.fee);

        onDeliveryInfoChange({
          address: addressData.street,
          city: addressData.city,
          zipCode: addressData.zipCode,
          deliveryDate,
          deliveryTime,
          instructions,
          deliveryFee: feeInfo.fee,
          freeDeliveryThreshold: feeInfo.freeDeliveryThreshold,
          isDeliveryFree: feeInfo.isDeliveryFree,
        });

        // Display free delivery message if applicable
        if (!feeInfo.isDeliveryFree && feeInfo.freeDeliveryThreshold > 0) {
          toast({
            title: "Free Delivery Available",
            description: `Add ${formatCurrency(
              feeInfo.freeDeliveryThreshold - subtotal
            )} more to qualify for free delivery!`,
          });
        }
      } else {
        // For shipping addresses, don't include delivery fee
        onDeliveryInfoChange({
          address: addressData.street,
          city: addressData.city,
          zipCode: addressData.zipCode,
          deliveryDate,
          deliveryTime,
          instructions,
          deliveryFee: 0,
          freeDeliveryThreshold: 0,
          isDeliveryFree: false,
        });
      }
    } catch (error) {
      console.error("Error calculating delivery fee:", error);
      toast({
        title: "Error",
        description: "Failed to calculate delivery fee. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInstructionsChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setInstructions(e.target.value);
    onDeliveryInfoChange({
      address,
      city,
      zipCode,
      deliveryDate,
      deliveryTime,
      instructions: e.target.value,
      deliveryFee,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Delivery Address</Label>
            <AddressInput
              onAddressSelect={handleAddressSelect}
              error={errors?.address}
              cartSubtotal={subtotal}
              isDeliveryAddress={isDeliveryAddress}
            />
          </div>

          {zipCode && (
            <div className="space-y-4">
              <div>
                <Label>Delivery Date & Time</Label>
                <DeliveryCalendar
                  zipCode={zipCode}
                  onSelect={handleDeliverySelect}
                  selectedDate={deliveryDate}
                  selectedTimeSlot={
                    deliveryTime
                      ? {
                          startTime: deliveryTime.split("-")[0],
                          endTime: deliveryTime.split("-")[1],
                        }
                      : undefined
                  }
                  showLabels={false}
                />
                {errors.deliveryDate && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.deliveryDate}
                  </p>
                )}
              </div>

              <div>
                <Label>Delivery Instructions (Optional)</Label>
                <Textarea
                  placeholder="Add any special instructions for delivery..."
                  value={instructions}
                  onChange={handleInstructionsChange}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
