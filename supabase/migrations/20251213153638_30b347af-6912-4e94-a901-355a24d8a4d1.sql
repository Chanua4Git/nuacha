INSERT INTO subscription_orders (
  id,
  order_reference,
  customer_name,
  customer_email,
  plan_type,
  billing_cycle,
  amount,
  currency,
  status,
  payment_confirmed,
  payment_confirmed_at,
  user_id
) VALUES (
  gen_random_uuid(),
  'ADMIN-OWNER-ACCESS',
  'Chanua Johnson',
  'chanuajohnson4@gmail.com',
  'entrepreneurs',
  'lifetime',
  0.00,
  'USD',
  'active',
  true,
  NOW(),
  '27182ba6-fe5d-431e-9302-c0c7e71597c0'
);