-- Debug script to verify saldo anterior calculation for April 2026
-- Replace 'YOUR_CONDO_ID' with your actual condo_id from the condominiums table

-- Step 1: Get initial balance and date
SELECT 
  'STEP 1: Initial Balance' as step,
  initial_balance,
  initial_balance_date,
  condo_id
FROM parameters
WHERE condo_id = 'YOUR_CONDO_ID';

-- Step 2: Get all approved income up to end of March (income_date <= 2026-03-31)
SELECT 
  'STEP 2: Income until March 31' as step,
  SUM(amount) as total_income,
  COUNT(*) as count,
  condo_id,
  income_type,
  status
FROM condo_income
WHERE condo_id = 'YOUR_CONDO_ID'
  AND status = 'approved'
  AND income_date <= '2026-03-31'
GROUP BY condo_id, income_type, status;

-- Step 3: Get all expenses up to end of March (expense_date <= 2026-03-31)
SELECT 
  'STEP 3: Expenses until March 31' as step,
  SUM(amount) as total_expenses,
  COUNT(*) as count,
  condo_id
FROM condo_expenses
WHERE condo_id = 'YOUR_CONDO_ID'
  AND expense_date <= '2026-03-31'
GROUP BY condo_id;

-- Step 4: Calculate saldo anterior manually
-- Formula: initial_balance + total_income - total_expenses
WITH data AS (
  SELECT 
    p.initial_balance,
    COALESCE(SUM(CASE WHEN ci.status = 'approved' AND ci.income_date <= '2026-03-31' THEN ci.amount ELSE 0 END), 0)::numeric as total_income,
    COALESCE(SUM(CASE WHEN ce.expense_date <= '2026-03-31' THEN ce.amount ELSE 0 END), 0)::numeric as total_expenses
  FROM parameters p
  LEFT JOIN condo_income ci ON p.condo_id = ci.condo_id
  LEFT JOIN condo_expenses ce ON p.condo_id = ce.condo_id
  WHERE p.condo_id = 'YOUR_CONDO_ID'
  GROUP BY p.initial_balance
)
SELECT 
  'STEP 4: Saldo Anterior for April' as step,
  initial_balance,
  total_income,
  total_expenses,
  (initial_balance + total_income - total_expenses) as saldo_anterior_april
FROM data;

-- Step 5: Verify income for April specifically
SELECT 
  'STEP 5: Income for April' as step,
  SUM(amount) as total_income_april,
  COUNT(*) as count,
  income_type,
  status
FROM condo_income
WHERE condo_id = 'YOUR_CONDO_ID'
  AND status = 'approved'
  AND income_date >= '2026-04-01'
  AND income_date <= '2026-04-30'
GROUP BY income_type, status;

-- Step 6: Verify expenses for April specifically
SELECT 
  'STEP 6: Expenses for April' as step,
  SUM(amount) as total_expenses_april,
  COUNT(*) as count
FROM condo_expenses
WHERE condo_id = 'YOUR_CONDO_ID'
  AND expense_date >= '2026-04-01'
  AND expense_date <= '2026-04-30';
