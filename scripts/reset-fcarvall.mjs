import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const userId = "fa9a4a18-54ec-4f14-b4c9-a750e16f23bc"
const { error } = await admin.auth.admin.updateUserById(userId, { password: "InteliCon2026@" })

if (error) {
  console.log("[reset] ERROR:", error.message)
  process.exit(1)
}
console.log("[reset] OK - fcarvall69@gmail.com password set to InteliCon2026@")
