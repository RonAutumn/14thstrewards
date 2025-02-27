import { ShipmentDetails, ShipmentResponse, ShippingRate, ShippingLabel, TrackingInfo } from '@/types/shipstation';

const SHIPSTATION_API_URL = process.env.SHIPSTATION_API_URL;
const SHIPSTATION_API_KEY = process.env.SHIPSTATION_API_KEY;
const SHIPSTATION_API_SECRET = process.env.SHIPSTATION_API_SECRET;

function validateShipStationConfig() {
    const missingVars = [];
    if (!SHIPSTATION_API_URL) missingVars.push('SHIPSTATION_API_URL');
    if (!SHIPSTATION_API_KEY) missingVars.push('SHIPSTATION_API_KEY');
    if (!SHIPSTATION_API_SECRET) missingVars.push('SHIPSTATION_API_SECRET');
    
    if (missingVars.length > 0) {
        throw new Error(`Missing ShipStation configuration: ${missingVars.join(', ')}`);
    }
}

// Validate config immediately
validateShipStationConfig();

const headers = {
    'Authorization': 'Basic ' + Buffer.from(`${SHIPSTATION_API_KEY}:${SHIPSTATION_API_SECRET}`).toString('base64'),
    'Content-Type': 'application/json'
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Add cache implementation
const rateCache = new Map<string, { rates: ShippingRate[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_WINDOW = 1000; // 1 second
let lastRequestTime = 0;

async function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    retries = MAX_RETRIES
): Promise<T> {
    try {
        const response = await fetch(url, options);
        return await handleShipStationResponse<T>(response);
    } catch (error) {
        if (retries > 0) {
            console.log(`Retrying ShipStation API call. Attempts remaining: ${retries - 1}`);
            await wait(RETRY_DELAY);
            return fetchWithRetry<T>(url, options, retries - 1);
        }
        throw error;
    }
}

async function handleShipStationResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorText = await response.text();
        console.error('ShipStation API error:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
        });
        throw new Error(`ShipStation API error: ${response.statusText}. ${errorText}`);
    }
    return response.json();
}

export async function createShipment(details: ShipmentDetails): Promise<ShipmentResponse> {
    console.log('Creating shipment with details:', JSON.stringify(details, null, 2));

    return fetchWithRetry<ShipmentResponse>(
        `${SHIPSTATION_API_URL}/orders/createorder`,
        {
            method: 'POST',
            headers,
            body: JSON.stringify(details)
        }
    );
}

export async function getShippingRates(shipmentId: string): Promise<ShippingRate[]> {
    console.log('Fetching rates for shipment:', shipmentId);

    return fetchWithRetry<ShippingRate[]>(
        `${SHIPSTATION_API_URL}/shipments/${shipmentId}/rates`,
        {
            method: 'GET',
            headers
        }
    );
}

export async function createShippingLabel(
    shipmentId: string,
    rateId: string
): Promise<ShippingLabel> {
    console.log('Creating shipping label for shipment:', shipmentId, 'with rate:', rateId);

    return fetchWithRetry<ShippingLabel>(
        `${SHIPSTATION_API_URL}/shipments/${shipmentId}/createlabel`,
        {
            method: 'POST',
            headers,
            body: JSON.stringify({ rateId })
        }
    );
}

export async function getTrackingInfo(trackingNumber: string): Promise<TrackingInfo> {
    console.log('Fetching tracking info for:', trackingNumber);

    const response = await fetch(`${SHIPSTATION_API_URL}/shipments/track`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ trackingNumber })
    });

    return handleShipStationResponse<TrackingInfo>(response);
}

export async function voidShippingLabel(shipmentId: string): Promise<void> {
    console.log('Voiding shipping label for shipment:', shipmentId);

    const response = await fetch(`${SHIPSTATION_API_URL}/shipments/${shipmentId}/voidlabel`, {
        method: 'POST',
        headers
    });

    return handleShipStationResponse<void>(response);
}

export interface GetRatesRequest {
    carrierCode: string;
    fromPostalCode: string;
    toPostalCode: string;
    toState: string;
    toCountry: string;
    weight: {
        value: number;
        units: string;
    };
    dimensions?: {
        length: number;
        width: number;
        height: number;
        units: string;
    };
}

async function enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < RATE_LIMIT_WINDOW) {
        const waitTime = RATE_LIMIT_WINDOW - timeSinceLastRequest;
        await wait(waitTime);
    }
    
    lastRequestTime = Date.now();
}

export async function getRatesForPackage(details: {
    carrierCode: string;
    fromPostalCode: string;
    toPostalCode: string;
    toState: string;
    toCountry: string;
    weight: { value: number; units: string; };
    dimensions?: { length: number; width: number; height: number; units: string; };
}): Promise<ShippingRate[]> {
    // Generate cache key
    const cacheKey = JSON.stringify({
        ...details,
        timestamp: Math.floor(Date.now() / CACHE_TTL) // Round to nearest cache window
    });

    // Check cache
    const cached = rateCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('Returning cached rates for:', details.carrierCode);
        return cached.rates;
    }

    // Enforce rate limit
    await enforceRateLimit();

    console.log('Fetching fresh rates with details:', details);
    
    try {
        const rates = await fetchFromShipStation('/shipments/getrates', {
            method: 'POST',
            body: JSON.stringify({
                carrierCode: details.carrierCode,
                serviceCode: null,
                fromPostalCode: details.fromPostalCode,
                toPostalCode: details.toPostalCode,
                toState: details.toState,
                toCountry: details.toCountry,
                weight: details.weight,
                dimensions: details.dimensions,
                packageCode: 'package',
                confirmation: 'none',
                residential: true
            }),
        });

        // Cache the results
        rateCache.set(cacheKey, {
            rates,
            timestamp: Date.now()
        });

        return rates;
    } catch (error) {
        if (cached) {
            console.warn('Failed to fetch fresh rates, using stale cache:', error);
            return cached.rates;
        }
        throw error;
    }
}

async function fetchFromShipStation(endpoint: string, options: RequestInit) {
    const apiKey = process.env.SHIPSTATION_API_KEY;
    const apiSecret = process.env.SHIPSTATION_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new Error('ShipStation API credentials not configured');
    }

    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const response = await fetch(`${SHIPSTATION_API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('ShipStation API error:', {
            status: response.status,
            statusText: response.statusText,
            body: error
        });
        throw new Error(`ShipStation API error: ${response.statusText}. ${error}`);
    }

    return response.json();
} 