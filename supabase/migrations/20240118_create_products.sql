create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    airtable_id text unique,
    name text not null,
    description text,
    price decimal(10,2),
    stock integer default 0,
    category text[] default '{}',
    category_names text[] default '{}',
    image_url text,
    weight_size text,
    status text default 'inactive',
    is_active boolean default false,
    variations jsonb default '[]',
    strain_type text check (strain_type in ('sativa', 'indica', 'hybrid')),
    brand text,
    flavors text[] default '{}',
    details jsonb,
    is_special_deal boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create an update_updated_at function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- Create a trigger to automatically update updated_at
create trigger products_updated_at
    before update on public.products
    for each row
    execute function public.handle_updated_at(); 