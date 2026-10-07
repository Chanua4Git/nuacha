ALTER TABLE public.setup_requests
ADD COLUMN meeting_location text;

ALTER TABLE public.setup_requests
ADD CONSTRAINT setup_requests_meeting_location_allowed
CHECK (
  meeting_location IS NULL
  OR meeting_location IN (
    'Starbucks Maraval',
    'Starbucks Brentwood',
    'Starbucks Couva',
    'Starbucks South Park',
    'The Garden Ohm, Freeport'
  )
);

ALTER TABLE public.setup_requests
ADD CONSTRAINT setup_requests_mode_location_consistent
CHECK (
  (mode = 'remote' AND meeting_location IS NULL)
  OR (mode = 'in_person' AND meeting_location IS NOT NULL)
);