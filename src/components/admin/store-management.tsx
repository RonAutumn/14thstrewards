"use client";

import { memo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import dynamic from "next/dynamic";
import type { User } from "@supabase/auth-helpers-nextjs";

const ProductsTable = dynamic(
  () => import("./products-table").then((mod) => mod.ProductsTable),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

const CategoriesTable = dynamic(
  () => import("./categories-table").then((mod) => mod.CategoriesTable),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

const InventoryTable = dynamic(
  () => import("./inventory-table").then((mod) => mod.InventoryTable),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

const TabContent = memo(function TabContent({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
});

interface StoreManagementProps {
  user: User;
}

export function StoreManagement({ user }: StoreManagementProps) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="products">
        <div className="flex items-center justify-between">
          <TabsList className="w-[600px] grid grid-cols-3">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="products" className="mt-4">
          <TabContent
            title="Products Management"
            description="Manage your store products, pricing, and details."
          >
            <ProductsTable user={user} />
          </TabContent>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <TabContent
            title="Categories Management"
            description="Manage your product categories and organization."
          >
            <CategoriesTable user={user} />
          </TabContent>
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <TabContent
            title="Inventory Management"
            description="Track and manage product stock levels, set alerts, and handle restocking."
          >
            <InventoryTable user={user} />
          </TabContent>
        </TabsContent>
      </Tabs>
    </div>
  );
}
