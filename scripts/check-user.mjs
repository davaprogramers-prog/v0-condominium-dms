import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const email = "fcarvall69@gmail.com"

// 1) Find auth user
const { data: list, error: listErr } = await admin.auth.admin.listUsers()
if (listErr) {
  console.log("[check] listUsers error:", listErr.message)
  process.exit(1)
}
const authUser = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
console.log("[check] AUTH USER:", authUser ? { id: authUser.id, email: authUser.email, confirmed: authUser.email_confirmed_at } : "NOT FOUND")

if (!authUser) process.exit(0)

// 2) Find profile
const { data: profile } = await admin.from("profiles").select("*").eq("id", authUser.id).maybeSingle()
console.log("[check] PROFILE:", profile || "NOT FOUND")
