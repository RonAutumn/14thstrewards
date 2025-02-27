-- Create pickup_settings table
CREATE TABLE IF NOT EXISTS pickup_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id TEXT NOT NULL UNIQUE,
    is_pickup_enabled BOOLEAN NOT NULL DEFAULT true,
    default_max_orders_per_slot INTEGER NOT NULL DEFAULT 5,
    default_slot_duration INTEGER NOT NULL DEFAULT 30,
    advance_booking_days INTEGER NOT NULL DEFAULT 7,
    min_advance_booking_hours INTEGER NOT NULL DEFAULT 1,
    schedule JSONB NOT NULL,
    holiday_dates JSONB[] DEFAULT '{}',
    special_hours JSONB[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create pickup_slots table
CREATE TABLE IF NOT EXISTS pickup_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id TEXT NOT NULL REFERENCES pickup_settings(store_id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_orders INTEGER NOT NULL,
    current_orders INTEGER NOT NULL DEFAULT 0,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create pickup_slot_assignments table
CREATE TABLE IF NOT EXISTS pickup_slot_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_id UUID NOT NULL REFERENCES pickup_slots(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(slot_id, order_id)
);

-- Create pickup_blackout_dates table
CREATE TABLE IF NOT EXISTS pickup_blackout_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id TEXT NOT NULL REFERENCES pickup_settings(store_id),
    date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(store_id, date)
);

-- Create indexes for better query performance
CREATE INDEX idx_pickup_slots_store_date ON pickup_slots(store_id, date);
CREATE INDEX idx_pickup_slots_availability ON pickup_slots(is_available);
CREATE INDEX idx_pickup_slot_assignments_order ON pickup_slot_assignments(order_id);
CREATE INDEX idx_pickup_slot_assignments_slot ON pickup_slot_assignments(slot_id);
CREATE INDEX idx_pickup_blackout_dates_store ON pickup_blackout_dates(store_id);
CREATE INDEX idx_pickup_blackout_dates_date ON pickup_blackout_dates(date);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pickup_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to all pickup tables
CREATE TRIGGER update_pickup_settings_updated_at
    BEFORE UPDATE ON pickup_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_pickup_updated_at_column();

CREATE TRIGGER update_pickup_slots_updated_at
    BEFORE UPDATE ON pickup_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_pickup_updated_at_column();

CREATE TRIGGER update_pickup_slot_assignments_updated_at
    BEFORE UPDATE ON pickup_slot_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_pickup_updated_at_column();

CREATE TRIGGER update_pickup_blackout_dates_updated_at
    BEFORE UPDATE ON pickup_blackout_dates
    FOR EACH ROW
    EXECUTE FUNCTION update_pickup_updated_at_column(); 