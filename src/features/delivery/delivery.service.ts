import { createServerClient } from '@/lib/supabase/server';

interface TimeWindow {
  startTime: string;
  endTime: string;
  date: string;  // ISO string format
}

interface DeliveryDay {
  id: string;
  date: string;
  status: 'open' | 'closed';
  max_slots: number;
  notes?: string;
}

interface DeliveryFee {
  zip_code: string;
  delivery_fee: number;
  free_delivery_threshold: number;
  active_status: boolean;
}

interface AvailableDeliveryDay {
  date: string;
  is_available: boolean;
  reason: string;
}

interface DeliveryFeeInfo {
  fee: number;
  freeDeliveryThreshold: number;
  isDeliveryFree: boolean;
}

export class DeliveryService {
  static async getDeliveryDays(zipCode?: string) {
    try {
      const supabase = createServerClient();
      
      if (!zipCode) {
        throw new Error('ZIP code is required');
      }

      // First check if the ZIP code has any active delivery fees
      const { data: fees, error: feeError } = await supabase
        .from('delivery_fees')
        .select('*')
        .eq('zip_code', zipCode)
        .eq('active_status', true);

      if (feeError) throw feeError;
      if (!fees || fees.length === 0) {
        return []; // No delivery available for this ZIP code
      }

      // Get delivery days from the delivery_days table
      const { data: deliveryDays, error: daysError } = await supabase
        .from('delivery_days')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .eq('status', 'open')
        .order('date');

      if (daysError) throw daysError;

      // Get ZIP code restrictions for specific days
      const { data: restrictions, error: restrictionsError } = await supabase
        .from('delivery_zip_restrictions')
        .select('*')
        .eq('zip_code', zipCode)
        .eq('is_available', true);

      if (restrictionsError) throw restrictionsError;

      // If there are specific restrictions, filter days accordingly
      if (restrictions && restrictions.length > 0) {
        const allowedDays = new Set(restrictions.map(r => r.day_of_week));
        return (deliveryDays || [])
          .filter(day => {
            const dayOfWeek = new Date(day.date).getDay();
            return allowedDays.has(dayOfWeek);
          })
          .map(day => ({
            id: day.id,
            date: new Date(day.date).toISOString(),
            status: 'open' as const,
            max_slots: day.max_slots,
            notes: 'Available for delivery'
          }));
      }

      // If no specific restrictions, all days are available
      return (deliveryDays || []).map(day => ({
        id: day.id,
        date: new Date(day.date).toISOString(),
        status: 'open' as const,
        max_slots: day.max_slots,
        notes: 'Available for delivery'
      }));

    } catch (error) {
      console.error('Error getting delivery days:', error);
      throw error;
    }
  }

  static async getDeliveryFeeByZipCode(zipCode: string, subtotal: number): Promise<DeliveryFeeInfo> {
    try {
      const supabase = createServerClient();
      const { data: fees, error } = await supabase
        .from('delivery_fees')
        .select('*')
        .eq('zip_code', zipCode)
        .eq('active_status', true);

      if (error) throw error;
      if (!fees || fees.length === 0) {
        throw new Error(`No delivery fee configuration found for zip code: ${zipCode}`);
      }

      const fee = fees[0];
      const isDeliveryFree = subtotal >= fee.free_delivery_threshold;

      return {
        fee: isDeliveryFree ? 0 : fee.delivery_fee,
        freeDeliveryThreshold: fee.free_delivery_threshold,
        isDeliveryFree
      };
    } catch (error) {
      console.error('Error getting delivery fee for zip code:', error);
      throw error;
    }
  }

  static async getAvailableDates(zipCode: string, startDate: Date): Promise<Date[]> {
    try {
      const supabase = createServerClient();
      
      // First check if delivery is available for this ZIP code
      const { data: fees, error: feeError } = await supabase
        .from('delivery_fees')
        .select('*')
        .eq('zip_code', zipCode)
        .eq('active_status', true);

      if (feeError) {
        console.error('Error fetching delivery fees:', feeError);
        throw feeError;
      }

      if (!fees || fees.length === 0) {
        console.log('No delivery fees found for zip code:', zipCode);
        return []; // No delivery available for this ZIP code
      }

      // Get all delivery days
      const { data: deliveryDays, error: daysError } = await supabase
        .from('delivery_days')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .eq('status', 'open')
        .order('date');

      if (daysError) {
        console.error('Error fetching delivery days:', daysError);
        throw daysError;
      }

      if (!deliveryDays || deliveryDays.length === 0) {
        console.log('No delivery days found');
        return [];
      }

      // Get ZIP code restrictions
      const { data: restrictions, error: restrictionsError } = await supabase
        .from('delivery_zip_restrictions')
        .select('*')
        .eq('zip_code', zipCode)
        .eq('is_available', true);

      if (restrictionsError) {
        console.error('Error fetching zip restrictions:', restrictionsError);
        throw restrictionsError;
      }

      // If there are no restrictions, all days are available
      if (!restrictions || restrictions.length === 0) {
        console.log('No restrictions found - all days available');
        return deliveryDays
          .map(day => new Date(day.date))
          .sort((a, b) => a.getTime() - b.getTime());
      }

      // If there are restrictions, filter by allowed days
      const availableDates = deliveryDays
        .filter(day => {
          const dayOfWeek = new Date(day.date).getDay();
          return restrictions.some(r => r.day_of_week === dayOfWeek);
        })
        .map(day => new Date(day.date))
        .sort((a, b) => a.getTime() - b.getTime());

      console.log(`Found ${availableDates.length} available dates for zip code ${zipCode}`);
      
      if (availableDates.length === 0) {
        console.log('No available dates found after filtering');
      }

      return availableDates;
    } catch (error) {
      console.error('Error getting available dates:', error);
      throw new Error(`Failed to fetch available dates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getAvailableTimeSlots(date: Date, zipCode: string) {
    try {
      const supabase = createServerClient();
      const formattedDate = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();

      // First check if delivery is available for this ZIP code
      const { data: fees, error: feeError } = await supabase
        .from('delivery_fees')
        .select('*')
        .eq('zip_code', zipCode)
        .eq('active_status', true);

      if (feeError) throw feeError;
      if (!fees || fees.length === 0) {
        return []; // No delivery available for this ZIP code
      }

      // Check ZIP code restrictions for this day
      const { data: restrictions } = await supabase
        .from('delivery_zip_restrictions')
        .select('*')
        .eq('zip_code', zipCode)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);

      // If there are restrictions and this day is not allowed, return no slots
      if (restrictions && restrictions.length > 0 && !restrictions.some(r => r.day_of_week === dayOfWeek)) {
        return [];
      }

      // Get available slots for the specific date
      const { data: availableSlots, error } = await supabase
        .from('available_delivery_slots')
        .select('*')
        .eq('delivery_date', formattedDate)
        .eq('status', 'active')
        .gt('available_slots', 0);

      if (error) throw error;

      // Format the slots as expected by the calendar component
      return (availableSlots || []).map(slot => ({
        startTime: slot.start_time.slice(0, 5), // Convert "HH:MM:SS" to "HH:MM"
        endTime: slot.end_time.slice(0, 5), // Convert "HH:MM:SS" to "HH:MM"
        maxOrders: slot.available_slots
      }));
    } catch (error) {
      console.error('Error getting available time slots:', error);
      throw error;
    }
  }
} 