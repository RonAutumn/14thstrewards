"use client";

import { Product } from "@/types/product";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/lib/store/cart";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [selectedVariation, setSelectedVariation] = useState<
    string | undefined
  >();
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();
  const { toast } = useToast();

  // Get active variations with valid prices
  const validVariations =
    product.variations?.filter(
      (v) =>
        v.name &&
        v.name.trim() !== "" &&
        v.isActive &&
        typeof v.price === "number" &&
        v.price > 0
    ) || [];

  // Get the selected variation object
  const currentVariation = validVariations.find(
    (v) => v.name === selectedVariation
  );

  const handleAddToCart = () => {
    if (!currentVariation) return;

    setIsAdding(true);
    addItem({
      id: product.id,
      name: product.name,
      price: currentVariation.price || product.price || 0,
      selectedVariation: {
        name: currentVariation.name,
        price: currentVariation.price || 0,
      },
    });

    toast({
      title: "Added to cart",
      description: `${product.name}${
        selectedVariation ? ` - ${selectedVariation}` : ""
      } has been added to your cart.`,
    });
    setTimeout(() => setIsAdding(false), 1000);
  };

  return (
    <Card className="relative flex flex-col h-full overflow-hidden hover:shadow-lg transition-shadow">
      <GlowingEffect
        spread={45}
        glow={true}
        disabled={false}
        proximity={80}
        inactiveZone={0.01}
        borderWidth={1}
        blur={0.5}
      />
      <CardHeader className="p-3 pb-2">
        <div className="relative w-full aspect-square rounded-md overflow-hidden bg-muted">
          {product.imageUrl &&
            (product.imageUrl.startsWith("data:image") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                className="object-cover w-full h-full"
              />
            ) : (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                priority
              />
            ))}
        </div>
        <CardTitle className="text-sm font-semibold mt-2 line-clamp-1">
          {product.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {product.description}
        </p>
        {currentVariation && (
          <p className="mt-1.5 text-sm font-semibold">
            ${(currentVariation.price || 0).toFixed(2)}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-3 pt-0 mt-auto space-y-2">
        {validVariations.length > 0 && (
          <div className="w-full">
            <Select
              value={selectedVariation}
              onValueChange={setSelectedVariation}
            >
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Select variation" />
              </SelectTrigger>
              <SelectContent>
                {validVariations.map((variation) => (
                  <SelectItem
                    key={variation.name}
                    value={variation.name}
                    className="text-xs h-8"
                  >
                    {variation.name} - ${(variation.price || 0).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button
          onClick={handleAddToCart}
          className="w-full h-8 text-xs"
          disabled={!currentVariation || isAdding}
          variant="secondary"
        >
          <div className="flex items-center justify-center gap-1.5">
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Add to Cart</span>
          </div>
        </Button>
      </CardFooter>
    </Card>
  );
}
