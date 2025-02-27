"use client"

import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import type { DeliveryOrder } from "@/types/orders"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isEqual,
  isSameMonth,
  isToday,
  parse,
  startOfMonth,
  startOfToday,
} from "date-fns"

interface PickupCalendarProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

export function PickupCalendar({ selectedDate, onDateSelect }: PickupCalendarProps) {
  const today = startOfToday()
  const [currentMonth, setCurrentMonth] = useState(format(today, "MMM-yyyy"))
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date())
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/delivery-orders')
        if (!response.ok) throw new Error('Failed to fetch orders')
        const data = await response.json()
        setOrders(data.orders)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load delivery orders"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [toast])

  const getOrdersForDate = (date: Date) => {
    return orders.filter(order => {
      if (!order.deliveryDate) return false;
      const orderDate = new Date(order.deliveryDate);
      return orderDate.toDateString() === date.toDateString();
    });
  }

  const days = eachDayOfInterval({
    start: startOfMonth(firstDayCurrentMonth),
    end: endOfMonth(firstDayCurrentMonth),
  })

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  if (loading) {
    return (
      <Card className="h-full bg-card border-border shadow-none">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg font-medium">Pickup Schedule</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Skeleton className="h-[400px] w-full rounded-md bg-muted" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full bg-card border-border shadow-none">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle>{format(firstDayCurrentMonth, "MMMM yyyy")}</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={previousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={nextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 text-center text-sm">
          <div className="py-3 text-muted-foreground">S</div>
          <div className="py-3 text-muted-foreground">M</div>
          <div className="py-3 text-muted-foreground">T</div>
          <div className="py-3 text-muted-foreground">W</div>
          <div className="py-3 text-muted-foreground">T</div>
          <div className="py-3 text-muted-foreground">F</div>
          <div className="py-3 text-muted-foreground">S</div>
        </div>
        <div className="grid grid-cols-7 text-sm">
          {days.map((day, dayIdx) => {
            const firstDayOfMonth = startOfMonth(firstDayCurrentMonth)
            const prevMonthDays = getDay(firstDayOfMonth)
            return (
              <div
                key={day.toString()}
                className={cn(
                  "flex items-center justify-center p-2",
                  dayIdx === 0 && `col-start-${getDay(day) + 1}`,
                  "relative py-3 hover:bg-muted/50 cursor-pointer",
                  !isSameMonth(day, firstDayCurrentMonth) &&
                    "text-muted-foreground",
                  isEqual(day, selectedDate) && "bg-primary text-primary-foreground",
                  isToday(day) && !isEqual(day, selectedDate) && "text-primary",
                )}
                onClick={() => onDateSelect(day)}
              >
                <time dateTime={format(day, "yyyy-MM-dd")}>
                  {format(day, "d")}
                </time>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
