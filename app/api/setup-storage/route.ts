import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    console.log('[v0] Attempting to create avatars bucket...')
    
    // Try to create the bucket
    const { data, error: createError } = await supabase.storage.createBucket('avatars', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    })

    if (createError) {
      // Bucket might already exist, which is fine
      if (createError.message.includes('already exists')) {
        console.log('[v0] Avatars bucket already exists')
        return NextResponse.json({
          success: true,
          message: 'Avatars bucket already exists',
        })
      }
      throw createError
    }

    console.log('[v0] Avatars bucket created successfully')

    return NextResponse.json({
      success: true,
      message: 'Avatars bucket created successfully',
      data,
    })
  } catch (error) {
    console.error('[v0] Error creating bucket:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
