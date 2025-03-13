-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create orders (including guests)
CREATE POLICY "Anyone can create orders"
ON public.orders FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to view their own orders and guests to view orders by email
CREATE POLICY "Users can view own orders and guests by email"
ON public.orders FOR SELECT
USING (
    (auth.uid() = user_id) OR 
    (user_id IS NULL) OR
    (auth.uid() IS NULL)  -- This allows guest users to view orders
);

-- Allow users to update their own orders
CREATE POLICY "Users can update own orders"
ON public.orders FOR UPDATE
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow service role to manage all orders
CREATE POLICY "Service role can manage all orders"
ON public.orders
TO service_role
USING (true)
WITH CHECK (true); 