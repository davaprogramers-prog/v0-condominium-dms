import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createThemeTable() {
  try {
    const { error } = await supabase.rpc("exec_sql", {
      query: `
        CREATE TABLE IF NOT EXISTS public.condominium_themes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
          enable_custom_theme BOOLEAN DEFAULT false,
          sidebar_bg_color VARCHAR(7) DEFAULT '#1e293b',
          main_bg_color VARCHAR(7) DEFAULT '#f1f5f9',
          card_bg_color VARCHAR(7) DEFAULT '#ffffff',
          sidebar_text_color VARCHAR(7) DEFAULT '#ffffff',
          main_text_color VARCHAR(7) DEFAULT '#0f172a',
          card_text_color VARCHAR(7) DEFAULT '#0f172a',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(condo_id)
        );
      `,
    });

    if (error) {
      console.error("Error creating theme table:", error);
      process.exit(1);
    }

    console.log("[v0] Theme table created successfully");
  } catch (err) {
    console.error("[v0] Error:", err);
    process.exit(1);
  }
}

createThemeTable();
