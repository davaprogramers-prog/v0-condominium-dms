import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// SQL statement to add the policy
const policySql = `
DROP POLICY IF EXISTS "Users can update own condo income for payment" ON condo_income;

CREATE POLICY "Users can update own condo income for payment" ON condo_income
FOR UPDATE TO authenticated
USING (
  house_id IN (
    SELECT h.id FROM houses h
    JOIN profiles p ON h.condo_id = p.condo_id
    WHERE p.id = auth.uid()
  )
)
WITH CHECK (
  house_id IN (
    SELECT h.id FROM houses h
    JOIN profiles p ON h.condo_id = p.condo_id
    WHERE p.id = auth.uid()
  )
);
`

async function runPolicy() {
  try {
    console.log('Applying debt payment RLS policy...')
    
    // Execute using SQL query
    const { data, error } = await supabase.from('_sql').insert([
      { query: policySql }
    ])
    
    if (error) {
      console.log('Method 1 failed, trying direct query...')
      
      // Try alternative - directly call Postgres
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql_exec`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: policySql })
      })
      
      const result = await response.json()
      console.log('Response:', result)
    } else {
      console.log('✓ Policy applied successfully')
    }
    
    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    console.log('Note: You may need to apply this policy manually via Supabase console:')
    console.log(policySql)
    process.exit(0)
  }
}

runPolicy()
