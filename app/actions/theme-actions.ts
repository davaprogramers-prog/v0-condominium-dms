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
    // Try to upsert the theme
    const { data, error } = await supabase
      .from("condominium_themes")
      .upsert({
        condo_id: condoId,
        ...theme,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, just return the theme data without persisting
      // The client will store it locally
      console.warn("Could not save theme to database:", error.message);
      return { condo_id: condoId, ...theme } as CondoTheme;
    }

    return data as CondoTheme;
  } catch (error) {
    console.error("Error updating condo theme:", error);
    // Return the theme data even if save failed, so client can use it
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
