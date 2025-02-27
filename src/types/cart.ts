export interface CartItemVariation {
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  selectedVariation?: {
    name: string;
    price?: number;
  };
  weight?: number; // Weight in ounces
  dimensions?: {
    length: number;
    width: number;
    height: number;
    units: 'inches';
  };
  // Reward-related properties
  originalPrice?: number;
  isRedeemed?: boolean;
  pointsCost?: number;
}

export interface CartState {
  items: CartItem[];
  redeemedRewards: string[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  addRedeemedReward: (rewardId: string) => void;
  removeRedeemedReward: (rewardId: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
  created: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  components?: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
}
