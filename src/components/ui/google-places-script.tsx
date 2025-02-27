"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useToast } from "./use-toast";

export default function GooglePlacesScript() {
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      console.error("Google Maps API key is not configured");
      toast({
        title: "Configuration Error",
        description:
          "Address lookup is currently unavailable. Please contact support.",
        variant: "destructive",
      });
    }
  }, [apiKey, toast]);

  const handleError = () => {
    console.error("Failed to load Google Maps script");
    toast({
      title: "Error",
      description:
        "Failed to load address lookup service. Please try again later.",
      variant: "destructive",
    });
  };

  if (!apiKey) return null;

  return (
    <Script
      src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
      onLoad={() => setIsLoaded(true)}
      onError={handleError}
      strategy="afterInteractive"
    />
  );
}
