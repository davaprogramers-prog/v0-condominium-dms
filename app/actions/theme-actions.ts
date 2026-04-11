'use server'

import { createClient } from "@supabase/supabase-js";
import { DEFAULT_THEME, type CondoTheme } from "@/lib/theme-utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getCondoTheme(condoId: string): Promise<CondoTheme | null> {
  try {
    const { data, error } = await supabase
      .from("condominium_themes")
      .select("*")
      .eq("condo_id", condoId)
      .single();

    if (error) {
      // Table doesn't exist or no record found - return null to use defaults
      return null;
    }

    return data as CondoTheme;
  } catch (error) {
    console.error("Error fetching condo theme:", error);
    return null;
  }
}

export async function updateCondoTheme(
  condoId: string,
  theme: Partial<Omit<CondoTheme, 'id' | 'condo_id' | 'created_at' | 'updated_at'>>
): Promise<CondoTheme | null> {
  try {
    // First check if theme exists
    const { data: existing } = await supabase
      .from("condominium_themes")
      .select("id")
      .eq("condo_id", condoId)
      .single();

    // If exists, update it; otherwise insert
    if (existing?.id) {
      const { data, error } = await supabase
        .from("condominium_themes")
        .update({
          ...theme,
          updated_at: new Date().toISOString(),
        })
        .eq("condo_id", condoId)
        .select()
        .single();

      if (error) {
        console.warn("Could not update theme in database:", error.message);
        return { condo_id: condoId, ...theme } as CondoTheme;
      }

      return data as CondoTheme;
    } else {
      // Insert new theme
      const { data, error } = await supabase
        .from("condominium_themes")
        .insert({
          condo_id: condoId,
          ...theme,
        })
        .select()
        .single();

      if (error) {
        console.warn("Could not save theme to database:", error.message);
        return { condo_id: condoId, ...theme } as CondoTheme;
      }

      return data as CondoTheme;
    }
  } catch (error) {
    console.error("Error updating condo theme:", error);
    return { condo_id: condoId, ...theme } as CondoTheme;
  }
}

export async function initializeCondoTheme(condoId: string): Promise<CondoTheme | null> {
  try {
    const { data, error } = await supabase
      .from("condominium_themes")
      .insert({
        condo_id: condoId,
        ...DEFAULT_THEME,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique violation, theme already exists
        return getCondoTheme(condoId);
      }
      // Table doesn't exist or other error - return null
      return null;
    }

    return data as CondoTheme;
  } catch (error) {
    console.error("Error initializing condo theme:", error);
    return null;
  }
}
