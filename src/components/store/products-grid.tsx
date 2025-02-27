"use client";

import { Product } from "@/types/product";
import { ProductCard } from "./product-card";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { BackgroundGradient } from "@/components/ui/background-gradient";

export function ProductsGrid({
  products,
  categories = [],
}: {
  products: Product[];
  categories?: Array<{ id: string; displayOrder?: number }>;
}) {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category");

  const filteredProducts = useMemo(() => {
    const activeProducts = products.filter((product) => product.isActive);
    if (!selectedCategory) return activeProducts;

    return activeProducts.filter(
      (product) =>
        product.category?.includes(selectedCategory) ||
        product.categoryNames?.includes(selectedCategory)
    );
  }, [products, selectedCategory]);

  const sortedProducts = useMemo(() => {
    if (!categories.length) return filteredProducts;

    const categoryOrders = new Map(
      categories.map((cat) => [cat.id, cat.displayOrder || Infinity])
    );

    return [...filteredProducts].sort((a, b) => {
      const aOrder = Math.min(
        ...(a.category?.map((id) => categoryOrders.get(id) || Infinity) || [
          Infinity,
        ])
      );
      const bOrder = Math.min(
        ...(b.category?.map((id) => categoryOrders.get(id) || Infinity) || [
          Infinity,
        ])
      );
      return aOrder - bOrder;
    });
  }, [filteredProducts, categories]);

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No products found in this category.
        </p>
      </div>
    );
  }

  return (
    <BackgroundGradient
      className="rounded-[2.5rem] p-1"
      containerClassName="w-full"
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-8 rounded-[2.5rem] bg-[#1a1f2d]">
        {sortedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </BackgroundGradient>
  );
}
