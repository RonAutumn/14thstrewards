"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "./input";
import { Loader2 } from "lucide-react";
import { useToast } from "./use-toast";
import { DeliveryClient } from "@/features/delivery/delivery.client";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

interface AddressInputProps {
  onAddressSelect: (address: {
    street: string;
    apartment: string;
    city: string;
    state: string;
    zipCode: string;
    deliveryFee?: number;
  }) => void;
  error?: string;
  defaultValue?: string;
  cartSubtotal?: number;
  isDeliveryAddress?: boolean;
}

export function AddressInput({
  onAddressSelect,
  error,
  defaultValue = "",
  cartSubtotal = 0,
  isDeliveryAddress = false,
}: AddressInputProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(defaultValue);
  const [apartmentValue, setApartmentValue] = useState("");
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const autoCompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkGoogleMaps = () => {
      if (typeof window !== "undefined" && window.google?.maps?.places) {
        setIsGoogleLoaded(true);
        initializeAutocomplete();
      } else {
        // If not loaded after 5 seconds, show an error
        setTimeout(() => {
          if (!window.google?.maps?.places) {
            setIsGoogleLoaded(false);
            toast({
              title: "Service Unavailable",
              description:
                "Address lookup service is currently unavailable. You can still enter your address manually.",
              variant: "destructive",
            });
          }
        }, 5000);
      }
    };

    checkGoogleMaps();
  }, [toast]);

  const initializeAutocomplete = () => {
    if (!inputRef.current || autoCompleteRef.current) return;

    try {
      setIsLoading(true);
      setApiError(null);

      // Check if Google Places API is loaded
      if (!window.google?.maps?.places) {
        throw new Error("Google Places API not loaded");
      }

      autoCompleteRef.current = new google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: { country: "us" },
          fields: ["address_components", "formatted_address"],
          types: ["address"],
        }
      );

      autoCompleteRef.current.addListener("place_changed", handlePlaceSelect);
    } catch (error) {
      console.error("Error initializing Google Places:", error);
      setApiError(
        "Address lookup service unavailable. Please enter your address manually."
      );
      toast({
        title: "Error",
        description:
          "Failed to initialize address lookup. You can still enter your address manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceSelect = async () => {
    if (!autoCompleteRef.current) return;

    try {
      setIsLoading(true);
      const place = autoCompleteRef.current.getPlace();
      if (!place.address_components) {
        throw new Error("Invalid address selected");
      }

      let streetNumber = "";
      let route = "";
      let city = "";
      let state = "";
      let zipCode = "";

      for (const component of place.address_components) {
        const type = component.types[0];
        switch (type) {
          case "street_number":
            streetNumber = component.long_name;
            break;
          case "route":
            route = component.long_name;
            break;
          case "locality":
            city = component.long_name;
            break;
          case "administrative_area_level_1":
            state = component.short_name;
            break;
          case "postal_code":
            zipCode = component.long_name;
            break;
        }
      }

      const street = `${streetNumber} ${route}`.trim();
      setInputValue(place.formatted_address || street);

      // Only fetch delivery fee if this is a delivery address
      let deliveryFee;
      if (isDeliveryAddress && zipCode) {
        try {
          const feeInfo = await DeliveryClient.getDeliveryFeeByZipCode(
            zipCode,
            cartSubtotal
          );
          deliveryFee = feeInfo.fee;
        } catch (error) {
          console.error("Error fetching delivery fee:", error);
          toast({
            title: "Warning",
            description: "Could not calculate delivery fee. Please try again later.",
            variant: "destructive",
          });
        }
      }

      onAddressSelect({
        street,
        apartment: apartmentValue,
        city,
        state,
        zipCode,
        ...(isDeliveryAddress && { deliveryFee }),
      });
    } catch (error) {
      console.error("Error selecting place:", error);
      toast({
        title: "Error",
        description:
          "Failed to process the selected address. Please try again or enter manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // If Google Places isn't loaded, try to parse the address manually
    if (!isGoogleLoaded && e.target.value.includes(",")) {
      const parts = e.target.value.split(",").map((part) => part.trim());
      if (parts.length >= 3) {
        const [street, city, stateZip] = parts;
        const [state, zipCode] = stateZip.split(" ");
        if (street && city && state && zipCode) {
          // Fetch delivery fee for manual entry
          DeliveryClient.getDeliveryFeeByZipCode(zipCode, cartSubtotal)
            .then((deliveryFee) => {
              onAddressSelect({
                street,
                apartment: apartmentValue,
                city,
                state,
                zipCode,
                deliveryFee,
              });
            })
            .catch((error) => {
              console.error("Error fetching delivery fee:", error);
              onAddressSelect({
                street,
                apartment: apartmentValue,
                city,
                state,
                zipCode,
              });
              toast({
                title: "Warning",
                description:
                  "Could not calculate delivery fee. Please try again later.",
                variant: "destructive",
              });
            });
        }
      }
    }
  };

  const handleApartmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApartment = e.target.value;
    setApartmentValue(newApartment);
    if (inputValue) {
      // Only trigger onAddressSelect if we have a street address
      const parts = inputValue.split(",").map((part) => part.trim());
      if (parts.length >= 3) {
        const [street, city, stateZip] = parts;
        const [state, zipCode] = stateZip.split(" ");
        if (street && city && state && zipCode) {
          onAddressSelect({
            street,
            apartment: newApartment,
            city,
            state,
            zipCode,
          });
        }
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={initializeAutocomplete}
          placeholder={
            isGoogleLoaded
              ? "Enter your address"
              : "Enter your address (e.g., 123 Main St, City, NY 12345)"
          }
          className={cn(error && "border-red-500")}
          disabled={isLoading}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner className="h-4 w-4" />
          </div>
        )}
        {apiError && <p className="text-sm text-amber-500 mt-1">{apiError}</p>}
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
      <Input
        type="text"
        value={apartmentValue}
        onChange={handleApartmentChange}
        placeholder="Apt/Suite/Unit (optional)"
      />
    </div>
  );
}
