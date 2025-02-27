import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/server'
import type { Product } from '@/types/product'

export async function GET() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    // Transform to match the Product interface
    const transformedProducts: Product[] = products.map(product => ({
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
    }));

    return NextResponse.json(transformedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    console.log('PATCH /api/products - Request body:', body);

    if (!body.id) {
      console.error('PATCH /api/products - Missing product ID');
      return NextResponse.json(
        { error: 'Product ID is required for updating a product' },
        { status: 400 }
      );
    }

    // Transform the data to match Supabase schema
    const updateData = {
      name: body.name,
      description: body.description || '',
      price: Number(body.price) || 0,
      stock: Number(body.stock) || 0,
      category: Array.isArray(body.category) ? body.category : [],
      image_url: body.imageUrl || '',
      weight_size: body.weightSize,
      status: body.status || 'active',
      is_active: body.status === 'active',
      variations: Array.isArray(body.variations) ? body.variations : [],
      updated_at: new Date().toISOString()
    };

    console.log('PATCH /api/products - Update data:', updateData);

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }

    // Transform the response to match the Product interface
    const transformedProduct: Product = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: data.price || 0,
      stock: data.stock || 0,
      category: data.category || [],
      categoryNames: data.category_names || [],
      imageUrl: data.image_url || '/images/placeholder.jpg',
      weightSize: data.weight_size || '',
      isActive: data.is_active,
      status: data.status || 'inactive',
      variations: data.variations || []
    };

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('POST /api/products - Request body:', body);

    // Transform the data to match Supabase schema
    const createData = {
      name: body.name,
      description: body.description || '',
      price: Number(body.price) || 0,
      stock: Number(body.stock) || 0,
      category: Array.isArray(body.category) ? body.category : [],
      image_url: body.imageUrl || '',
      weight_size: body.weightSize,
      status: body.isActive ? 'active' : 'inactive',
      is_active: body.isActive,
      variations: Array.isArray(body.variations) ? body.variations : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('POST /api/products - Create data:', createData);

    const { data, error } = await supabase
      .from('products')
      .insert([createData])
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      throw error;
    }

    // Transform the response to match the Product interface
    const transformedProduct: Product = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: data.price || 0,
      stock: data.stock || 0,
      category: data.category || [],
      categoryNames: data.category_names || [],
      imageUrl: data.image_url || '/images/placeholder.jpg',
      weightSize: data.weight_size || '',
      isActive: data.is_active,
      status: data.status || 'inactive',
      variations: data.variations || []
    };

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
} 