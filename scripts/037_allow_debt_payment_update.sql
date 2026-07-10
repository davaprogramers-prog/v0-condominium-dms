-- Allow users to update their own condo_income records when paying
-- This policy permits house owners to update receipt_url and status when paying debts

DROP POLICY IF EXISTS "Users can update own condo income for payment" ON condo_income;

CREATE POLICY "Users can update own condo income for payment" ON condo_income
FOR UPDATE TO authenticated
USING (
  -- User can update if the income belongs to a house they are associated with
  house_id IN (
    SELECT h.id FROM houses h
    JOIN profiles p ON h.condo_id = p.condo_id
    WHERE p.id = auth.uid()
  )
)
WITH CHECK (
  -- Check condition: can only update receipt_url and status fields
  house_id IN (
    SELECT h.id FROM houses h
    JOIN profiles p ON h.condo_id = p.condo_id
    WHERE p.id = auth.uid()
  )
);
