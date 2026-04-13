import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupRLS() {
  console.log("[v0] Setting up RLS policies for parcels and parcel_photos tables...");

  const policies = [
    // parcels table RLS
    {
      table: "parcels",
      name: "Users can view parcels in their condo",
      definition: `auth.uid() IN (
        SELECT id FROM profiles WHERE condo_id = (
          SELECT condo_id FROM parcels WHERE id = parcels.id
        )
      )`,
      command: "SELECT",
    },
    {
      table: "parcels",
      name: "Conserje can insert parcels in their condo",
      definition: `EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'conserje'
        AND condo_id = NEW.condo_id
      )`,
      command: "INSERT",
    },
    {
      table: "parcels",
      name: "Conserje can update parcels in their condo if in recibido status",
      definition: `EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'conserje'
        AND condo_id = (SELECT condo_id FROM parcels WHERE id = parcels.id)
      ) AND (SELECT status FROM parcels WHERE id = parcels.id) = 'recibido'`,
      command: "UPDATE",
    },

    // parcel_photos table RLS
    {
      table: "parcel_photos",
      name: "Users can view photos for parcels in their condo",
      definition: `EXISTS (
        SELECT 1 FROM parcels p
        JOIN profiles pr ON pr.condo_id = p.condo_id
        WHERE pr.id = auth.uid()
        AND p.id = parcel_photos.parcel_id
      )`,
      command: "SELECT",
    },
    {
      table: "parcel_photos",
      name: "Conserje can insert parcel photos in their condo",
      definition: `EXISTS (
        SELECT 1 FROM parcels p
        JOIN profiles pr ON pr.condo_id = p.condo_id
        WHERE pr.id = auth.uid()
        AND pr.role = 'conserje'
        AND p.id = parcel_photos.parcel_id
      )`,
      command: "INSERT",
    },
  ];

  // Execute RLS setup via raw SQL
  const sql = `
    -- Enable RLS on tables
    ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
    ALTER TABLE parcel_photos ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view parcels in their condo" ON parcels;
    DROP POLICY IF EXISTS "Conserje can insert parcels in their condo" ON parcels;
    DROP POLICY IF EXISTS "Conserje can update parcels in their condo if in recibido status" ON parcels;
    DROP POLICY IF EXISTS "Users can view photos for parcels in their condo" ON parcel_photos;
    DROP POLICY IF EXISTS "Conserje can insert parcel photos in their condo" ON parcel_photos;

    -- Create policies for parcels
    CREATE POLICY "Users can view parcels in their condo" ON parcels
      FOR SELECT USING (
        auth.uid() IN (
          SELECT id FROM profiles WHERE condo_id = parcels.condo_id
        )
      );

    CREATE POLICY "Conserje can insert parcels in their condo" ON parcels
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role = 'conserje'
          AND condo_id = NEW.condo_id
        )
      );

    CREATE POLICY "Conserje can update parcels in their condo if recibido" ON parcels
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role = 'conserje'
          AND condo_id = parcels.condo_id
        ) AND parcels.status = 'recibido'
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role = 'conserje'
          AND condo_id = NEW.condo_id
        )
      );

    -- Create policies for parcel_photos
    CREATE POLICY "Users can view photos for parcels in their condo" ON parcel_photos
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM parcels p
          JOIN profiles pr ON pr.condo_id = p.condo_id
          WHERE pr.id = auth.uid()
          AND p.id = parcel_photos.parcel_id
        )
      );

    CREATE POLICY "Conserje can insert parcel photos in their condo" ON parcel_photos
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM parcels p
          JOIN profiles pr ON pr.condo_id = p.condo_id
          WHERE pr.id = auth.uid()
          AND pr.role = 'conserje'
          AND p.id = parcel_photos.parcel_id
        )
      );
  `;

  try {
    const { error } = await supabase.rpc("execute_sql", { sql });
    if (error) {
      console.error("[v0] Error executing SQL:", error);
    } else {
      console.log("[v0] RLS policies created successfully");
    }
  } catch (err) {
    console.error("[v0] Error:", err);
  }
}

setupRLS();
