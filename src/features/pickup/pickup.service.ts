import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PickupSettings, PickupSchedule, TimeSlot } from '@/types/pickup';

export class PickupService {
  private static async getSupabaseClient() {
    return await createServerSupabaseClient();
  }

  // Transform database schedule to application format
  private static transformSchedule(dbSchedule: any[]) {
    return dbSchedule.map(day => ({
      dayOfWeek: day.day_of_week,
      isOpen: day.is_open,
      openTime: day.open_time,
      closeTime: day.close_time,
      maxOrdersPerSlot: day.max_orders_per_slot,
      slotDuration: day.slot_duration,
      // Add these for compatibility with the frontend
      day_of_week: day.day_of_week,
      is_open: day.is_open,
      open_time: day.open_time,
      close_time: day.close_time,
      max_orders_per_slot: day.max_orders_per_slot,
      slot_duration: day.slot_duration
    }));
  }

  // Transform database settings to application format
  private static transformSettings(dbSettings: any) {
    if (!dbSettings) return null;
    
    return {
      storeId: dbSettings.store_id,
      isPickupEnabled: dbSettings.is_pickup_enabled,
      defaultMaxOrdersPerSlot: dbSettings.default_max_orders_per_slot,
      defaultSlotDuration: dbSettings.default_slot_duration,
      advanceBookingDays: dbSettings.advance_booking_days,
      minAdvanceBookingHours: dbSettings.min_advance_booking_hours,
      schedule: this.transformSchedule(dbSettings.schedule),
      holidayDates: dbSettings.holiday_dates || [],
      specialHours: dbSettings.special_hours || [],
      // Add these for compatibility with the frontend
      store_id: dbSettings.store_id,
      is_pickup_enabled: dbSettings.is_pickup_enabled,
      default_max_orders_per_slot: dbSettings.default_max_orders_per_slot,
      default_slot_duration: dbSettings.default_slot_duration,
      advance_booking_days: dbSettings.advance_booking_days,
      min_advance_booking_hours: dbSettings.min_advance_booking_hours,
      holiday_dates: dbSettings.holiday_dates || [],
      special_hours: dbSettings.special_hours || []
    };
  }

  // Initialize store pickup settings
  static async initializeStoreSettings(storeId: string) {
    const supabase = await this.getSupabaseClient();
    const defaultSchedule = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ].map(day => ({
      day_of_week: day,
      is_open: day !== 'Sunday',
      open_time: '10:00',
      close_time: '19:00',
      max_orders_per_slot: 5,
      slot_duration: 30
    }));

    const settings = {
      store_id: storeId,
      is_pickup_enabled: true,
      default_max_orders_per_slot: 5,
      default_slot_duration: 30,
      advance_booking_days: 7,
      min_advance_booking_hours: 1,
      schedule: defaultSchedule,
      holiday_dates: [],
      special_hours: []
    };

    const { data, error } = await supabase
      .from('pickup_settings')
      .upsert(settings)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get store pickup settings
  static async getStoreSettings(storeId: string) {
    const supabase = await this.getSupabaseClient();
    const { data, error } = await supabase
      .from('pickup_settings')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (error) throw error;
    return this.transformSettings(data);
  }

  // Update store pickup settings
  static async updateStoreSettings(storeId: string, updates: Partial<PickupSettings>) {
    const supabase = await this.getSupabaseClient();
    const { data, error } = await supabase
      .from('pickup_settings')
      .update(updates)
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Generate time slots for a specific day
  static async generateTimeSlotsForDay(storeId: string, date: Date) {
    console.log('Generating time slots for:', { storeId, date });
    
    const settings = await this.getStoreSettings(storeId);
    if (!settings) throw new Error('Store settings not found');

    // Get existing slots from database
    const supabase = await this.getSupabaseClient();
    const { data: existingSlots } = await supabase
      .from('pickup_slots')
      .select('*')
      .eq('store_id', storeId)
      .eq('date', date.toISOString().split('T')[0]);

    if (existingSlots && existingSlots.length > 0) {
      // Transform existing slots to application format
      return existingSlots.map(slot => ({
        startTime: slot.start_time.slice(0, 5),
        endTime: slot.end_time.slice(0, 5),
        maxOrders: slot.max_orders,
        currentOrders: slot.current_orders,
        isAvailable: slot.is_available
      }));
    }

    // If no slots exist, generate new ones based on schedule
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedule = settings.schedule.find(s => s.day_of_week === dayOfWeek);
    
    if (!daySchedule || !daySchedule.is_open) {
      console.log('Day is not open:', dayOfWeek);
      return [];
    }

    const slots: TimeSlot[] = [];
    const openTime = new Date(date);
    const [openHours, openMinutes] = daySchedule.open_time.split(':').map(Number);
    openTime.setHours(openHours, openMinutes, 0, 0);

    const closeTime = new Date(date);
    const [closeHours, closeMinutes] = daySchedule.close_time.split(':').map(Number);
    closeTime.setHours(closeHours, closeMinutes, 0, 0);

    const currentTime = new Date(openTime);

    while (currentTime < closeTime) {
      const slotEnd = new Date(currentTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + settings.defaultSlotDuration);

      if (slotEnd <= closeTime) {
        // Create the slot in database
        const { data: newSlot } = await supabase
          .from('pickup_slots')
          .insert({
            store_id: storeId,
            date: date.toISOString().split('T')[0],
            start_time: currentTime.toTimeString().slice(0, 8),
            end_time: slotEnd.toTimeString().slice(0, 8),
            max_orders: settings.defaultMaxOrdersPerSlot,
            current_orders: 0,
            is_available: true
          })
          .select()
          .single();

        if (newSlot) {
          const formattedSlot = {
            startTime: newSlot.start_time.slice(0, 5),
            endTime: newSlot.end_time.slice(0, 5),
            maxOrders: newSlot.max_orders,
            currentOrders: newSlot.current_orders,
            isAvailable: newSlot.is_available
          };
          console.log('Created new slot:', formattedSlot);
          slots.push(formattedSlot);
        }
      }

      currentTime.setTime(slotEnd.getTime());
    }

    console.log('Generated slots:', slots);
    return slots;
  }

  // Get available pickup slots for a date range
  static async getAvailablePickupSlots(storeId: string, startDate: Date, endDate: Date) {
    const settings = await this.getStoreSettings(storeId);
    if (!settings) throw new Error('Store settings not found');

    const slots: { date: Date; slots: TimeSlot[] }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const daySlots = await this.generateTimeSlotsForDay(storeId, new Date(currentDate));
      slots.push({
        date: new Date(currentDate),
        slots: daySlots
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  // Update time slot availability
  static async updateTimeSlotAvailability(
    storeId: string, 
    date: Date, 
    startTime: string, 
    endTime: string, 
    increment: boolean
  ) {
    const settings = await this.getStoreSettings(storeId);
    if (!settings) throw new Error('Store settings not found');

    // Get the day's slots
    const daySlots = await this.generateTimeSlotsForDay(storeId, date);
    const slot = daySlots.find(s => s.start_time === startTime && s.end_time === endTime);

    if (!slot) {
      throw new Error('Time slot not found');
    }

    // Update slot capacity
    if (increment) {
      slot.current_orders += 1;
      slot.is_available = slot.current_orders < slot.max_orders;
    } else {
      slot.current_orders = Math.max(0, slot.current_orders - 1);
      slot.is_available = true;
    }

    // Update the slot in the database
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const updatedSchedule = settings.schedule.map(day => {
      if (day.day_of_week === dayOfWeek) {
        return {
          ...day,
          time_slots: day.time_slots.map(ts => 
            ts.start_time === startTime && ts.end_time === endTime
              ? slot
              : ts
          )
        };
      }
      return day;
    });

    const supabase = await this.getSupabaseClient();
    const { data, error } = await supabase
      .from('pickup_settings')
      .update({ schedule: updatedSchedule })
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get time slot capacity
  static async getTimeSlotCapacity(
    storeId: string,
    date: Date,
    startTime: string,
    endTime: string
  ) {
    const daySlots = await this.generateTimeSlotsForDay(storeId, date);
    const slot = daySlots.find(s => s.start_time === startTime && s.end_time === endTime);

    if (!slot) {
      throw new Error('Time slot not found');
    }

    return {
      current_orders: slot.current_orders,
      max_orders: slot.max_orders,
      is_available: slot.is_available
    };
  }

  // Validate time slot availability
  static async validateTimeSlot(
    storeId: string,
    date: Date,
    startTime: string,
    endTime: string
  ) {
    const settings = await this.getStoreSettings(storeId);
    if (!settings) throw new Error('Store settings not found');

    // Check if pickup is enabled
    if (!settings.isPickupEnabled) {
      throw new Error('Pickup is currently disabled');
    }

    // Check advance booking days
    const today = new Date();
    const daysDiff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > settings.advanceBookingDays) {
      throw new Error(`Cannot book more than ${settings.advanceBookingDays} days in advance`);
    }

    // Check minimum advance booking hours
    const hoursDiff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60));
    if (hoursDiff < settings.minAdvanceBookingHours) {
      throw new Error(`Must book at least ${settings.minAdvanceBookingHours} hours in advance`);
    }

    // Check slot availability
    const supabase = await this.getSupabaseClient();
    const { data: slot } = await supabase
      .from('pickup_slots')
      .select('*')
      .eq('store_id', storeId)
      .eq('date', date.toISOString().split('T')[0])
      .eq('start_time', startTime)
      .eq('end_time', endTime)
      .single();

    if (!slot) {
      throw new Error('Time slot not found');
    }

    if (!slot.is_available) {
      throw new Error('Time slot is not available');
    }

    if (slot.current_orders >= slot.max_orders) {
      throw new Error('Time slot is fully booked');
    }

    return true;
  }

  // Update holiday dates
  static async updateHolidayDates(storeId: string, holidays: { date: Date; reason?: string; is_open: boolean }[]) {
    const supabase = await this.getSupabaseClient();
    const { data, error } = await supabase
      .from('pickup_settings')
      .update({ holiday_dates: holidays })
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update special hours
  static async updateSpecialHours(
    storeId: string, 
    specialHours: { date: Date; open_time: string; close_time: string; reason?: string }[]
  ) {
    const supabase = await this.getSupabaseClient();
    const { data, error } = await supabase
      .from('pickup_settings')
      .update({ special_hours: specialHours })
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
} 