import { NextResponse } from 'next/server';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';

const USPS_USER_ID = process.env.USPS_USER_ID;
const USPS_API_URL = 'https://secure.shippingapis.com/ShippingAPI.dll';

interface AddressValidationRequest {
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
}

export async function POST(request: Request) {
  try {
    if (!USPS_USER_ID) {
      console.warn('USPS_USER_ID not configured, using basic validation');
      return basicValidation(request);
    }

    const body: AddressValidationRequest = await request.json();

    // Basic validation first
    if (!body.address_line1 || !body.city || !body.state || !body.zip_code) {
      return NextResponse.json({
        isValid: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Build XML request
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true
    });

    const xmlObj = {
      'AddressValidateRequest': {
        '@_USERID': USPS_USER_ID,
        'Address': {
          'Address1': body.address_line2 || '',
          'Address2': body.address_line1,
          'City': body.city,
          'State': body.state,
          'Zip5': body.zip_code.split('-')[0],
          'Zip4': body.zip_code.split('-')[1] || ''
        }
      }
    };

    const xml = builder.build(xmlObj);

    // Make request to USPS API
    const response = await fetch(`${USPS_API_URL}?API=Verify&XML=${encodeURIComponent(xml)}`);
    const responseText = await response.text();

    // Parse response
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true
    });

    const result = parser.parse(responseText);

    // Check for errors
    if (result.Error) {
      console.error('USPS API Error:', result.Error);
      return NextResponse.json({
        isValid: false,
        error: result.Error.Description || 'Address validation failed'
      }, { status: 400 });
    }

    const address = result.AddressValidateResponse?.Address;
    if (!address) {
      return NextResponse.json({
        isValid: false,
        error: 'Invalid address'
      }, { status: 400 });
    }

    // If we get here, the address is valid
    return NextResponse.json({
      isValid: true,
      standardizedAddress: {
        address_line1: address.Address2,
        address_line2: address.Address1,
        city: address.City,
        state: address.State,
        zip_code: `${address.Zip5}${address.Zip4 ? '-' + address.Zip4 : ''}`
      }
    });
  } catch (error) {
    console.error('Error validating address:', error);
    return NextResponse.json({
      isValid: false,
      error: 'Address validation failed'
    }, { status: 500 });
  }
}

// Fallback validation when USPS API is not configured
async function basicValidation(request: Request) {
  try {
    const body: AddressValidationRequest = await request.json();

    // Check required fields
    if (!body.address_line1 || !body.city || !body.state || !body.zip_code) {
      return NextResponse.json({
        isValid: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Basic ZIP code format validation
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(body.zip_code)) {
      return NextResponse.json({
        isValid: false,
        error: 'Invalid ZIP code format'
      }, { status: 400 });
    }

    // Basic state validation (2 letter code)
    const stateRegex = /^[A-Z]{2}$/;
    if (!stateRegex.test(body.state.toUpperCase())) {
      return NextResponse.json({
        isValid: false,
        error: 'Invalid state format'
      }, { status: 400 });
    }

    // If we get here, the basic validation passed
    return NextResponse.json({
      isValid: true,
      standardizedAddress: {
        ...body,
        state: body.state.toUpperCase()
      }
    });
  } catch (error) {
    console.error('Error in basic address validation:', error);
    return NextResponse.json({
      isValid: false,
      error: 'Address validation failed'
    }, { status: 500 });
  }
} 