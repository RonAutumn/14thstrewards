import { useState, useEffect, useRef } from "react";
import { RadioGroup } from "@headlessui/react";
import { ShippingRate } from "@/types/shipping";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/use-toast";

interface RateSelectorProps {
  address: {
    street1: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price?: number;
    weight?: number;
  }>;
  onRateSelect: (rate: ShippingRate) => void;
  customerName?: string;
  email?: string;
}

interface CarrierRates {
  usps: ShippingRate[];
  ups: ShippingRate[];
}

function formatDeliveryEstimate(days: number | null): string {
  if (!days) return "Estimated delivery time unavailable";

  const today = new Date();
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + days);

  if (days === 1) {
    return `Next day delivery - Estimated ${deliveryDate.toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "short",
        day: "numeric",
      }
    )}`;
  }

  return `Estimated delivery: ${deliveryDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  })} (${days} days)`;
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

const PACKAGING_FEE = 1.25;

export function RateSelector({
  address,
  items,
  onRateSelect,
  customerName,
  email,
}: RateSelectorProps) {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store the address and items in refs to prevent unnecessary fetches
  const addressRef = useRef(address);
  const itemsRef = useRef(items);

  useEffect(() => {
    addressRef.current = address;
    itemsRef.current = items;
  }, [address, items]);

  useEffect(() => {
    async function fetchRates() {
      if (!addressRef.current.zipCode || !addressRef.current.state) return;

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/shipping/rates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerName,
            email,
            address: addressRef.current.street1,
            city: addressRef.current.city,
            state: addressRef.current.state,
            zipCode: addressRef.current.zipCode,
            items: itemsRef.current.map((item) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.price || 0,
              weight: item.weight || 1,
            })),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch shipping rates");
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Failed to fetch shipping rates");
        }

        if (!data.rates || (!data.rates.usps && !data.rates.ups)) {
          throw new Error("No shipping rates available");
        }

        const allRates = [
          ...(data.rates.usps || []),
          ...(data.rates.ups || []),
        ];

        if (allRates.length === 0) {
          throw new Error("No shipping rates available for this address");
        }

        allRates.sort((a, b) => a.price - b.price);
        setRates(allRates);

        // Only auto-select the cheapest rate if there is no selected rate
        if (!selectedRate) {
          const cheapestRate = allRates[0];
          setSelectedRate(cheapestRate);
          onRateSelect(cheapestRate);
        }
      } catch (err) {
        console.error("Error fetching shipping rates:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to fetch shipping rates. Please try again later."
        );
        toast({
          title: "Error",
          description:
            err instanceof Error
              ? err.message
              : "Failed to fetch shipping rates. Please try again later.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }

    fetchRates();
  }, [address, items, customerName, email, onRateSelect]); // Removed selectedRate from dependencies

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Spinner className="h-6 w-6" />
        <span className="ml-2">Calculating shipping rates...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (rates.length === 0) {
    return (
      <div className="text-gray-500 p-4">
        No shipping rates available for this address.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-600">
        {selectedRate
          ? "Selected shipping method:"
          : "Please select a shipping method to continue:"}
      </div>
      <RadioGroup
        value={selectedRate}
        onChange={(rate: ShippingRate | null) => {
          if (rate) {
            setSelectedRate(rate);
            onRateSelect(rate);
          }
        }}
      >
        <div className="space-y-2">
          {rates.map((rate) => (
            <RadioGroup.Option
              key={rate.id}
              value={rate}
              className={({ checked }) =>
                `${
                  checked
                    ? "bg-black border-primary"
                    : "bg-black hover:bg-black/80"
                }
                relative flex cursor-pointer rounded-lg px-5 py-4 border-2 focus:outline-none text-white`
              }
            >
              {({ checked }) => (
                <div className="flex w-full items-center justify-between">
                  <div className="flex-1">
                    <RadioGroup.Label
                      as="p"
                      className="font-medium flex items-center justify-between"
                    >
                      <span>{rate.name}</span>
                      <span className="ml-4 font-semibold">
                        ${(rate.price + PACKAGING_FEE).toFixed(2)}
                      </span>
                    </RadioGroup.Label>
                    <RadioGroup.Description
                      as="div"
                      className="mt-1 text-sm text-gray-300"
                    >
                      <span>
                        {rate.estimatedDays
                          ? `${rate.estimatedDays} business days`
                          : "Delivery time varies"}
                      </span>
                    </RadioGroup.Description>
                  </div>
                  {checked && (
                    <div className="shrink-0 text-primary ml-4">
                      <CheckIcon className="h-6 w-6" />
                    </div>
                  )}
                </div>
              )}
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx={12} cy={12} r={12} fill="currentColor" opacity="0.2" />
      <path
        d="M7 13l3 3 7-7"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
