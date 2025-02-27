"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, LayoutGrid } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { NeonButton } from "@/components/ui/neon-button";

interface Category {
  id: string;
  name: string;
  isActive?: boolean;
  displayOrder?: number;
  productCount?: number;
}

interface CategoryListProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryClick: (categoryId: string | null) => void;
  className?: string;
}

function CategoryList({
  categories = [],
  selectedCategory,
  onCategoryClick,
  className,
}: CategoryListProps) {
  // Filter out inactive categories and sort by display order
  const activeCategories = categories
    .filter((cat) => cat.isActive !== false)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  return (
    <div className={cn("space-y-2", className)}>
      <NeonButton
        variant={!selectedCategory ? "solid" : "default"}
        className="w-full flex items-center gap-2 justify-start bg-[#1a1f2d] hover:bg-[#1a1f2d]/90"
        onClick={() => onCategoryClick(null)}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="flex-1">
          {!selectedCategory ? "All Products" : "All Products"}
        </span>
        {!selectedCategory && (
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
            Selected
          </Badge>
        )}
      </NeonButton>
      {activeCategories.map((category) => (
        <NeonButton
          key={category.id}
          variant={selectedCategory === category.id ? "solid" : "default"}
          className="w-full flex items-center gap-2 justify-start bg-[#1a1f2d] hover:bg-[#1a1f2d]/90"
          onClick={() => onCategoryClick(category.id)}
        >
          <span className="flex-1">{category.name}</span>
          {category.productCount > 0 && (
            <Badge
              variant="outline"
              className="ml-auto border-blue-400/20 text-blue-400"
            >
              {category.productCount}
            </Badge>
          )}
          {selectedCategory === category.id && (
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
              Selected
            </Badge>
          )}
        </NeonButton>
      ))}
    </div>
  );
}

export function CategoriesPanel({
  categories = [],
}: {
  categories: Category[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const selectedCategory = searchParams.get("category");

  const handleCategoryClick = useCallback(
    (categoryId: string | null) => {
      const params = new URLSearchParams(searchParams);
      if (categoryId) {
        params.set("category", categoryId);
      } else {
        params.delete("category");
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <>
      {/* Mobile Categories Sheet */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg"
            >
              <Tag className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Categories
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <CategoryList
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryClick={handleCategoryClick}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Categories Panel */}
      <Card className="hidden md:block sticky top-20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryList
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryClick={handleCategoryClick}
          />
        </CardContent>
      </Card>
    </>
  );
}
