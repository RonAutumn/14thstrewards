'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface OrderStatusResponse {
    success: boolean;
    message: string;
    orderType?: string;
    orderId: string;
    orderData: any;
}

export default function SuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 2000; // 2 seconds

    const orderId = searchParams.get('orderId');

    useEffect(() => {
        if (!orderId) {
            router.push('/');
            return;
        }

        const verifyOrder = async () => {
            try {
                // Call the checkout-status endpoint to verify and update the order
                const response = await fetch(`/api/checkout-status?orderId=${orderId}&status=success`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json() as OrderStatusResponse;

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to verify order');
                }

                if (data.success) {
                    // If order was already processed, just redirect
                    if (data.message === 'Order already processed' && data.orderData) {
                        router.push(`/order-confirmation?orderId=${orderId}&orderData=${encodeURIComponent(JSON.stringify(data.orderData))}`);
                        return;
                    }
                    
                    // For newly processed orders
                    router.push(`/order-confirmation?orderId=${orderId}&orderData=${encodeURIComponent(JSON.stringify(data.orderData))}`);
                } else if (retryCount < MAX_RETRIES) {
                    // If we haven't reached max retries, try again after delay
                    setRetryCount(prev => prev + 1);
                    setTimeout(verifyOrder, RETRY_DELAY);
                } else {
                    // Max retries reached, show error
                    toast({
                        title: "Error",
                        description: data.message || "Failed to update order status after multiple attempts. Please contact support.",
                        variant: "destructive"
                    });
                }
            } catch (error) {
                console.error('Order verification error:', error);
                if (retryCount < MAX_RETRIES) {
                    setRetryCount(prev => prev + 1);
                    setTimeout(verifyOrder, RETRY_DELAY);
                } else {
                    toast({
                        title: "Error",
                        description: error instanceof Error ? error.message : "Failed to verify order. Please contact support.",
                        variant: "destructive"
                    });
                }
            }
        };

        verifyOrder();
    }, [orderId, retryCount, router, toast]);

    return (
        <div className="container mx-auto p-4 flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center">
                        {retryCount < MAX_RETRIES ? 'Processing Order' : 'Error'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    {retryCount < MAX_RETRIES ? (
                        <>
                            <p className="mb-4">Please wait while we verify your order...</p>
                            <div className="flex justify-center">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">Attempt {retryCount + 1} of {MAX_RETRIES}...</p>
                        </>
                    ) : (
                        <>
                            <p className="text-red-500 mb-4">Failed to update order status after multiple attempts</p>
                            <Button onClick={() => router.push('/')} variant="outline">
                                Return to Home
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 