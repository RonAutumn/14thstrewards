-- Create enum for order types
CREATE TYPE order_type AS ENUM ('pickup', 'delivery', 'shipping');

-- Create enum for order status
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled', 'refunded');

-- Create enum for payment status
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    order_type order_type NOT NULL,
    status order_status NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    items JSONB NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    
    -- Pickup specific fields
    pickup_date TIMESTAMP WITH TIME ZONE,
    pickup_time TEXT,
    pickup_notes TEXT,
    
    -- Delivery specific fields
    delivery_address JSONB,
    delivery_instructions TEXT,
    delivery_date TIMESTAMP WITH TIME ZONE,
    delivery_time_slot TEXT,
    
    -- Shipping specific fields
    shipping_address JSONB,
    tracking_number TEXT,
    shipping_carrier TEXT,
    shipping_method TEXT,
    shipping_label_url TEXT,
    shipping_cost DECIMAL(10,2),
    
    -- Payment fields
    payment_status payment_status NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    payment_intent_id TEXT,
    payment_receipt_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on commonly queried fields
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_type ON orders(order_type);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 