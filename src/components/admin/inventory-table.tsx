"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

type InventoryItem = {
  id: string;
  productName: string;
  sku: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  lastRestocked: string;
};

export function InventoryTable() {
  const [searchQuery, setSearchQuery] = useState("");

  // Placeholder data - replace with actual data fetching
  const inventoryItems: InventoryItem[] = [
    {
      id: "1",
      productName: "Product 1",
      sku: "SKU001",
      currentStock: 50,
      minStockLevel: 10,
      maxStockLevel: 100,
      status: "In Stock",
      lastRestocked: "2024-02-20",
    },
    // Add more items as needed
  ];

  const getStatusColor = (status: InventoryItem["status"]) => {
    switch (status) {
      case "In Stock":
        return "bg-green-500";
      case "Low Stock":
        return "bg-yellow-500";
      case "Out of Stock":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button>Update Stock</Button>
        <Button variant="outline">Export</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Min Level</TableHead>
              <TableHead>Max Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Restocked</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventoryItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.productName}</TableCell>
                <TableCell>{item.sku}</TableCell>
                <TableCell>{item.currentStock}</TableCell>
                <TableCell>{item.minStockLevel}</TableCell>
                <TableCell>{item.maxStockLevel}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>{item.lastRestocked}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
