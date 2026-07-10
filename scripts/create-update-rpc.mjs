import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const functionSQL = `
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

GRANT EXECUTE ON FUNCTION update_debts_with_payment(uuid[], text, uuid) TO authenticated;
`

async function setupRPC() {
  try {
    console.log('Creating RPC function for debt updates...')
    
    const { error } = await supabase.rpc('execute_sql', {
      sql: functionSQL
    }).catch(() => ({ error: true }))

    // If execute_sql doesn't exist, try using the queryBuilder
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/update_debts_with_payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    }).catch(() => null)

    console.log('RPC function creation attempted')
    console.log('Note: Ensure the function is created in your Supabase dashboard by running:')
    console.log(functionSQL)
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

setupRPC()
