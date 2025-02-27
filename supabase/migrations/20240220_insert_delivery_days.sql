-- Delete any existing future delivery days
DELETE FROM delivery_days WHERE date > CURRENT_DATE;

-- Insert delivery days for Monday through Saturday for the next 3 months
WITH RECURSIVE dates AS (
  -- Start with today
  SELECT CURRENT_DATE as date
  UNION ALL
  -- Add one day at a time until we reach 3 months
  SELECT date + 1
  FROM dates
  WHERE date < CURRENT_DATE + INTERVAL '3 months'
)
INSERT INTO delivery_days (
  date,
  status,
  max_slots,
  notes
)
SELECT 
  date,
  'open'::day_status,
  -- Different max slots based on day of week
  CASE 
    WHEN EXTRACT(DOW FROM date) = 6 THEN 20  -- Saturday
    WHEN EXTRACT(DOW FROM date) = 1 THEN 15  -- Monday
    ELSE 12  -- Tuesday through Friday
  END as max_slots,
  CASE 
    WHEN EXTRACT(DOW FROM date) = 1 THEN 'Monday Delivery'
    WHEN EXTRACT(DOW FROM date) = 2 THEN 'Tuesday Delivery'
    WHEN EXTRACT(DOW FROM date) = 3 THEN 'Wednesday Delivery'
    WHEN EXTRACT(DOW FROM date) = 4 THEN 'Thursday Delivery'
    WHEN EXTRACT(DOW FROM date) = 5 THEN 'Friday Delivery'
    WHEN EXTRACT(DOW FROM date) = 6 THEN 'Saturday Delivery'
  END as notes
FROM dates
WHERE EXTRACT(DOW FROM date) != 0  -- Exclude Sundays (0 = Sunday in EXTRACT(DOW))
ORDER BY date;

-- Create a function to automatically generate future delivery days
CREATE OR REPLACE FUNCTION generate_future_delivery_days() RETURNS trigger AS $$
BEGIN
  -- Generate delivery days for the next week if we're within 2 weeks of the last delivery day
  IF (SELECT MAX(date) FROM delivery_days) <= CURRENT_DATE + INTERVAL '2 weeks' THEN
    WITH RECURSIVE future_dates AS (
      SELECT (SELECT MAX(date) FROM delivery_days) + 1 as date
      UNION ALL
      SELECT date + 1
      FROM future_dates
      WHERE date < (SELECT MAX(date) FROM delivery_days) + INTERVAL '1 week'
    )
    INSERT INTO delivery_days (
      date,
      status,
      max_slots,
      notes
    )
    SELECT 
      date,
      'open'::day_status,
      CASE 
        WHEN EXTRACT(DOW FROM date) = 6 THEN 20  -- Saturday
        WHEN EXTRACT(DOW FROM date) = 1 THEN 15  -- Monday
        ELSE 12  -- Tuesday through Friday
      END as max_slots,
      CASE 
        WHEN EXTRACT(DOW FROM date) = 1 THEN 'Monday Delivery'
        WHEN EXTRACT(DOW FROM date) = 2 THEN 'Tuesday Delivery'
        WHEN EXTRACT(DOW FROM date) = 3 THEN 'Wednesday Delivery'
        WHEN EXTRACT(DOW FROM date) = 4 THEN 'Thursday Delivery'
        WHEN EXTRACT(DOW FROM date) = 5 THEN 'Friday Delivery'
        WHEN EXTRACT(DOW FROM date) = 6 THEN 'Saturday Delivery'
      END as notes
    FROM future_dates
    WHERE EXTRACT(DOW FROM date) != 0  -- Exclude Sundays
    ORDER BY date;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically generate future delivery days
CREATE TRIGGER generate_delivery_days_trigger
  AFTER INSERT OR UPDATE ON delivery_days
  FOR EACH STATEMENT
  EXECUTE FUNCTION generate_future_delivery_days(); 