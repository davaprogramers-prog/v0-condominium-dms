import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Try to create the payment-proofs bucket
    const { data, error } = await supabase.storage.createBucket(
      "payment-proofs",
      {
        public: true,
      }
    )

    if (error && !error.message.includes("already exists")) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: "payment-proofs bucket ready",
    })
  } catch (err) {
    return Response.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
