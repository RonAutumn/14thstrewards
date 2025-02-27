"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminHeader } from "@/components/admin/header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { ShippingOrder } from "@/types/orders"
import type { ShippingRate } from "@/types/shipping"

interface OrderDetailsProps {
  order: ShippingOrder
  onClose: () => void
}

function OrderDetails({ order, onClose }: OrderDetailsProps) {
  const [isCreatingLabel, setIsCreatingLabel] = useState(false)
  const { toast } = useToast()

  // Parse items if they're stored as a string
  const items = typeof order.items === 'string' 
    ? JSON.parse(order.items) 
    : Array.isArray(order.items) 
      ? order.items 
      : [];

  const handleCreateLabel = async () => {
    if (!order.shippingRate?.id) {
      toast({
        title: "Error",
        description: "No shipping rate selected for this order",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreatingLabel(true)
      const response = await fetch(`/api/shipping-orders/${order.id}/label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rateId: order.shippingRate.id }),
      })

      if (!response.ok) throw new Error('Failed to create shipping label')

      const data = await response.json()
      
      toast({
        title: "Success",
        description: "Shipping label created successfully",
      })

      // Close the dialog after successful label creation
      onClose()
    } catch (error) {
      console.error('Error creating label:', error)
      toast({
        title: "Error",
        description: "Failed to create shipping label",
        variant: "destructive",
      })
    } finally {
      setIsCreatingLabel(false)
    }
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Order #{order.orderId}
        </DialogTitle>
      </DialogHeader>
      <ScrollArea className="max-h-[80vh]">
        <div className="grid gap-4 py-4">
          {/* Customer Information */}
          <div>
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p>{order.customerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p>{order.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p>{order.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Order Date</p>
                <p>{format(new Date(order.timestamp), 'PPP')}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Shipping Information */}
          <div>
            <h3 className="font-semibold mb-2">Shipping Information</h3>
            <div className="grid gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Address</p>
                <p>{order.deliveryAddress}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-muted-foreground">City</p>
                  <p>{order.city}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">State</p>
                  <p>{order.state}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ZIP Code</p>
                  <p>{order.zipCode}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge 
                  variant={
                    order.status === 'completed' ? 'default' :
                    order.status === 'processing' ? 'secondary' :
                    'outline'
                  } 
                  className="capitalize mt-1"
                >
                  {order.status}
                </Badge>
              </div>
              {order.trackingNumber && (
                <div>
                  <p className="text-muted-foreground">Tracking Number</p>
                  <p>{order.trackingNumber}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Shipping Method</p>
                <p>{order.shippingMethod || 'Not selected'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Shipping Fee</p>
                <p>${order.shippingFee?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-2">Order Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2} className="text-right font-medium">Subtotal</TableCell>
                  <TableCell className="text-right font-medium">${order.total.toFixed(2)}</TableCell>
                </TableRow>
                {order.shippingRate && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-right font-medium">Shipping</TableCell>
                    <TableCell className="text-right font-medium">${order.shippingRate.price.toFixed(2)}</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell colSpan={2} className="text-right font-medium">Total</TableCell>
                  <TableCell className="text-right font-medium">
                    ${(order.total + (order.shippingRate?.price || 0)).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Shipping Actions */}
          <Separator />
          <div>
            {order.status === 'pending' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Selected Shipping Method</h3>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleCreateLabel}
                    disabled={isCreatingLabel || !order.shippingRate}
                  >
                    {isCreatingLabel ? "Creating Label..." : "Create Label"}
                  </Button>
                </div>
                {order.shippingRate ? (
                  <div className="p-4 border rounded-lg bg-accent/50">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{order.shippingRate.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Estimated delivery: {order.shippingRate.estimatedDays} days
                        </p>
                      </div>
                      <p className="font-medium">${order.shippingRate.price.toFixed(2)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No shipping method selected</p>
                )}
              </div>
            ) : order.status === 'processing' && order.labelUrl ? (
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(order.labelUrl, '_blank')}
                >
                  Print Label
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </ScrollArea>
    </DialogContent>
  )
}

export default function ShippingManagementPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Shipping Management</h2>
      </div>
      <div className="grid gap-4">
        <div className="rounded-md border p-6">
          <h3 className="text-lg font-medium">Shipping Orders</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Shipping management interface is under development.
          </p>
        </div>
      </div>
    </div>
  );
} 