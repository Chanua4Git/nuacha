-- Fix Wonderful World expense date from Oct 11 to Dec 10, 2025
UPDATE public.expenses 
SET date = '2025-12-10' 
WHERE id = 'f59f747a-5fc4-4b21-ba74-21c5716de8c8';

-- Fix Pennywise Cosmetics expense date from Aug 11 to Dec 8, 2025
UPDATE public.expenses 
SET date = '2025-12-08' 
WHERE id = '13d4d80a-b9f3-4698-af4e-9bed54d2f299';