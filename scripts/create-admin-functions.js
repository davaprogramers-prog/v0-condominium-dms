import postgres from "postgres"

const databaseUrl = process.env.POSTGRES_URL
if (!databaseUrl) {
  console.error("POSTGRES_URL not set")
  process.exit(1)
}

const sql = postgres(databaseUrl, { ssl: "require" })

async function createFunctions() {
  try {
    console.log("Creating admin functions...")

    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION create_condominium_admin(
        p_name TEXT,
        p_address TEXT,
        p_currency TEXT,
        p_symbol TEXT,
        p_multiplier NUMERIC,
        p_houses INTEGER,
        p_expense NUMERIC,
        p_deadline INTEGER,
        p_user_id UUID
      )
      RETURNS UUID
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_condo_id UUID;
      BEGIN
        INSERT INTO public.condominiums (
          name, address, currency, currency_symbol,
          currency_multiplier, total_houses, common_expense_amount,
          payment_deadline_day, created_by
        ) VALUES (
          p_name, p_address, p_currency, p_symbol,
          p_multiplier, p_houses, p_expense, p_deadline, p_user_id
        ) RETURNING id INTO v_condo_id;
        
        RETURN v_condo_id;
      END;
      $$;
    `)

    console.log("✓ create_condominium_admin function created")
    await sql.end()
  } catch (err) {
    console.error("Error:", err.message)
    process.exit(1)
  }
}

createFunctions()
