-- Remove airtable_id column from products table
ALTER TABLE products DROP COLUMN IF EXISTS airtable_id; 