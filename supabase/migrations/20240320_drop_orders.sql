-- Drop existing triggers
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop existing table
DROP TABLE IF EXISTS orders;

-- Drop existing types
DROP TYPE IF EXISTS order_type;
DROP TYPE IF EXISTS order_status;
DROP TYPE IF EXISTS payment_status; 