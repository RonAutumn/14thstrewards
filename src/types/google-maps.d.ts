declare namespace google.maps.places {
  interface Autocomplete {
    addListener(eventName: string, handler: () => void): void;
    getPlace(): google.maps.places.PlaceResult;
  }

  interface AutocompleteOptions {
    componentRestrictions?: {
      country: string | string[];
    };
    fields?: string[];
    types?: string[];
  }

  interface PlaceResult {
    address_components?: google.maps.GeocoderAddressComponent[];
    formatted_address?: string;
  }
}

declare namespace google.maps {
  interface GeocoderAddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
  }

  namespace event {
    function clearInstanceListeners(instance: any): void;
  }
} 