-- Clean up duplicate default budget allocations
UPDATE budget_allocations 
SET is_default = false 
WHERE id = '52020dd4-a85e-4b84-b44c-9b96da45e6f6';

-- Remove duplicate budget categories (keep only the first set)
DELETE FROM budget_categories 
WHERE id IN (
  'e935965c-9351-4fe0-a0a6-c6b4fb6d6f03', -- Dining Out duplicate
  'd07aafa4-f979-4879-af78-bbf14fc1953a', -- Emergency Fund duplicate  
  '7751b89a-9895-45fa-a2f7-664b777fc9ac', -- Care duplicate
  '3e7438e0-dd75-4a07-8c43-ee5075f79733', -- Groceries duplicate
  '27069d36-e04a-4beb-a0e4-2a4002dc67e8', -- Investments duplicate
  '677d70d6-6999-4b54-86f7-fb74c12abe13', -- Entertainment duplicate
  'b721b4ee-9e54-4bf4-850f-7a6a5915674b', -- Retirement duplicate
  'ef92cbc7-7a52-4a3f-bb04-42aca9fbc920', -- Subscriptions duplicate
  'e8a94096-9cf2-44e0-82b7-fb3ec7170a3b', -- Gas/Fuel duplicate
  '1d703cd6-6524-4969-95bb-f4fef9dc3c23', -- Medication duplicate
  'ece19f27-3309-485c-8d0c-5d0de65554d5'  -- Extra Debt Payments duplicate
);