-- Create the delivery_slots table
CREATE TABLE IF NOT EXISTS delivery_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    maximum_orders INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the delivery_slot_assignments table
CREATE TABLE IF NOT EXISTS delivery_slot_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slot_id UUID REFERENCES delivery_slots(id),
    order_id UUID NOT NULL,
    delivery_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_slot_assignment UNIQUE (delivery_date, start_time, end_time, order_id)
);

-- First, clear any existing delivery slots
DELETE FROM delivery_slots;

-- Create 1-hour delivery slots from 6 PM to 10 PM
INSERT INTO delivery_slots (
    start_time,
    end_time,
    maximum_orders,
    status,
    created_at,
    updated_at
)
VALUES 
    ('18:00:00', '19:00:00', 5, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('19:00:00', '20:00:00', 5, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('20:00:00', '21:00:00', 5, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('21:00:00', '22:00:00', 5, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create a function to check slot availability
CREATE OR REPLACE FUNCTION check_slot_availability(
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME
) RETURNS BOOLEAN AS $$
DECLARE
    v_maximum_orders INTEGER;
    v_current_orders INTEGER;
BEGIN
    -- Get maximum orders for the slot
    SELECT maximum_orders INTO v_maximum_orders
    FROM delivery_slots
    WHERE start_time = p_start_time AND end_time = p_end_time
    AND status = 'active';

    -- Get current number of orders for the slot
    SELECT COUNT(*) INTO v_current_orders
    FROM delivery_slot_assignments
    WHERE delivery_date = p_date
    AND start_time = p_start_time
    AND end_time = p_end_time
    AND status != 'cancelled';

    -- Return true if slot is available
    RETURN v_current_orders < v_maximum_orders;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get available slots for a date
CREATE OR REPLACE FUNCTION get_available_slots(p_date DATE)
RETURNS TABLE (
    start_time TIME,
    end_time TIME,
    available_slots INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ds.start_time,
        ds.end_time,
        ds.maximum_orders - COALESCE(COUNT(dsa.id), 0)::INTEGER as available_slots
    FROM delivery_slots ds
    LEFT JOIN delivery_slot_assignments dsa ON 
        ds.start_time = dsa.start_time 
        AND ds.end_time = dsa.end_time 
        AND dsa.delivery_date = p_date
        AND dsa.status != 'cancelled'
    WHERE ds.status = 'active'
    GROUP BY ds.start_time, ds.end_time, ds.maximum_orders
    HAVING ds.maximum_orders - COUNT(dsa.id) > 0
    ORDER BY ds.start_time;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_slots_times 
ON delivery_slots(start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_delivery_slot_assignments_date_time 
ON delivery_slot_assignments(delivery_date, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_delivery_slot_assignments_status 
ON delivery_slot_assignments(status);

CREATE INDEX IF NOT EXISTS idx_delivery_slots_status 
ON delivery_slots(status);

-- Add constraints to ensure valid time ranges
ALTER TABLE delivery_slots
ADD CONSTRAINT valid_time_range 
CHECK (end_time > start_time);

ALTER TABLE delivery_slots
ADD CONSTRAINT maximum_orders_positive 
CHECK (maximum_orders > 0);

-- Add trigger to prevent overlapping time slots
CREATE OR REPLACE FUNCTION prevent_overlapping_slots()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM delivery_slots
        WHERE (start_time, end_time) OVERLAPS (NEW.start_time, NEW.end_time)
        AND id != NEW.id
        AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'Time slot overlaps with existing active slot';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_overlapping_slots
BEFORE INSERT OR UPDATE ON delivery_slots
FOR EACH ROW
EXECUTE FUNCTION prevent_overlapping_slots();