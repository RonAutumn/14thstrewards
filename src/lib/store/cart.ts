import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types/cart';

interface DeliveryFeeInfo {
  fee: number;
  borough: string | null;
  freeThreshold: number;
}

interface CartStore {
  items: CartItem[];
  deliveryInfo: DeliveryFeeInfo;
  redeemedRewards: string[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (id: string, variation: string | undefined, quantity: number) => void;
  updateDeliveryInfo: (info: { fee: number; borough: string; freeThreshold: number }) => void;
  addRedeemedReward: (rewardId: string) => void;
  removeRedeemedReward: (rewardId: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getDeliveryFee: () => number;
  getTotal: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryInfo: {
        fee: 0,
        borough: null,
        freeThreshold: 0
      },
      redeemedRewards: [],

      addItem: (item) => set((state) => {
        if (item.isRedeemed) {
          const existingItem = state.items.find((i) => i.id === item.id);
          if (existingItem) {
            return state;
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }

        const existingItem = state.items.find((i) => i.id === item.id);
        if (existingItem) {
          return {
            items: state.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          };
        }
        return { items: [...state.items, { ...item, quantity: 1 }] };
      }),

      removeItem: (itemId) => set((state) => {
        const item = state.items.find((i) => i.id === itemId);
        if (item?.isRedeemed) {
          return {
            items: state.items.filter((i) => i.id !== itemId),
            redeemedRewards: state.redeemedRewards.filter((id) => id !== itemId),
          };
        }
        return {
          items: state.items.filter((i) => i.id !== itemId),
        };
      }),

      updateQuantity: (id, variation, quantity) => {
        if (!id) return;

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id &&
              ((!item.selectedVariation && !variation) ||
                (item.selectedVariation?.name === variation))
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      updateDeliveryInfo: (info) => set((state) => ({
        deliveryInfo: info,
      })),

      addRedeemedReward: (rewardId) => set((state) => ({
        redeemedRewards: [...state.redeemedRewards, rewardId],
      })),

      removeRedeemedReward: (rewardId) => set((state) => ({
        redeemedRewards: state.redeemedRewards.filter((id) => id !== rewardId),
      })),

      clearCart: () => set({
        items: [],
        deliveryInfo: {
          fee: 0,
          borough: null,
          freeThreshold: 0
        },
        redeemedRewards: []
      }),

      getItemCount: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        const state = get();
        return state.items.reduce((total, item) => {
          const itemPrice = item.selectedVariation?.price ?? item.price ?? 0;
          return total + (itemPrice * item.quantity);
        }, 0);
      },

      getDeliveryFee: () => {
        const state = get();
        const subtotal = state.getSubtotal();
        if (!state.deliveryInfo.borough || subtotal >= state.deliveryInfo.freeThreshold) {
          return 0;
        }
        return state.deliveryInfo.fee;
      },

      getTotal: () => {
        const state = get();
        return state.getSubtotal() + state.getDeliveryFee();
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);

// Export individual functions for direct import
export const { addItem, removeItem } = useCart.getState();
