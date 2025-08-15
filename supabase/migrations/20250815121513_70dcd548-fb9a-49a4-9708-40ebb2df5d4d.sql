-- Add receipt image URL field to expenses table for direct access to receipt images
ALTER TABLE expenses ADD COLUMN receipt_image_url TEXT;