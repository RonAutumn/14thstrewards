-- Create delivery_slots table
CREATE TABLE IF NOT EXISTS delivery_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    maximum_orders INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create delivery_days table
CREATE TABLE IF NOT EXISTS delivery_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    max_slots INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create delivery_slot_assignments table
CREATE TABLE IF NOT EXISTS delivery_slot_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    slot_id UUID REFERENCES delivery_slots(id),
    day_id UUID REFERENCES delivery_days(id),
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create delivery_zip_restrictions table
CREATE TABLE IF NOT EXISTS delivery_zip_restrictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zip_code VARCHAR(10) NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    slot_id UUID REFERENCES delivery_slots(id),
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_delivery_slots_status ON delivery_slots(status);
CREATE INDEX idx_delivery_days_date ON delivery_days(date);
CREATE INDEX idx_delivery_slot_assignments_order ON delivery_slot_assignments(order_id);
CREATE INDEX idx_delivery_zip_restrictions_zip ON delivery_zip_restrictions(zip_code);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to all tables
CREATE TRIGGER update_delivery_slots_updated_at
    BEFORE UPDATE ON delivery_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_days_updated_at
    BEFORE UPDATE ON delivery_days
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_slot_assignments_updated_at
    BEFORE UPDATE ON delivery_slot_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_zip_restrictions_updated_at
    BEFORE UPDATE ON delivery_zip_restrictions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 