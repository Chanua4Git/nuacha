-- Fix Hyatt Pool Bar date from Dec 10 to Dec 11, 2025
UPDATE public.expenses 
SET date = '2025-12-11' 
WHERE id = 'cd2e27fa-2589-4edf-97b2-1f6e52bf7ac9';

-- Fix Hyatt Lobby Bar date from Nov 11 to Dec 11, 2025
UPDATE public.expenses 
SET date = '2025-12-11' 
WHERE id = '25078071-b8fb-4443-9fb2-e94b4986530a';

-- Delete duplicate Hyatt Lobby Bar entries
DELETE FROM public.expenses 
WHERE id IN ('954382ab-d4f3-4078-a6f1-f3c0f346bb1e', 'b2ca75cf-987c-4868-b9e1-2c0953f41aab');