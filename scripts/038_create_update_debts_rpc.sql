-- Create a function to update debts with payment proof
-- This function bypasses RLS by being called from the server
CREATE OR REPLACE FUNCTION update_debts_with_payment(
  debt_ids uuid[],
  receipt_url text,
  condo_id uuid
)
RETURNS TABLE (
  id uuid,
  status text
) AS $$
BEGIN
  RETURN QUERY
  UPDATE condo_income
  SET 
    status = 'approved',
    receipt_url = receipt_url,
    updated_at = NOW()
  WHERE 
    id = ANY(debt_ids) 
    AND condo_income.condo_id = condo_id
  RETURNING condo_income.id, condo_income.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to authenticated users to call this function
GRANT EXECUTE ON FUNCTION update_debts_with_payment(uuid[], text, uuid) TO authenticated;
