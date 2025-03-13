"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useToast } from "./use-toast";

declare global {
  interface Window {
    google?: any;
    initGooglePlaces?: () => void;
  }
}

export default function GooglePlacesScript() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const { toast } = useToast();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

  useEffect(() => {
    // Define the initialization function before loading the script
    window.initGooglePlaces = function() {
      console.log('Google Places API initialized');
      setIsLoaded(true);
    };

    // Check if the script is already loaded
    if (typeof window !== 'undefined' && window.google?.maps) {
      setIsLoaded(true);
      setShouldRender(false);
      return;
    }

    if (!apiKey) {
      console.error("Google Maps API key is not configured");
      toast({
        title: "Configuration Error",
        description:
          "Address lookup is currently unavailable. Please contact support.",
        variant: "destructive",
      });
      setShouldRender(false);
    }

    // Cleanup function to remove the global function when component unmounts
    return () => {
      if (typeof window !== 'undefined') {
        delete window.initGooglePlaces;
      }
    };
  }, [apiKey, toast]);

  const handleError = (error: Error) => {
    console.error("Failed to load Google Maps script:", error);
    toast({
      title: "Error",
      description:
        "Failed to load address lookup service. Please try again later.",
      variant: "destructive",
    });
  };

  // Don't render anything if we shouldn't
  if (!shouldRender) return null;

  return (
    <Script
      src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`}
      onError={handleError}
      strategy="afterInteractive"
    />
  );
}
