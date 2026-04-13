import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CartolasClient } from "./cartolas-client"
import { type CondoTheme, DEFAULT_THEME } from "@/lib/theme-utils"

export default async function CartolasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("condo_id, role").eq("id", user.id).single()
  if (!profile?.condo_id) redirect("/dashboard")

  const { data: statements } = await supabase
    .from("bank_statements")
    .select("*")
    .eq("condo_id", profile.condo_id)
    .order("statement_date", { ascending: false })

  // Get condo theme
  const { data: themeData } = await supabase
    .from("condominiums")
    .select("enable_custom_theme, card_bg_color, card_text_color, border_color")
    .eq("id", profile.condo_id)
    .single()

  const theme = themeData as CondoTheme | null
  const cardBgColor = theme?.enable_custom_theme ? theme.card_bg_color : DEFAULT_THEME.card_bg_color
  const cardTextColor = theme?.enable_custom_theme ? theme.card_text_color : DEFAULT_THEME.card_text_color
  const borderColor = theme?.enable_custom_theme ? theme.border_color : DEFAULT_THEME.border_color

  return (
    <CartolasClient
      statements={statements || []}
      isAdmin={profile.role === "admin" || profile.role === "super_admin"}
      cardBgColor={cardBgColor}
      cardTextColor={cardTextColor}
      borderColor={borderColor}
    />
  )
}
