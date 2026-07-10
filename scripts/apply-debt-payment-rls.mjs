import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

async function applyPolicy() {
  try {
    console.log('Applying debt payment RLS policy...')
    const { error } = await supabase.rpc('exec', { sql: policySql })
    
    if (error) {
      console.error('Error applying policy:', error)
      process.exit(1)
    }
    
    console.log('✓ Debt payment RLS policy applied successfully')
    process.exit(0)
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

applyPolicy()
