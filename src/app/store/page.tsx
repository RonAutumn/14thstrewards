import { getProducts, getCategories } from "@/lib/supabase/server";
import { ProductsGrid } from "@/components/store/products-grid";
import { CategoriesPanel } from "@/components/store/categories-panel";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { HeroSection } from "@/components/sections/hero-section";

export default async function StorePage() {
  try {
    const [products, categories] = await Promise.all([
      getProducts(),
      getCategories(),
    ]);

    return (
      <main className="min-h-screen">
        <HeroSection />

        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
            {/* Categories Panel */}
            <Suspense
              fallback={
                <div className="h-[200px] flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              }
            >
              <CategoriesPanel categories={categories} />
            </Suspense>

            {/* Products Grid */}
            <Suspense
              fallback={
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-muted rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              }
            >
              <ProductsGrid products={products} categories={categories} />
            </Suspense>
          </div>
        </section>
      </main>
    );
  } catch (error) {
    console.error("Error in StorePage:", error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Failed to load store data</p>
      </div>
    );
  }
}
