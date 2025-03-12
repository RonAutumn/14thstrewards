export interface TimeWindow {
  startTime: string;
  endTime: string;
  date: string;  // ISO string format
}

export interface DeliveryFeeInfo {
  fee: number;
  freeDeliveryThreshold: number;
  isDeliveryFree: boolean;
}

export class DeliveryClient {
  static async getDeliveryDays(zipCode: string) {
    const params = new URLSearchParams({
      action: 'getDeliveryDays',
      zipCode,
    });
    
    const response = await fetch(`/api/delivery?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch delivery days');
    }
    return response.json();
  }

  static async getDeliveryFeeByZipCode(zipCode: string, subtotal: number): Promise<DeliveryFeeInfo> {
    const params = new URLSearchParams({
      action: 'getDeliveryFee',
      zipCode,
      subtotal: subtotal.toString(),
    });
    
    const response = await fetch(`/api/delivery?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch delivery fee');
    }
    const data = await response.json();
    
    // Ensure we return the correct types
    return {
      fee: Number(data.fee) || 0,
      freeDeliveryThreshold: Number(data.freeDeliveryThreshold) || 0,
      isDeliveryFree: Boolean(data.isDeliveryFree)
    };
  }

  static async getAvailableTimeSlots(date: Date, zipCode: string) {
    const params = new URLSearchParams({
      action: 'getAvailableTimeSlots',
      date: date.toISOString().split('T')[0],
      zipCode,
    });
    
    const response = await fetch(`/api/delivery?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch time slots');
    }
    const data = await response.json();
    
    // The data is already formatted by the service, just return it
    return data;
  }

  static async getAvailableDates(zipCode: string, startDate: Date) {
    const params = new URLSearchParams({
      action: 'getAvailableDates',
      zipCode,
      startDate: startDate.toISOString(),
    });
    
    try {
      console.log('Fetching available dates for:', {
        zipCode,
        startDate: startDate.toISOString()
      });

      const response = await fetch(`/api/delivery?${params}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error
        });
        throw new Error(
          `Failed to fetch available dates: ${response.status} ${response.statusText}` +
          (errorData.error ? ` - ${errorData.error}` : '')
        );
      }

      const data = await response.json();
      console.log('Server response:', data);
      
      if (!data.dates || !Array.isArray(data.dates)) {
        console.error('Invalid response format - missing dates array:', data);
        throw new Error('Invalid response format from server');
      }

      // Convert string dates to Date objects
      const parsedDates = data.dates
        .map((dateStr: string) => {
          try {
            const date = new Date(dateStr);
            // Ensure the date is valid
            if (isNaN(date.getTime())) {
              console.error('Invalid date string:', dateStr);
              return null;
            }
            return date;
          } catch (error) {
            console.error('Error parsing date:', dateStr, error);
            return null;
          }
        })
        .filter((date: Date | null): date is Date => date !== null);

      console.log('Parsed dates:', {
        count: parsedDates.length,
        dates: parsedDates.map(d => d.toISOString())
      });
      
      return parsedDates;
    } catch (error) {
      console.error('Error in getAvailableDates:', error);
      throw error;
    }
  }

  static async updateDeliveryWindows(zipCode: string, windows: TimeWindow[]) {
    const response = await fetch('/api/delivery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'updateDeliveryWindows',
        zipCode,
        windows,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update delivery windows');
    }
    return response.json();
  }
} 