import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // Create the table
    const { error: createError } = await supabase.from("condominium_themes").select().limit(1);
    
    if (createError && createError.code === "PGRST116") {
      // Table doesn't exist, create it
      const sql = `
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
      `;

      const { error: execError } = await supabase.rpc("exec", { sql });
      
      if (execError) {
        console.error("Error creating table:", execError);
        return Response.json({ error: execError.message }, { status: 500 });
      }
    }

    return Response.json({ success: true, message: "Theme table ready" });
  } catch (error) {
    console.error("Setup error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
