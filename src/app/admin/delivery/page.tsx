"use client";

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
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/components/ui/use-toast"
import type { DeliveryOrder } from "@/types/orders"

export default function DeliveryManagementPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [view, setView] = useState<"table" | "calendar">("table")
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/delivery-orders")
      if (!response.ok) throw new Error("Failed to fetch orders")
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error",
        description: "Failed to fetch delivery orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter orders based on search query
  const filteredOrders = orders.filter(order => 
    order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate statistics
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
  const pendingOrders = orders.filter(order => order.status === "pending").length
  const processingOrders = orders.filter(order => order.status === "processing").length

  return (
    <div className="container mx-auto p-6">
      <AdminHeader
        heading="Delivery Management"
        text="Manage and track delivery orders"
      />

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle and Search */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <Button
            variant={view === "table" ? "default" : "outline"}
            onClick={() => setView("table")}
          >
            Table View
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            onClick={() => setView("calendar")}
          >
            Calendar View
          </Button>
        </div>
        <Input
          placeholder="Search delivery orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={() => setSearchQuery("")}>
          Clear
        </Button>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No delivery orders found.</AlertDescription>
        </Alert>
      ) : view === "table" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Borough</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.orderId}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{order.city}</TableCell>
                    <TableCell>{order.items.length} items</TableCell>
                    <TableCell>${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      {format(new Date(order.deliveryDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === "completed"
                            ? "default"
                            : order.status === "processing"
                            ? "secondary"
                            : "outline"
                        }
                        className="capitalize"
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <Calendar
              mode="single"
              selected={new Date()}
              className="rounded-md border"
            />
            {/* TODO: Add calendar view implementation */}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
