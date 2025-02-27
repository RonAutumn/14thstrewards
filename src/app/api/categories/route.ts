import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import type { Category } from '@/types/product';

// Add dynamic flag to prevent static optimization
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    // Transform and add product count
    const transformedCategories = (categories || []).map(category => ({
      id: category.id,
      name: category.name,
      description: category.description || '',
      displayOrder: category.display_order || 0,
      isActive: category.is_active,
      products: category.products || [],
      slug: category.name.toLowerCase().replace(/\s+/g, '-'),
      productCount: (category.products || []).length
    }));

    return NextResponse.json(transformedCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('POST /api/categories - Request body:', body);

    const { data, error } = await supabase
      .from('categories')
      .insert([{
        name: body.name,
        description: body.description || '',
        display_order: body.displayOrder || 0,
        is_active: body.isActive,
        products: body.products || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      throw error;
    }

    const transformedCategory = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      displayOrder: data.display_order || 0,
      isActive: data.is_active,
      products: data.products || [],
      slug: data.name.toLowerCase().replace(/\s+/g, '-'),
      productCount: (data.products || []).length
    };

    return NextResponse.json(transformedCategory);
  } catch (error) {
    console.error('POST /api/categories - Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('categories')
      .update({
        name: body.name,
        description: body.description || '',
        display_order: body.displayOrder || 0,
        is_active: body.isActive,
        products: body.products || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      throw error;
    }

    const transformedCategory = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      displayOrder: data.display_order || 0,
      isActive: data.is_active,
      products: data.products || [],
      slug: data.name.toLowerCase().replace(/\s+/g, '-'),
      productCount: (data.products || []).length
    };

    return NextResponse.json(transformedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
} 