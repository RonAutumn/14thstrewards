-- Insert default store settings
INSERT INTO pickup_settings (
    store_id,
    is_pickup_enabled,
    default_max_orders_per_slot,
    default_slot_duration,
    advance_booking_days,
    min_advance_booking_hours,
    schedule
) VALUES (
    'default-store',
    true,
    5,
    30,
    7,
    1,
    jsonb_build_array(
        jsonb_build_object(
            'day_of_week', 'Monday',
            'is_open', true,
            'open_time', '10:00',
            'close_time', '19:00',
            'max_orders_per_slot', 5,
            'slot_duration', 30
        ),
        jsonb_build_object(
            'day_of_week', 'Tuesday',
            'is_open', true,
            'open_time', '10:00',
            'close_time', '19:00',
            'max_orders_per_slot', 5,
            'slot_duration', 30
        ),
        jsonb_build_object(
            'day_of_week', 'Wednesday',
            'is_open', true,
            'open_time', '10:00',
            'close_time', '19:00',
            'max_orders_per_slot', 5,
            'slot_duration', 30
        ),
        jsonb_build_object(
            'day_of_week', 'Thursday',
            'is_open', true,
            'open_time', '10:00',
            'close_time', '19:00',
            'max_orders_per_slot', 5,
            'slot_duration', 30
        ),
        jsonb_build_object(
            'day_of_week', 'Friday',
            'is_open', true,
            'open_time', '10:00',
            'close_time', '19:00',
            'max_orders_per_slot', 5,
            'slot_duration', 30
        ),
        jsonb_build_object(
            'day_of_week', 'Saturday',
            'is_open', true,
            'open_time', '10:00',
            'close_time', '18:00',
            'max_orders_per_slot', 5,
            'slot_duration', 30
        ),
        jsonb_build_object(
            'day_of_week', 'Sunday',
            'is_open', false,
            'open_time', null,
            'close_time', null,
            'max_orders_per_slot', 0,
            'slot_duration', 0
        )
    )
) ON CONFLICT (store_id) DO UPDATE 
SET 
    is_pickup_enabled = EXCLUDED.is_pickup_enabled,
    default_max_orders_per_slot = EXCLUDED.default_max_orders_per_slot,
    default_slot_duration = EXCLUDED.default_slot_duration,
    advance_booking_days = EXCLUDED.advance_booking_days,
    min_advance_booking_hours = EXCLUDED.min_advance_booking_hours,
    schedule = EXCLUDED.schedule,
    updated_at = NOW();

-- Insert some initial pickup slots for the next 7 days (excluding Sundays)
WITH RECURSIVE dates AS (
  SELECT generate_series(
    current_date,
    current_date + interval '7 days',
    interval '1 day'
  )::date as date
),
time_slots AS (
  -- Generate 30-minute intervals from 10:00 to 18:30
  SELECT (n || ':00')::time as start_time
  FROM generate_series(10, 18) n
  UNION
  SELECT (n || ':30')::time as start_time
  FROM generate_series(10, 18) n
  WHERE (n || ':30')::time <= '18:30'::time
  ORDER BY start_time
)
INSERT INTO pickup_slots (
    store_id,
    date,
    start_time,
    end_time,
    max_orders,
    is_available
)
SELECT 
    'default-store',
    d.date,
    t.start_time,
    (t.start_time + interval '30 minutes')::time,
    5,
    true
FROM dates d
CROSS JOIN time_slots t
WHERE 
    EXTRACT(DOW FROM d.date) != 0  -- Exclude Sundays (0 = Sunday)
    AND t.start_time <= '18:30'::time
ORDER BY d.date, t.start_time
ON CONFLICT DO NOTHING;

-- Insert a sample blackout date (Christmas)
INSERT INTO pickup_blackout_dates (
    store_id,
    date,
    reason
) VALUES (
    'default-store',
    '2024-12-25',
    'Christmas Day - Store Closed'
) ON CONFLICT DO NOTHING; 