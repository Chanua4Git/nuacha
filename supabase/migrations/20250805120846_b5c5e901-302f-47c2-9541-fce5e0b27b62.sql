-- Insert sample subscription plans for testing
INSERT INTO subscription_plans (
  name,
  description,
  price,
  currency,
  billing_cycle,
  max_employees,
  features,
  is_active
) VALUES 
(
  'Free Tier',
  'Perfect for small businesses getting started',
  0.00,
  'TTD',
  'monthly',
  5,
  '["export_features"]'::jsonb,
  true
),
(
  'Professional',
  'Ideal for growing businesses with more employees',
  299.00,
  'TTD',
  'monthly',
  25,
  '["advanced_reporting", "export_features", "priority_support"]'::jsonb,
  true
),
(
  'Enterprise',
  'For large organizations with unlimited needs',
  599.00,
  'TTD',
  'monthly',
  NULL,
  '["advanced_reporting", "export_features", "priority_support", "unlimited_employees"]'::jsonb,
  true
);