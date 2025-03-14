"use client";

import { useCart } from "@/lib/store/cart";
import type { CartItem as GlobalCartItem } from "@/types/cart";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
import { CalendarIcon, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { US_STATES, StateSelect } from "@/components/shipping/state-select";
import { AddressInput } from "@/components/ui/address-input";
import GooglePlacesScript from "@/components/ui/google-places-script";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Address } from "@/types/address";
import { RateSelector } from "@/components/shipping/rate-selector";
import type { ShippingRate } from "@/types/shipping";
import { Badge } from "@/components/ui/badge";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { rewardsService } from "@/features/rewards/rewards.service";
import { addItem, removeItem } from "@/lib/store/cart";
import { DeliveryCalendar } from "@/components/delivery/delivery-calendar";
import { DeliveryClient } from "@/features/delivery/delivery.client";
import { supabaseOrders, type CreateOrderData } from "@/lib/supabase-orders";
import { DeliverySection } from "@/components/checkout/DeliverySection";
import type { OrderItem as OrderItemType } from "@/types/orders";
import type { DeliveryInfo } from "@/components/checkout/DeliverySection";
import { useAuth } from "@/contexts/AuthContext";

type DeliveryMethod = "pickup" | "delivery" | "shipping";

type Step = "contact" | "delivery" | "payment";

// Update the time slot types to be more flexible
type DeliveryTime = string;

type FormField = keyof CheckoutForm;
type FormErrors = Partial<Record<FormField, string>>;
type DeliveryDay = 1 | 2 | 3 | 4 | 5 | 6;

interface RegularTimeSlot {
  startTime: string;
  endTime: string;
}

interface SaturdayTimeSlot extends RegularTimeSlot {}

interface OrderItem extends OrderItemType {}

// Update the OrderAddress interface
interface OrderAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface OrderData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  userId: string | undefined;
  deliveryMethod: DeliveryMethod;
  address: OrderAddress | null;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryDateTime?: string;
  pickupDateTime?: string;
  selectedRate: ShippingRate | null;
  paymentMethod: "cash" | "card";
}

// Add ShippingFormData interface
interface ShippingFormData {
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingMethod: string;
}

// Update the convertCartItem function to include recordId
const convertCartItem = (item: GlobalCartItem): OrderItem => ({
  id: item.id,
  name: item.name,
  quantity: item.quantity,
  price: item.selectedVariation?.price || item.price || 0,
  total: (item.selectedVariation?.price || item.price || 0) * item.quantity,
  variation: item.selectedVariation?.name,
  recordId: item.id,
  isRedeemed: false,
  originalPrice: item.price || 0,
  pointsCost: item.pointsCost || 0,
  unitPrice: item.selectedVariation?.price || item.price || 0,
  weight: item.weight || 1,
});

interface PaymentDetails {
  paymentId: string;
  payAmount: number;
  payAddress: string;
  paymentStatus: string;
  paymentExpirationTime: string;
}

interface PaymentFormData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  nameOnCard: string;
  billingAddress: string;
  billingZip: string;
  billingCountry: string;
}

// Remove borough settings type
type BoroughSettings = {
  fee: number;
  freeThreshold: number;
  sameDay: boolean;
  cutoffTime: number;
  deliveryDays: readonly DeliveryDay[];
  timeSlots: readonly RegularTimeSlot[];
  saturdayTimeSlots: readonly SaturdayTimeSlot[];
};

// Add formatCurrency helper function
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

interface PaymentResponse {
  payment_status: string;
  order_id: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  deliveryDate?: Date;
  deliveryTime: DeliveryTime;
  instructions: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingMethod: string;
  pickupDate?: Date;
  pickupTime: DeliveryTime;
  items: OrderItem[];
  total: number;
  deliveryFee?: number;
  shippingFee?: number;
  freeDeliveryThreshold?: number;
  isDeliveryFree?: boolean;
  paymentMethod: "cash" | "card" | undefined;
  shippingApartment: string;
  deliveryMethod: "delivery" | "shipping" | "pickup";
}

interface DeliveryFeeInfo {
  fee: number;
  shippingFee?: number;
  freeDeliveryThreshold?: number;
  isDeliveryFree: boolean;
}

export default function CheckoutPage() {
  const {
    items,
    clearCart,
    addRedeemedReward,
    removeRedeemedReward,
    redeemedRewards,
  } = useCart();
  const { user, session, isLoading: isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Add state for delivery days
  const [deliveryDays, setDeliveryDays] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [estimatedPoints, setEstimatedPoints] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [currentStep, setCurrentStep] = useState<Step>("contact");
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [paymentPollingInterval, setPaymentPollingInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [availableRewards, setAvailableRewards] = useState<any[]>([]);
  const [availablePickupTimes, setAvailablePickupTimes] = useState<
    {
      startTime: string;
      endTime: string;
      isAvailable: boolean;
      maxOrders: number;
      currentOrders: number;
    }[]
  >([]);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Initialize form data with mapped items and default delivery values
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    deliveryDate: undefined,
    deliveryTime: "",
    instructions: "",
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingZip: "",
    shippingMethod: "",
    pickupDate: undefined,
    pickupTime: "",
    items: items.map(convertCartItem),
    total: 0,
    deliveryFee: undefined,
    shippingFee: undefined,
    freeDeliveryThreshold: undefined,
    isDeliveryFree: false,
    paymentMethod: undefined,
    shippingApartment: "",
    deliveryMethod: "delivery",
  });

  // Define updateDeliveryFee after formData initialization
  const updateDeliveryFee = useCallback(async (zipCode: string, subtotal: number) => {
    console.log('[Checkout] Starting delivery fee update:', { zipCode, subtotal });
    try {
      if (!zipCode || formData.deliveryMethod === "shipping") {
        console.log('[Checkout] Skipping fee update - invalid conditions');
        setFormData((prev) => ({
          ...prev,
          deliveryFee: undefined,
          freeDeliveryThreshold: undefined,
          isDeliveryFree: false,
        }));
        return;
      }

      const response = await DeliveryClient.getDeliveryFeeByZipCode(
        zipCode,
        subtotal
      );
      console.log('[Checkout] Delivery fee response:', response);

      const fee = Number(response.fee);
      const threshold = Number(response.freeDeliveryThreshold);
      const isFree = Boolean(response.isDeliveryFree);

      setFormData((prev) => ({
        ...prev,
        deliveryFee: fee,
        shippingFee: selectedRate?.price || 0,
        freeDeliveryThreshold: threshold,
        isDeliveryFree: isFree,
      }));

      console.log('[Checkout] Updated delivery fee:', {
        fee,
        threshold,
        isFree,
        total: formData.total
      });

      // Show toast if close to free delivery
      if (!isFree && threshold > 0) {
        const remaining = threshold - subtotal;
        if (remaining > 0) {
          console.log('[Checkout] Showing free delivery threshold toast');
          toast({
            title: "Free Delivery Available",
            description: `Add ${formatCurrency(
              remaining
            )} more to qualify for free delivery!`,
          });
        }
      }
    } catch (error) {
      console.error("[Checkout] Error updating delivery fee:", {
        error: error instanceof Error ? error.message : 'Unknown error',
        zipCode,
        subtotal
      });
      setFormData((prev) => ({
        ...prev,
        deliveryFee: undefined,
        shippingFee: undefined,
        freeDeliveryThreshold: undefined,
        isDeliveryFree: false,
      }));
    }
  }, [formData.deliveryMethod, selectedRate, toast]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate subtotal from items first
  const subtotal = items.reduce(
    (total, item) => total + (item.selectedVariation?.price || item.price || 0) * item.quantity,
    0
  );

  // Calculate total weight for shipping
  const totalWeight = items.reduce(
    (total, item) => total + (item.weight || 1) * item.quantity,
    0
  );

  useEffect(() => {
    // Check if user is logged in and fetch their rewards
    const fetchUserAndRewards = async () => {
      if (!session?.user) {
        console.log('[Checkout] No active session for rewards fetch');
        return;
      }

      try {
        console.log('[Checkout] Fetching rewards for user:', session.user.id);
        
        // Fetch points and rewards separately to handle errors independently
        try {
          const points = await rewardsService.getUserPoints(session.user.id);
          console.log('[Checkout] User points fetched:', points);
          setUserPoints(points);
        } catch (error) {
          console.error("[Checkout] Failed to fetch user points:", error);
          setUserPoints(0); // Default to 0 points if fetch fails
        }

        try {
          const rewards = await rewardsService.getAvailableRewards(session.user.id);
          console.log('[Checkout] Available rewards fetched:', rewards.length);
          setAvailableRewards(rewards);
        } catch (error) {
          console.error("[Checkout] Failed to fetch rewards:", error);
          setAvailableRewards([]); // Default to empty rewards if fetch fails
        }
      } catch (error) {
        console.error("[Checkout] Failed to fetch rewards data:", error);
        // Set default values
        setUserPoints(0);
        setAvailableRewards([]);
      }
    };

    if (isClient && session) {
      fetchUserAndRewards();
    }
  }, [isClient, session, rewardsService]);

  // Calculate estimated points when subtotal changes
  useEffect(() => {
    const calculateEstimatedPoints = async () => {
      if (user?.id) {
        try {
          // Get user profile to determine tier
          const userProfile = await rewardsService.getUserProfile(user.id);
          const points = rewardsService.calculateEstimatedPoints(
            subtotal,
            userProfile?.membership_level || 'BRONZE'
          );
          setEstimatedPoints(points);
        } catch (error) {
          console.error("Failed to calculate estimated points:", error);
          setEstimatedPoints(0);
        }
      }
    };

    calculateEstimatedPoints();
  }, [subtotal, user?.id]);

  // Update the item mapping in the checkout data
  const mapItemsForCheckout = (items: GlobalCartItem[]): OrderItem[] =>
    items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.selectedVariation?.price || item.price || 0,
      total: (item.selectedVariation?.price || item.price || 0) * item.quantity,
      variation: item.selectedVariation?.name,
      recordId: item.id,
      isRedeemed: false,
      originalPrice: item.price || 0,
      pointsCost: item.pointsCost || 0,
      unitPrice: item.selectedVariation?.price || item.price || 0,
      weight: item.weight || 1,
    }));

  // Use formData.deliveryMethod instead of separate state
  const deliveryMethod = formData.deliveryMethod;

  // Calculate total including delivery fee
  const calculatedTotal = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + (item.selectedVariation?.price || item.price || 0) * item.quantity,
      0
    );
    let fee = 0;
    if (deliveryMethod === "shipping" && selectedRate) {
      fee = selectedRate.price;
    } else if (formData.deliveryFee) {
      fee = formData.deliveryFee;
    }
    return subtotal + fee;
  }, [items, deliveryMethod, selectedRate, formData.deliveryFee]);

  // Update fee when delivery method or selected rate changes - with proper guards
  useEffect(() => {
    // Only run this effect if we have both a delivery method and zip code
    if (!deliveryMethod || !formData.zipCode) {
      return;
    }

    console.log('[Checkout] Delivery method or zip code changed:', {
      method: deliveryMethod,
      zipCode: formData.zipCode,
      currentFee: formData.deliveryFee
    });

    if (deliveryMethod === "delivery") {
      // Only update if we don't already have a delivery fee calculated
      if (formData.deliveryFee === undefined) {
        console.log('[Checkout] Updating delivery fee');
        updateDeliveryFee(formData.zipCode, subtotal);
      }
    } else if (deliveryMethod === "pickup") {
      console.log('[Checkout] Resetting delivery fees for pickup');
      // Reset fees for pickup
      setFormData((prev) => ({
        ...prev,
        deliveryFee: undefined,
        shippingFee: undefined,
        freeDeliveryThreshold: undefined,
        isDeliveryFree: false,
      }));
    }
  }, [deliveryMethod, formData.zipCode, formData.deliveryFee, subtotal, updateDeliveryFee]);

  // Update the total whenever relevant values change
  useEffect(() => {
    const newTotal = calculatedTotal;
    setFormData((prev) => {
      // Only update if the total has actually changed
      if (prev.total === newTotal) {
        return prev;
      }
      return { ...prev, total: newTotal };
    });
  }, [calculatedTotal]);

  // Keep form data items in sync with cart items
  useEffect(() => {
    setFormData((prev) => {
      const newItems = items.map(convertCartItem);
      // Only update if items have actually changed
      if (JSON.stringify(prev.items) === JSON.stringify(newItems)) {
        return prev;
      }
      return {
        ...prev,
        items: newItems,
      };
    });
  }, [items]);

  // Fetch shipping rates when shipping address is complete
  useEffect(() => {
    if (
      deliveryMethod === "shipping" &&
      formData.shippingAddress &&
      formData.shippingCity &&
      formData.shippingState &&
      formData.shippingZip?.length === 5
    ) {
      console.log(
        "Address complete, shipping rates should be fetched automatically"
      );
    }
  }, [
    deliveryMethod,
    formData.shippingAddress,
    formData.shippingCity,
    formData.shippingState,
    formData.shippingZip,
  ]);

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: string } }
  ) => {
    const target = "target" in e ? e.target : e;
    const name = target.name;
    const value = target.value;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for the field being changed
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Handle payment input changes
  const handlePaymentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const name = target.name;
    const value = target.value;
    let formattedValue = value;

    // Format card number with spaces
    if (name === "cardNumber") {
      formattedValue = value
        .replace(/\s/g, "")
        .replace(/(\d{4})/g, "$1 ")
        .trim();
    }
    // Format expiry date with slash
    else if (name === "expiryDate") {
      formattedValue = value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "$1/$2")
        .slice(0, 5);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  const goToStep = (step: Step) => {
    const newErrors: Record<string, string> = {};

    // Validate contact info step
    if (currentStep === "contact") {
      if (!formData.name?.trim()) newErrors.name = "Name is required";
      if (!formData.email?.trim()) newErrors.email = "Email is required";
      if (!formData.phone?.trim()) newErrors.phone = "Phone is required";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    // Validate delivery step
    if (currentStep === "delivery") {
      if (deliveryMethod === "delivery") {
        if (!formData.address?.trim())
          newErrors.address = "Address is required";
        if (!formData.zipCode?.trim())
          newErrors.zipCode = "ZIP Code is required";
        if (!formData.deliveryDate)
          newErrors.deliveryDate = "Delivery date is required";
        if (!formData.deliveryTime)
          newErrors.deliveryTime = "Delivery time is required";
      } else if (deliveryMethod === "shipping") {
        if (!formData.shippingAddress?.trim())
          newErrors.shippingAddress = "Shipping address is required";
        if (!formData.shippingCity?.trim())
          newErrors.shippingCity = "City is required";
        if (!formData.shippingState?.trim())
          newErrors.shippingState = "State is required";
        if (!formData.shippingZip?.trim())
          newErrors.shippingZip = "ZIP Code is required";
        if (!selectedRate)
          newErrors.shippingMethod = "Please select a shipping method";
      } else if (deliveryMethod === "pickup") {
        if (!formData.pickupDate)
          newErrors.pickupDate = "Pickup date is required";
        if (!formData.pickupTime?.trim())
          newErrors.pickupTime = "Pickup time is required";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    setErrors({});
    setCurrentStep(step);
  };

  const handleDeliveryInfoChange = (info: DeliveryInfo) => {
    // Update form data with new delivery info
    setFormData(
      (prev: FormData): FormData => ({
        ...prev,
        address: info.address,
        city: info.city,
        zipCode: info.zipCode,
        deliveryDate: info.deliveryDate,
        deliveryTime: info.deliveryTime,
        instructions: info.instructions,
        deliveryFee: info.deliveryFee,
        freeDeliveryThreshold: info.freeDeliveryThreshold,
        isDeliveryFree: info.isDeliveryFree,
      })
    );

    // If delivery fee is provided in info, don't make another API call
    if (info.deliveryFee === undefined && info.zipCode && deliveryMethod === "delivery") {
      updateDeliveryFee(info.zipCode, subtotal);
    }
  };

  const handleCopyAddress = async (address: string) => {
    try {
      if (typeof window !== "undefined" && window.navigator?.clipboard) {
        await window.navigator.clipboard.writeText(address);
        toast({
          title: "Address Copied",
          description: "Payment address has been copied to clipboard",
        });
      }
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  const startPaymentStatusPolling = (paymentId: string) => {
    // Clear any existing interval
    if (paymentPollingInterval) {
      clearInterval(paymentPollingInterval);
    }

    // Poll payment status every 30 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/now-payments/status?paymentId=${paymentId}`
        );
        const data = (await response.json()) as PaymentResponse;

        if (
          data.payment_status === "finished" ||
          data.payment_status === "confirmed"
        ) {
          clearInterval(interval);
          clearCart();
          // Create order data from form data
          const orderData: OrderData = {
            orderId: data.order_id || generateOrderId(),
            customerName: formData.name,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            userId: user?.id,
            deliveryMethod,
            address:
              deliveryMethod === "delivery"
                ? {
                    street: formData.address,
                    city: formData.city,
                    state: "NY",
                    zipCode: formData.zipCode,
                  }
                : deliveryMethod === "shipping"
                ? {
                    street: formData.shippingAddress,
                    city: formData.shippingCity,
                    state: formData.shippingState,
                    zipCode: formData.shippingZip,
                  }
                : null,
            items: formData.items,
            subtotal,
            deliveryFee: formData.deliveryFee || 0,
            total: formData.total,
            deliveryDateTime: formData.deliveryDate
              ? format(formData.deliveryDate, "yyyy-MM-dd HH:mm:ss")
              : undefined,
            pickupDateTime: formData.pickupDate
              ? format(formData.pickupDate, "yyyy-MM-dd HH:mm:ss")
              : undefined,
            selectedRate,
            paymentMethod: formData.paymentMethod || "card",
          };
          router.push(
            `/order-confirmation?orderId=${
              data.order_id
            }&orderData=${encodeURIComponent(JSON.stringify(orderData))}`
          );
        } else if (
          data.payment_status === "failed" ||
          data.payment_status === "expired"
        ) {
          clearInterval(interval);
          toast({
            title: "Payment Failed",
            description:
              "Your payment has failed or expired. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    }, 30000);

    setPaymentPollingInterval(interval);
  };

  // Update the delivery method change handler to use formData
  const handleDeliveryMethodChange = async (method: DeliveryMethod) => {
    console.log('[Checkout] Delivery method changed:', { method });
    
    setFormData(prev => ({
      ...prev,
      deliveryMethod: method,
      // Reset delivery-related fields when changing methods
      deliveryFee: undefined,
      shippingFee: undefined,
      freeDeliveryThreshold: undefined,
      isDeliveryFree: false
    }));

    // Only calculate delivery fee if we have both method and zip code
    if (method === "delivery" && formData.zipCode) {
      await updateDeliveryFee(formData.zipCode, subtotal);
    }

    // Reset any existing errors
    setErrors({});
  };

  // Update the delivery time change handler
  const handleDeliveryTimeChange = (time: DeliveryTime) => {
    setFormData((prev) => ({
      ...prev,
      deliveryTime: time,
    }));
  };

  // Update the pickup time change handler
  const handlePickupTimeChange = (timeSlot: string) => {
    setFormData((prev) => ({
      ...prev,
      pickupTime: timeSlot,
    }));

    // Clear any existing errors
    if (errors.pickupTime) {
      setErrors((prev) => ({
        ...prev,
        pickupTime: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('[Checkout] Starting checkout process', {
        deliveryMethod,
        hasZipCode: Boolean(formData.zipCode),
        itemCount: formData.items.length,
        subtotal,
        total: formData.total
      });
      
      // Check for active session before proceeding
      if (!session) {
        console.log('[Checkout] No active session during submission');
        toast({
          title: "Session Expired",
          description: "Please log in again to complete your order",
          variant: "destructive",
        });
        const returnTo = encodeURIComponent('/checkout');
        router.push(`/auth/signin?returnTo=${returnTo}`);
        return;
      }

      // Update delivery fee before submitting
      if (formData.zipCode) {
        console.log('[Checkout] Updating delivery fee for zip:', formData.zipCode);
        await updateDeliveryFee(formData.zipCode, subtotal);
      }

      // Validate form data
      const errors = validateForm(formData, deliveryMethod);
      if (Object.keys(errors).length > 0) {
        console.error('[Checkout] Form validation failed:', {
          errors,
          formData: {
            ...formData,
            // Exclude sensitive data
            email: '***',
            phone: '***'
          }
        });
        setErrors(errors);
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      console.log('[Checkout] Form validation passed, checking authentication');

      // Generate order ID first
      const orderId = generateOrderId();

      // Create pending order in Supabase first
      const orderData = {
        order_id: orderId,
        user_id: session.user.id,
        order_type: deliveryMethod as 'pickup' | 'delivery' | 'shipping',
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        items: formData.items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          variation: item.selectedVariation?.name,
          weight: item.weight || 1,
        })),
        total_amount: formData.total,
        status: 'pending' as const,
        payment_status: 'pending' as const,
        payment_method: 'card' as const,
        ...(deliveryMethod === 'delivery' && {
          delivery_address: {
            street: formData.address,
            city: formData.city,
            state: 'NY',
            zip_code: formData.zipCode
          },
          delivery_instructions: formData.instructions,
          delivery_date: formData.deliveryDate?.toISOString(),
          delivery_time_slot: formData.deliveryTime,
        }),
        ...(deliveryMethod === 'shipping' && {
          shipping_address: {
            street: formData.shippingAddress,
            city: formData.shippingCity,
            state: formData.shippingState,
            zip_code: formData.shippingZip
          },
          shipping_method: formData.shippingMethod,
          shipping_cost: selectedRate?.price || 0,
          shipping_carrier: selectedRate?.carrier,
          shipping_rates: selectedRate ? [selectedRate] : undefined
        }),
        ...(deliveryMethod === 'pickup' && {
          pickup_date: formData.pickupDate?.toISOString(),
          pickup_time: formData.pickupTime,
          pickup_notes: formData.instructions,
        })
      };

      console.log('[Checkout] Creating pending order in Supabase', {
        orderId,
        orderType: orderData.order_type,
        itemCount: orderData.items.length,
        total: orderData.total_amount
      });

      try {
        const order = await supabaseOrders.createOrder(orderData);
        console.log('[Checkout] Pending order created:', {
          orderId: order.order_id,
          status: order.status
        });
      } catch (error) {
        console.error('[Checkout] Failed to create order:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.cause : undefined
        });
        toast({
          title: "Order Creation Failed",
          description: "There was an error creating your order. Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Prepare the checkout payload for Stripe
      const checkoutPayload = {
        orderId,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        userId: user?.id,
        items: formData.items,
        total: formData.total,
        deliveryMethod,
        address: deliveryMethod === "delivery"
          ? {
              street: formData.address,
              city: formData.city,
              state: "NY",
              zipCode: formData.zipCode,
            }
          : deliveryMethod === "shipping"
          ? {
              street: formData.shippingAddress,
              city: formData.shippingCity,
              state: formData.shippingState,
              zipCode: formData.shippingZip,
            }
          : null,
        deliveryDateTime: formData.deliveryDate
          ? format(formData.deliveryDate, "yyyy-MM-dd HH:mm:ss")
          : undefined,
        pickupDateTime: formData.pickupDate
          ? format(formData.pickupDate, "yyyy-MM-dd HH:mm:ss")
          : undefined,
        selectedRate,
        instructions: formData.instructions,
        paymentMethod: "card"
      };

      console.log('[Checkout] Initiating Stripe checkout', {
        orderId,
        deliveryMethod,
        hasAddress: Boolean(checkoutPayload.address)
      });

      let paymentResponse;
      try {
        paymentResponse = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(checkoutPayload),
        });

        if (!paymentResponse.ok) {
          const errorData = await paymentResponse.json();
          console.error('[Checkout] Checkout API error:', {
            status: paymentResponse.status,
            statusText: paymentResponse.statusText,
            error: errorData
          });
          throw new Error(errorData.error || "Failed to create payment");
        }

        const { redirectUrl } = await paymentResponse.json();
        if (!redirectUrl) {
          console.error('[Checkout] Missing redirect URL in response');
          throw new Error('No redirect URL received');
        }

        // Store the order ID in localStorage for reference
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastOrderId', orderId);
          console.log('[Checkout] Stored order ID in localStorage:', orderId);
        }

        console.log('[Checkout] Redirecting to Stripe checkout:', redirectUrl);
        window.location.href = redirectUrl;
      } catch (error) {
        console.error("[Checkout] Error processing payment:", {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        toast({
          title: "Payment Processing Failed",
          description: error instanceof Error ? error.message : "Failed to process payment. Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("[Checkout] Error processing payment:", {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRateSelect = (rate: ShippingRate) => {
    setSelectedRate(rate);
    setFormData((prev) => ({
      ...prev,
      shippingMethod: rate.name,
      deliveryMethod: "shipping",
      // Remove any delivery fees when shipping is selected
      deliveryFee: undefined,
      freeDeliveryThreshold: undefined,
      isDeliveryFree: false,
    }));
  };

  // Update the handleAddressSelect function
  const handleAddressSelect = (
    addressData: any,
    type: "delivery" | "shipping"
  ) => {
    if (type === "delivery") {
      setFormData((prev) => ({
        ...prev,
        address: addressData.street,
        city: addressData.city,
        zipCode: addressData.zipCode,
      }));

      // Update delivery fee for local delivery
      if (addressData.zipCode) {
        updateDeliveryFee(addressData.zipCode, subtotal);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        shippingAddress: addressData.street,
        shippingCity: addressData.city,
        shippingState: addressData.state,
        shippingZip: addressData.zipCode,
      }));

      // Reset selected rate when shipping address changes
      setSelectedRate(null);
    }
  };

  const handleDeliverySelect = async (
    date: Date,
    timeSlot: { startTime: string; endTime: string }
  ) => {
    setFormData((prev) => ({
      ...prev,
      deliveryDate: date,
      deliveryTime: `${timeSlot.startTime}-${timeSlot.endTime}`,
    }));

    if (formData.zipCode) {
      await updateDeliveryFee(formData.zipCode, subtotal);
    }
  };

  const handleRewardRedeem = async (reward: any) => {
    if (!session?.user) {
      console.error('[Checkout] Attempted to redeem reward without active session');
      toast({
        title: "Authentication Required",
        description: "Please log in to redeem rewards",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('[Checkout] Redeeming reward:', {
        rewardId: reward.reward_id,
        userId: session.user.id
      });

      await rewardsService.redeemReward(session.user.id, reward.reward_id);
      addRedeemedReward(reward.reward_id);

      // Add the redeemed item to cart with proper type
      const rewardItem: GlobalCartItem = {
        id: reward.reward_id,
        name: reward.name,
        price: 0, // Free because redeemed with points
        quantity: 1,
        originalPrice: reward.price,
        isRedeemed: true,
        pointsCost: reward.pointsCost,
      };

      addItem(rewardItem);

      // Refresh points after redemption
      const newPoints = await rewardsService.getUserPoints(session.user.id);
      console.log('[Checkout] Points updated after redemption:', newPoints);
      setUserPoints(newPoints);

      toast({
        title: "Reward Applied",
        description: `${reward.name} has been applied to your order!`,
      });
    } catch (error) {
      console.error("[Checkout] Failed to redeem reward:", {
        error: error instanceof Error ? error.message : 'Unknown error',
        rewardId: reward.reward_id
      });
      toast({
        title: "Error",
        description: "Failed to apply reward. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRewardRemove = async (reward: any) => {
    if (!session?.user) {
      console.error('[Checkout] Attempted to remove reward without active session');
      toast({
        title: "Authentication Required",
        description: "Please log in to manage rewards",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('[Checkout] Removing reward:', {
        rewardId: reward.reward_id,
        userId: session.user.id
      });

      // Remove the reward from redeemed rewards
      removeRedeemedReward(reward.reward_id);

      // Remove the reward item from cart
      removeItem(reward.reward_id);

      // Refresh points
      const newPoints = await rewardsService.getUserPoints(session.user.id);
      console.log('[Checkout] Points updated after removal:', newPoints);
      setUserPoints(newPoints);

      toast({
        title: "Reward Removed",
        description: `${reward.name} has been removed from your order.`,
      });
    } catch (error) {
      console.error("[Checkout] Failed to remove reward:", {
        error: error instanceof Error ? error.message : 'Unknown error',
        rewardId: reward.reward_id
      });
      toast({
        title: "Error",
        description: "Failed to remove reward. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentRedirect = (redirectUrl: string) => {
    if (typeof window !== "undefined") {
      // Use router.push for internal URLs, window.location.href for external URLs
      if (redirectUrl.startsWith(window.location.origin)) {
        router.push(redirectUrl);
      } else {
        // For external URLs (like Stripe checkout), use window.location.href
        window.location.href = redirectUrl;
      }
    }
  };

  // Update the payment method change handler
  const handlePaymentMethodChange = (value: "cash" | "card") => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: value,
    }));
  };

  // Replace borough-based delivery day fetching with ZIP code based
  useEffect(() => {
    const handleZipCodeChange = async () => {
      if (formData.zipCode) {
        await updateDeliveryFee(formData.zipCode, subtotal);
        await fetchDeliveryDays();
      }
    };

    handleZipCodeChange();
  }, [formData.zipCode, subtotal]);

  const fetchDeliveryDays = async () => {
    if (!formData.zipCode) return;

    try {
      // Only fetch delivery days, don't fetch fee here since it's handled elsewhere
      const days = await DeliveryClient.getDeliveryDays(formData.zipCode);
      setDeliveryDays(days);
    } catch (error) {
      console.error("Error fetching delivery information:", error);
      toast({
        title: "Error",
        description: "Failed to fetch delivery information",
        variant: "destructive",
      });
    }
  };

  // Update the Calendar component's modifiers
  const isDeliveryDayAvailable = (date: Date) => {
    if (!formData.zipCode) return false;
    const dayOfWeek = date.getDay();
    const deliveryDay = deliveryDays.find(
      (day) => day.dayOfWeek === dayOfWeek && day.zipCode === formData.zipCode
    );
    return deliveryDay?.isEnabled || false;
  };

  // Move renderDeliveryFee inside the component
  const renderDeliveryFee = () => {
    if (!formData.deliveryFee && formData.deliveryFee !== 0) return null;

    if (formData.isDeliveryFree) {
      return <span className="text-green-600 font-medium">Free Delivery!</span>;
    }

    return (
      <div className="flex flex-col">
        <span>{formatCurrency(formData.deliveryFee || 0)}</span>
        {formData.freeDeliveryThreshold &&
          formData.total < formData.freeDeliveryThreshold && (
            <span className="text-sm text-muted-foreground">
              Add{" "}
              {formatCurrency(formData.freeDeliveryThreshold - formData.total)}{" "}
              for free delivery
            </span>
          )}
      </div>
    );
  };

  // Add this function before the return statement in CheckoutPage
  const fetchAvailablePickupTimes = async (date: Date) => {
    try {
      console.log("Fetching pickup times for date:", date);
      setAvailablePickupTimes([]); // Clear existing times while loading
      const response = await fetch(
        `/api/pickup/slots?storeId=default-store&date=${date.toISOString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch pickup times");
      const data = await response.json();
      console.log("Received pickup slots data:", data);

      if (!data.slots || !Array.isArray(data.slots)) {
        console.error("Invalid slots data structure:", data);
        throw new Error("Invalid pickup slots data");
      }

      // Sort slots by start time
      const sortedSlots = data.slots.sort(
        (a: { startTime: string }, b: { startTime: string }) => {
          return a.startTime.localeCompare(b.startTime);
        }
      );

      console.log("Sorted available slots:", sortedSlots);
      setAvailablePickupTimes(sortedSlots);
    } catch (error) {
      console.error("Error fetching pickup times:", error);
      toast({
        title: "Error",
        description: "Failed to load available pickup times. Please try again.",
        variant: "destructive",
      });
      setAvailablePickupTimes([]);
    }
  };

  // Add useEffect to fetch times when date changes
  useEffect(() => {
    if (formData.pickupDate) {
      fetchAvailablePickupTimes(new Date(formData.pickupDate));
    }
  }, [formData.pickupDate]);

  useEffect(() => {
    const fetchStoreSettings = async () => {
      try {
        const response = await fetch(
          "/api/pickup/settings?storeId=default-store"
        );
        if (!response.ok) throw new Error("Failed to fetch store settings");
        const data = await response.json();
        setStoreSettings(data.settings);
      } catch (error) {
        console.error("Error fetching store settings:", error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchStoreSettings();
  }, []);

  // Remove the session check effect and replace with this simpler version
  useEffect(() => {
    if (!isLoadingAuth) {
      if (!session) {
        console.log('[Checkout] No active session, redirecting to signin');
        const currentPath = '/checkout';
        const redirectUrl = `/auth/signin?redirectTo=${encodeURIComponent(currentPath)}`;
        localStorage.setItem('checkoutRedirect', 'true');
        router.push(redirectUrl);
        return;
      }
    }
  }, [isLoadingAuth, session, router]);

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Verifying your session...</p>
          <p className="text-sm text-muted-foreground">This should only take a moment.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <GooglePlacesScript />
      {isClient ? (
        <>
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              {[
                { id: "contact", label: "Contact Info" },
                {
                  id: "delivery",
                  label:
                    deliveryMethod === "delivery"
                      ? "Delivery Details"
                      : "Shipping Details",
                },
              ].map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      currentStep === step.id
                        ? "bg-primary text-white"
                        : "bg-gray-200"
                    )}
                  >
                    {index + 1}
                  </div>
                  <div className="ml-2">{step.label}</div>
                  {index === 0 && <div className="h-1 w-16 bg-gray-200 mx-4" />}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mb-6">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Cart
            </Button>
          </div>

          {/* Checkout Form */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Order Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div
                    key={`${item.id}-${item.selectedVariation?.name}`}
                    className="flex justify-between"
                  >
                    <span>
                      {item.name}{" "}
                      {item.selectedVariation &&
                        `(${item.selectedVariation.name})`}{" "}
                      x {item.quantity}
                      {item.isRedeemed && (
                        <Badge variant="secondary" className="ml-2">
                          Reward
                        </Badge>
                      )}
                    </span>
                    <span>
                      ${((item.price || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}

                {/* Available Rewards Section */}
                {user && (
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Rewards Summary</h3>
                      <Badge variant="outline" className="text-base">
                        Current Points: {userPoints?.toLocaleString() || 0}
                      </Badge>
                    </div>

                    <div className="bg-muted p-4 rounded-lg space-y-4">
                      {/* Points to be earned */}
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">
                            Points You'll Earn
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Added to your account after order completion
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-base">
                          +{estimatedPoints.toLocaleString()}
                        </Badge>
                      </div>

                      {/* Redeemed Rewards */}
                      {redeemedRewards.length > 0 && (
                        <div className="border-t pt-4">
                          <p className="text-sm font-medium mb-2">
                            Redeemed Rewards
                          </p>
                          <div className="space-y-2">
                            {redeemedRewards.map((rewardId) => {
                              const reward = availableRewards.find(
                                (r) => r.reward_id === rewardId
                              );
                              if (!reward) return null;
                              return (
                                <div
                                  key={reward.reward_id}
                                  className="flex justify-between items-center"
                                >
                                  <span className="text-sm">{reward.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                      -{reward.pointsCost.toLocaleString()}{" "}
                                      points
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRewardRemove(reward)}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Available Rewards */}
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-2">
                          Available Rewards
                        </p>
                        {availableRewards.length > 0 ? (
                          <ScrollArea className="h-48">
                            <div className="space-y-3">
                              {availableRewards
                                .filter(
                                  (reward) =>
                                    !redeemedRewards.includes(reward.reward_id)
                                )
                                .map((reward) => {
                                  const canRedeem =
                                    userPoints >= (reward.pointsCost || 0);
                                  return (
                                    <Card
                                      key={reward.reward_id}
                                      className="p-3"
                                    >
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <p className="font-medium">
                                            {reward.name}
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            {(
                                              reward.pointsCost || 0
                                            ).toLocaleString()}{" "}
                                            points
                                          </p>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant={
                                            canRedeem ? "outline" : "secondary"
                                          }
                                          disabled={!canRedeem}
                                          onClick={() =>
                                            handleRewardRedeem(reward)
                                          }
                                        >
                                          {canRedeem
                                            ? "Apply"
                                            : "Not Enough Points"}
                                        </Button>
                                      </div>
                                    </Card>
                                  );
                                })}
                            </div>
                          </ScrollArea>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No rewards available at the moment
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {renderDeliveryFee()}
                  <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(calculatedTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Steps */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {currentStep === "contact" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name" className="text-foreground">
                            Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={cn(
                              "text-foreground",
                              errors.name && "border-red-500"
                            )}
                            required
                            aria-describedby={
                              errors.name ? "name-error" : undefined
                            }
                          />
                          {errors.name && (
                            <p
                              className="mt-1 text-sm text-red-500"
                              id="name-error"
                            >
                              {errors.name}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="email" className="text-foreground">
                            Email <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={cn(
                              "text-foreground",
                              errors.email && "border-red-500"
                            )}
                            required
                            aria-describedby={
                              errors.email ? "email-error" : undefined
                            }
                          />
                          {errors.email && (
                            <p
                              className="mt-1 text-sm text-red-500"
                              id="email-error"
                            >
                              {errors.email}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="phone" className="text-foreground">
                            Phone <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="(123) 456-7890"
                            className={cn(
                              "text-foreground",
                              errors.phone && "border-red-500"
                            )}
                            required
                            aria-describedby={
                              errors.phone ? "phone-error" : undefined
                            }
                          />
                          {errors.phone && (
                            <p
                              className="mt-1 text-sm text-red-500"
                              id="phone-error"
                            >
                              {errors.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-6">
                        <Button
                          type="button"
                          onClick={() => {
                            const contactErrors = validateContactInfo(formData);
                            if (Object.keys(contactErrors).length > 0) {
                              setErrors(contactErrors);
                              toast({
                                title: "Missing Information",
                                description:
                                  "Please fill in all required contact information",
                                variant: "destructive",
                              });
                              return;
                            }
                            setErrors({});
                            goToStep("delivery");
                          }}
                          className="w-full"
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === "delivery" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Tabs
                      defaultValue="delivery"
                      onValueChange={(value) => {
                        handleDeliveryMethodChange(value as DeliveryMethod);
                      }}
                    >
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="delivery">
                          Local Delivery
                        </TabsTrigger>
                        <TabsTrigger value="shipping">Shipping</TabsTrigger>
                        <TabsTrigger value="pickup">Pickup</TabsTrigger>
                      </TabsList>
                      <TabsContent value="delivery" className="space-y-4 mt-4">
                        <DeliverySection
                          onDeliveryInfoChange={handleDeliveryInfoChange}
                          subtotal={subtotal}
                          errors={errors}
                          isDeliveryAddress={true}
                        />
                        {formData.deliveryFee && (
                          <p className="text-sm text-muted-foreground">
                            Delivery Fee: {formatCurrency(formData.deliveryFee)}
                          </p>
                        )}
                      </TabsContent>

                      <TabsContent value="shipping" className="space-y-4">
                        <div className="space-y-4">
                          <div>
                            <Label>Shipping Address</Label>
                            <AddressInput
                              onAddressSelect={(addressData) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  shippingAddress: addressData.street,
                                  shippingApartment: addressData.apartment,
                                  shippingCity: addressData.city,
                                  shippingState: addressData.state,
                                  shippingZip: addressData.zipCode,
                                }));
                              }}
                              error={errors.shippingAddress}
                              isDeliveryAddress={false}
                            />
                            {errors.shippingAddress && (
                              <p className="text-sm text-red-500 mt-1">
                                {errors.shippingAddress}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="shippingCity">City</Label>
                              <Input
                                id="shippingCity"
                                value={formData.shippingCity}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    shippingCity: e.target.value,
                                  }))
                                }
                                placeholder="City"
                                readOnly
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="shippingState">State</Label>
                              <Input
                                id="shippingState"
                                value={formData.shippingState}
                                placeholder="State"
                                readOnly
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="shippingZip">ZIP Code</Label>
                            <Input
                              id="shippingZip"
                              value={formData.shippingZip}
                              placeholder="ZIP Code"
                              readOnly
                            />
                          </div>

                          <div className="mt-6">
                            <Label>Shipping Options</Label>
                            {formData.shippingAddress &&
                              formData.shippingCity &&
                              formData.shippingState &&
                              formData.shippingZip && (
                                <div className="mt-4">
                                  <RateSelector
                                    address={{
                                      street1: formData.shippingAddress,
                                      city: formData.shippingCity,
                                      state: formData.shippingState,
                                      zipCode: formData.shippingZip,
                                    }}
                                    items={items}
                                    onRateSelect={(rate: ShippingRate) => {
                                      handleRateSelect(rate);
                                    }}
                                    customerName={formData.name}
                                    email={formData.email}
                                  />
                                </div>
                              )}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="pickup" className="space-y-4">
                        <div className="space-y-2">
                          <Label>Pickup Date</Label>
                          <div className="grid gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !formData.pickupDate &&
                                      "text-muted-foreground",
                                    errors.pickupDate && "border-red-500"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {formData.pickupDate ? (
                                    format(formData.pickupDate, "MM/dd/yyyy")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-[350px] p-0"
                                align="start"
                              >
                                <div className="p-3 bg-background rounded-md">
                                  <Calendar
                                    mode="single"
                                    selected={formData.pickupDate}
                                    onSelect={(date) => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        pickupDate: date,
                                      }));
                                    }}
                                    disabled={(date) => {
                                      if (isLoadingSettings || !storeSettings)
                                        return true;

                                      const today = new Date();
                                      today.setHours(0, 0, 0, 0);

                                      // Prevent past dates
                                      if (date < today) return true;

                                      // Check if date is within advance booking days
                                      const maxDate = new Date();
                                      maxDate.setDate(
                                        maxDate.getDate() +
                                          (storeSettings.advance_booking_days ||
                                            7)
                                      );
                                      if (date > maxDate) return true;

                                      // Check if it's a holiday
                                      const isHoliday =
                                        storeSettings.holiday_dates?.some(
                                          (h: any) =>
                                            new Date(h.date).toDateString() ===
                                              date.toDateString() && !h.isOpen
                                        );
                                      if (isHoliday) return true;

                                      // Check regular schedule
                                      const dayOfWeek = date.toLocaleDateString(
                                        "en-US",
                                        { weekday: "long" }
                                      );
                                      const daySchedule =
                                        storeSettings.schedule?.find(
                                          (s: any) =>
                                            s.day_of_week === dayOfWeek
                                        );

                                      return !daySchedule?.is_open;
                                    }}
                                    className="w-full"
                                    classNames={{
                                      months: "w-full",
                                      month: "w-full",
                                      table: "w-full",
                                      head_row: "grid grid-cols-7",
                                      head_cell:
                                        "text-muted-foreground text-sm font-medium w-full h-9 flex items-center justify-center",
                                      row: "grid grid-cols-7",
                                      cell: "h-9 w-full p-0 relative flex items-center justify-center",
                                      day: cn(
                                        "h-9 w-9 p-0 font-normal text-[15px] rounded-md",
                                        "aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground",
                                        "data-[today]:bg-accent/50 data-[disabled]:opacity-50 data-[disabled]:pointer-events-none"
                                      ),
                                      day_selected:
                                        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                      day_today:
                                        "bg-accent text-accent-foreground",
                                      day_outside:
                                        "text-muted-foreground opacity-50",
                                      day_disabled:
                                        "text-muted-foreground opacity-50 pointer-events-none",
                                      day_hidden:
                                        "invisible pointer-events-none",
                                    }}
                                    modifiers={{
                                      pickup: (date) => {
                                        const day = date.getDay();
                                        return [3, 5, 6].includes(day); // Highlight Wednesday, Friday, Saturday
                                      },
                                    }}
                                    modifiersStyles={{
                                      pickup: {
                                        fontWeight: "bold",
                                        backgroundColor: "var(--primary)",
                                        color: "white",
                                        borderRadius: "4px",
                                      },
                                    }}
                                    initialFocus
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          {errors.pickupDate && (
                            <p className="text-sm text-red-500">
                              {errors.pickupDate}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pickupTime">Pickup Time</Label>
                          <Select
                            value={formData.pickupTime}
                            onValueChange={handlePickupTimeChange}
                          >
                            <SelectTrigger
                              id="pickupTime"
                              className={cn(
                                errors.pickupTime ? "border-red-500" : "",
                                "w-full"
                              )}
                            >
                              <SelectValue>
                                {formData.pickupTime
                                  ? formData.pickupTime
                                      .split("-")
                                      .map((time, i) =>
                                        format(
                                          parse(time, "HH:mm", new Date()),
                                          "h:mm a"
                                        )
                                      )
                                      .join(" - ")
                                  : "Select pickup time"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {availablePickupTimes.length === 0 ? (
                                <SelectItem value="none" disabled>
                                  No time slots available
                                </SelectItem>
                              ) : (
                                availablePickupTimes
                                  .filter((slot) => slot.isAvailable)
                                  .map((slot) => (
                                    <SelectItem
                                      key={`${slot.startTime}-${slot.endTime}`}
                                      value={`${slot.startTime}-${slot.endTime}`}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span>
                                          {format(
                                            parse(
                                              slot.startTime,
                                              "HH:mm",
                                              new Date()
                                            ),
                                            "h:mm a"
                                          )}{" "}
                                          -{" "}
                                          {format(
                                            parse(
                                              slot.endTime,
                                              "HH:mm",
                                              new Date()
                                            ),
                                            "h:mm a"
                                          )}
                                        </span>
                                        {slot.maxOrders - slot.currentOrders <
                                          3 && (
                                          <Badge
                                            variant="secondary"
                                            className="ml-2"
                                          >
                                            {slot.maxOrders -
                                              slot.currentOrders}{" "}
                                            slots left
                                          </Badge>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))
                              )}
                            </SelectContent>
                          </Select>
                          {errors.pickupTime && (
                            <p className="text-sm text-red-500">
                              {errors.pickupTime}
                            </p>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => goToStep("contact")}
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          Continue to Payment
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </form>
          </div>
        </>
      ) : null}
    </div>
  );
}

function validateForm(
  formData: FormData,
  deliveryMethod: DeliveryMethod
): FormErrors {
  const errors: FormErrors = {};

  // Validate contact info first
  const contactErrors = validateContactInfo(formData);
  Object.assign(errors, contactErrors);

  if (deliveryMethod === "delivery") {
    if (!formData.address?.trim()) {
      errors.address = "Address is required";
    }
    if (!formData.zipCode?.trim()) {
      errors.zipCode = "ZIP code is required";
    } else if (!/^\d{5}$/.test(formData.zipCode)) {
      errors.zipCode = "Please enter a valid 5-digit ZIP code";
    }
    if (!formData.deliveryDate) {
      errors.deliveryDate = "Delivery date is required";
    }
    if (!formData.deliveryTime) {
      errors.deliveryTime = "Delivery time is required";
    }
  } else if (deliveryMethod === "shipping") {
    const shippingErrors = validateShippingAddress(formData);
    Object.assign(errors, shippingErrors);
  } else if (deliveryMethod === "pickup") {
    if (!formData.pickupDate) {
      errors.pickupDate = "Pickup date is required";
    }
    if (!formData.pickupTime) {
      errors.pickupTime = "Pickup time is required";
    }
  }

  return errors;
}

function generateOrderId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

function validateContactInfo(formData: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!formData.name?.trim()) {
    errors.name = "Name is required";
  } else if (!/^[a-zA-Z\s-']+$/.test(formData.name)) {
    errors.name = "Please enter a valid name";
  }

  if (!formData.email?.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Invalid email format";
  }

  if (!formData.phone?.trim()) {
    errors.phone = "Phone number is required";
  } else if (
    !/^\+?1?\s*\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/.test(
      formData.phone
    )
  ) {
    errors.phone = "Please enter a valid phone number";
  }

  return errors;
}

function validateShippingAddress(formData: ShippingFormData): FormErrors {
  const errors: FormErrors = {};

  // Address validation
  if (!formData.shippingAddress?.trim()) {
    errors.shippingAddress = "Shipping address is required";
  } else if (formData.shippingAddress.length < 5) {
    errors.shippingAddress = "Please enter a valid street address";
  }

  // City validation
  if (!formData.shippingCity?.trim()) {
    errors.shippingCity = "City is required";
  } else if (!/^[a-zA-Z\s-]+$/.test(formData.shippingCity)) {
    errors.shippingCity = "Please enter a valid city name";
  }

  // State validation
  if (!formData.shippingState?.trim()) {
    errors.shippingState = "State is required";
  } else if (!/^[A-Z]{2}$/.test(formData.shippingState.toUpperCase())) {
    errors.shippingState = "Please enter a valid 2-letter state code";
  }

  // ZIP code validation
  if (!formData.shippingZip?.trim()) {
    errors.shippingZip = "ZIP code is required";
  } else if (!/^\d{5}(-\d{4})?$/.test(formData.shippingZip)) {
    errors.shippingZip = "Please enter a valid ZIP code (12345 or 12345-6789)";
  }

  return errors;
}
