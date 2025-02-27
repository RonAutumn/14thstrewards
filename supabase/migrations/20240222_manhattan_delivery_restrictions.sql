-- Add unique constraint for zip code and day combination if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'unique_zip_day'
    ) THEN
        ALTER TABLE delivery_zip_restrictions 
        ADD CONSTRAINT unique_zip_day UNIQUE (zip_code, day_of_week);
    END IF;
END $$;

-- First, clear any existing restrictions for Manhattan and Astoria zip codes
DELETE FROM delivery_zip_restrictions 
WHERE zip_code IN (
    SELECT zip_code 
    FROM delivery_fees 
    WHERE zip_code ~ '^(100|102)' -- Manhattan
    OR zip_code IN ('11102', '11103', '11105', '11106') -- Astoria
);

-- Insert Tuesday restrictions for Manhattan and Astoria
INSERT INTO delivery_zip_restrictions (
    zip_code,
    day_of_week,
    is_available
)
SELECT 
    zip_code,
    2, -- Tuesday
    true
FROM delivery_fees
WHERE zip_code ~ '^(100|102)' -- Manhattan
OR zip_code IN ('11102', '11103', '11105', '11106'); -- Astoria

-- Insert Friday restrictions for Manhattan and Astoria
INSERT INTO delivery_zip_restrictions (
    zip_code,
    day_of_week,
    is_available
)
SELECT 
    zip_code,
    5, -- Friday
    true
FROM delivery_fees
WHERE zip_code ~ '^(100|102)' -- Manhattan
OR zip_code IN ('11102', '11103', '11105', '11106'); -- Astoria

-- Set all other days to unavailable for Manhattan and Astoria
INSERT INTO delivery_zip_restrictions (
    zip_code,
    day_of_week,
    is_available
)
SELECT 
    df.zip_code,
    d.day,
    false
FROM delivery_fees df
CROSS JOIN (
    SELECT unnest(ARRAY[1,3,4,6]) as day -- Monday, Wednesday, Thursday, Saturday
) d
WHERE df.zip_code ~ '^(100|102)' -- Manhattan
OR df.zip_code IN ('11102', '11103', '11105', '11106'); -- Astoria

-- Create or replace the function to get available delivery days
CREATE OR REPLACE FUNCTION get_available_delivery_days(p_zip_code TEXT)
RETURNS TABLE (
    date DATE,
    is_available BOOLEAN,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE dates AS (
        SELECT CURRENT_DATE as date
        UNION ALL
        SELECT date + 1
        FROM dates
        WHERE date < CURRENT_DATE + INTERVAL '3 months'
    ),
    available_days AS (
        SELECT day_of_week, is_available
        FROM delivery_zip_restrictions
        WHERE zip_code = p_zip_code
    )
    SELECT 
        d.date,
        CASE 
            WHEN EXTRACT(DOW FROM d.date) = 0 THEN false -- Sunday
            WHEN p_zip_code ~ '^(100|102)' OR p_zip_code IN ('11102', '11103', '11105', '11106') THEN
                COALESCE(
                    (SELECT is_available 
                     FROM available_days 
                     WHERE day_of_week = EXTRACT(DOW FROM d.date)::integer),
                    false
                )
            ELSE true -- Other addresses can deliver any day except Sunday
        END as is_available,
        CASE 
            WHEN EXTRACT(DOW FROM d.date) = 0 THEN 'No delivery on Sundays'
            WHEN (p_zip_code ~ '^(100|102)' OR p_zip_code IN ('11102', '11103', '11105', '11106')) AND 
                 NOT COALESCE(
                     (SELECT is_available 
                      FROM available_days 
                      WHERE day_of_week = EXTRACT(DOW FROM d.date)::integer),
                     false
                 ) THEN 
                CASE 
                    WHEN p_zip_code ~ '^(100|102)' THEN 'Delivery only available on Tuesdays and Fridays for Manhattan'
                    ELSE 'Delivery only available on Tuesdays and Fridays for Astoria'
                END
            ELSE 'Available for delivery'
        END as reason
    FROM dates d
    ORDER BY d.date;
END;
$$ LANGUAGE plpgsql; 