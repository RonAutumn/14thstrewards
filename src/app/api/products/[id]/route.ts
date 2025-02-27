import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/server'
import type { Product } from '@/types/product'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      throw error;
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Transform to match the Product interface
    const transformedProduct: Product = {
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price || 0,
      stock: product.stock || 0,
      category: product.category || [],
      categoryNames: product.category_names || [],
      imageUrl: product.image_url || '/images/placeholder.jpg',
      weightSize: product.weight_size || '',
      isActive: product.is_active,
      status: product.status || 'inactive',
      variations: product.variations || []
    };

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
} 