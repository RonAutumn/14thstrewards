-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Service role can manage all orders" ON orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON orders;
DROP POLICY IF EXISTS "Enable update for service role" ON orders;
DROP POLICY IF EXISTS "Enable delete for service role" ON orders;

-- Create new policies
CREATE POLICY "Enable read access for all users" ON orders
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for anonymous users" ON orders
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users" ON orders
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for service role" ON orders
    FOR UPDATE
    TO service_role
    USING (true);

CREATE POLICY "Enable delete for service role" ON orders
    FOR DELETE
    TO service_role
    USING (true); 