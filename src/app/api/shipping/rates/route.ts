import { NextResponse } from 'next/server';
import { getRatesForPackage } from '@/lib/shipstation';
import { ShippingRate } from '@/types/shipping';

interface RequestData {
    customerName?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    items?: Array<{
        id?: string;
        name?: string;
        quantity?: number;
        price?: number;
        weight?: number;
    }>;
}

interface ShipStationRate {
    serviceCode: string;
    serviceName: string;
    shipmentCost: number;
    transitDays: number;
}

// Default transit days for each service if not provided by API
const defaultTransitDays = {
    'usps_first_class_mail': 3,
    'usps_priority_mail': 2,
    'usps_priority_mail_express': 1,
    'ups_next_day_air': 1,
    'ups_2nd_day_air': 2,
    'ups_ground': 5
} as const;

const PACKAGING_FEE = 1.25;

async function fetchCarrierRates(params: {
    carrierCode: string;
    fromPostalCode: string;
    toPostalCode: string;
    toState: string;
    weight: { value: number; units: string };
    dimensions: { length: number; width: number; height: number; units: string };
}) {
    try {
        return await getRatesForPackage({ ...params, toCountry: 'US' });
    } catch (error) {
        console.error(`Error fetching rates for carrier ${params.carrierCode}:`, error);
        return [];
    }
}

export async function POST(request: Request) {
    try {
        const data: RequestData = await request.json();
        console.log('Received request data:', JSON.stringify(data, null, 2));

        // Validate required fields
        if (!data.zipCode || !data.state) {
            console.log('Missing required fields:', { zipCode: data.zipCode, state: data.state });
            return NextResponse.json(
                { error: 'Missing required shipping information' },
                { status: 400 }
            );
        }

        // Calculate total weight from items or use default
        const totalWeight = data.items?.reduce(
            (sum, item) => sum + ((item.weight || 1) * (item.quantity || 1)),
            0
        ) || 1;

        console.log('Calculated total weight:', totalWeight);

        const baseParams = {
            fromPostalCode: process.env.SHIPSTATION_FROM_ZIP || '10001',
            toPostalCode: data.zipCode,
            toState: data.state,
            weight: {
                value: totalWeight,
                units: 'ounces'
            },
            dimensions: {
                length: 12,
                width: 12,
                height: 12,
                units: 'inches'
            }
        };

        console.log('Base params for shipping:', JSON.stringify(baseParams, null, 2));

        // Fetch rates for both carriers concurrently
        console.log('Fetching carrier rates...');
        const [uspsRates, upsRates] = await Promise.all([
            fetchCarrierRates({ ...baseParams, carrierCode: 'stamps_com' }),
            fetchCarrierRates({ ...baseParams, carrierCode: 'ups_walleted' })
        ]);

        console.log('Raw USPS rates:', JSON.stringify(uspsRates, null, 2));
        console.log('Raw UPS rates:', JSON.stringify(upsRates, null, 2));

        // Process USPS rates
        const processedUspsRates = (uspsRates as ShipStationRate[])
            .filter(rate => [
                'usps_first_class_mail',
                'usps_priority_mail',
                'usps_priority_mail_express'
            ].includes(rate.serviceCode))
            .map(rate => ({
                id: rate.serviceCode,
                name: rate.serviceName,
                price: rate.shipmentCost,
                estimatedDays: rate.transitDays || defaultTransitDays[rate.serviceCode as keyof typeof defaultTransitDays] || null,
                carrier: 'usps' as const,
                serviceCode: rate.serviceCode
            }));

        // Process UPS rates
        const processedUpsRates = (upsRates as ShipStationRate[])
            .map(rate => ({
                id: rate.serviceCode,
                name: rate.serviceName,
                price: rate.shipmentCost,
                estimatedDays: rate.transitDays || defaultTransitDays[rate.serviceCode as keyof typeof defaultTransitDays] || null,
                carrier: 'ups' as const,
                serviceCode: rate.serviceCode
            }));

        const rates = {
            usps: processedUspsRates,
            ups: processedUpsRates
        };

        console.log('Final processed rates:', JSON.stringify(rates, null, 2));

        return NextResponse.json({
            success: true,
            rates
        });

    } catch (error) {
        console.error('Error fetching shipping rates:', error);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }
        return NextResponse.json(
            { 
                error: 'Failed to fetch shipping rates', 
                details: error instanceof Error ? error.message : 'Unknown error' 
            },
            { status: 500 }
        );
    }
} 