export interface ShippingRate {
    id: string;
    name: string;
    price: number;
    estimatedDays: number | null;
    carrier: 'usps' | 'ups';
    serviceCode: string;
}

export interface ShippingAddress {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export interface ShippingItem {
    id: string;
    name: string;
    quantity: number;
    price?: number;
    weight?: number;
    dimensions?: {
        length: number;
        width: number;
        height: number;
        units: 'inches' | 'centimeters';
    };
}

export interface ShippingRateResponse {
    success: boolean;
    rates: {
        usps: ShippingRate[];
        ups: ShippingRate[];
    };
    error?: string;
}

export interface ShippingSettings {
    zipCode: string;
    weight?: number;
    selectedRateId?: string;
} 