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
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { AddressAutocomplete } from "@/components/address/address-autocomplete";

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
  onDeliveryInfoChange: (info: {
    address: string;
    city: string;
    zipCode: string;
    deliveryDate?: Date;
    deliveryTime?: string;
    instructions: string;
    deliveryFee: number;
    freeDeliveryThreshold: number;
    isDeliveryFree: boolean;
  }) => void;
  subtotal: number;
  errors?: {
    address?: string[];
    zipCode?: string[];
    deliveryDate?: string[];
    deliveryTime?: string[];
  };
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
    console.log('[DeliverySection] Delivery slot selected:', {
      date: date.toISOString(),
      timeSlot,
      currentAddress: address,
      currentZipCode: zipCode
    });

    setDeliveryDate(date);
    setDeliveryTime(`${timeSlot.startTime}-${timeSlot.endTime}`);

    // Update delivery info without recalculating fee if we already have it
    console.log('[DeliverySection] Updating delivery info with current fee:', {
      deliveryFee,
      hasExistingFee: deliveryFee !== undefined
    });

    onDeliveryInfoChange({
      address,
      city,
      zipCode,
      deliveryDate: date,
      deliveryTime: `${timeSlot.startTime}-${timeSlot.endTime}`,
      instructions,
      deliveryFee: deliveryFee,
      freeDeliveryThreshold: undefined,
      isDeliveryFree: false,
    });
  };

  const handleAddressSelect = async (addressData: any) => {
    console.log('[DeliverySection] Address selected:', {
      street: addressData.street,
      city: addressData.city,
      zipCode: addressData.zipCode
    });

    setAddress(addressData.street);
    setCity(addressData.city);
    setZipCode(addressData.zipCode);

    // Let the parent component handle the delivery fee calculation
    console.log('[DeliverySection] Triggering parent fee calculation');
    onDeliveryInfoChange({
      address: addressData.street,
      city: addressData.city,
      zipCode: addressData.zipCode,
      deliveryDate,
      deliveryTime,
      instructions,
      deliveryFee: undefined, // This will trigger fee calculation in the parent
      freeDeliveryThreshold: undefined,
      isDeliveryFree: false,
    });
  };

  const handleInstructionsChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    console.log('[DeliverySection] Delivery instructions updated');
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
