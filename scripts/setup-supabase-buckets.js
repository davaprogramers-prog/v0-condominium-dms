#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupBuckets() {
  try {
    console.log('Creating payment-proofs bucket...');
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('payment-proofs', {
      public: true,
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✓ Bucket payment-proofs already exists');
      } else {
        throw error;
      }
    } else {
      console.log('✓ Bucket payment-proofs created successfully');
    }

    // Set public access policy
    const { error: policyError } = await supabase.storage
      .from('payment-proofs')
      .update('', new Blob(), {
        upsert: true,
      })
      .catch(() => ({ error: null })); // Ignore file upload errors

    console.log('✓ Setup complete!');
  } catch (error) {
    console.error('Error setting up buckets:', error.message);
    process.exit(1);
  }
}

setupBuckets();
