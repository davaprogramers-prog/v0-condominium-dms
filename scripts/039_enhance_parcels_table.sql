-- Enhanced parcels table with additional fields for conserje management
-- Add new columns to parcels table if they don't exist

-- Add new columns
alter table parcels 
add column if not exists parcel_type text default 'package', -- 'envelope', 'package', 'box', etc
add column if not exists recipient_name text,
add column if not exists return_reason text,
add column if not exists created_by_user_id uuid references auth.users(id),
add column if not exists receiver_notes text,
add column if not exists weight_kg decimal,
add column if not exists dimensions_cm text, -- Format: "20x30x10"
add column if not exists value_declared decimal,
add column if not exists insurance_required boolean default false,
add column if not exists received_by text,
add column if not exists delivered_by text;

-- Create parcel_photos table for storing receipt and delivery photos
create table if not exists parcel_photos (
  id uuid default gen_random_uuid() primary key,
  parcel_id uuid not null references parcels(id) on delete cascade,
  photo_type text not null, -- 'reception', 'delivery', 'return'
  photo_url text not null,
  uploaded_by uuid not null references auth.users(id),
  uploaded_at timestamp with time zone default now(),
  notes text,
  
  constraint valid_photo_type check (photo_type in ('reception', 'delivery', 'return'))
);

-- Create indexes for parcel_photos
create index if not exists idx_parcel_photos_parcel_id on parcel_photos(parcel_id);
create index if not exists idx_parcel_photos_type on parcel_photos(photo_type);
create index if not exists idx_parcel_photos_uploaded_by on parcel_photos(uploaded_by);

-- Enable RLS on parcel_photos
alter table parcel_photos enable row level security;

-- RLS Policies for parcel_photos
create policy "Admin and concierge can view parcel photos"
  on parcel_photos for select
  using (
    exists (
      select 1 from parcels p
      where p.id = parcel_photos.parcel_id
      and p.condo_id = (
        select condo_id from profiles where id = auth.uid()
      )
    )
  );

create policy "Admin and concierge can add parcel photos"
  on parcel_photos for insert
  with check (
    uploaded_by = auth.uid() and
    exists (
      select 1 from parcels p
      where p.id = parcel_photos.parcel_id
      and p.condo_id = (
        select condo_id from profiles where id = auth.uid()
      )
    )
  );

-- Update parcels table RLS to allow conserjes
drop policy if exists "Admins can create parcels" on parcels;
drop policy if exists "Admins can update parcels" on parcels;

-- Allow both admins and concierges to create and update parcels
create policy "Admins and concierges can create parcels"
  on parcels for insert
  with check (
    condo_id = (
      select condo_id from profiles where id = auth.uid()
    ) and
    (
      (select role from profiles where id = auth.uid()) in ('admin', 'super_admin', 'conserje')
    )
  );

create policy "Admins and concierges can update parcels"
  on parcels for update
  using (
    condo_id = (
      select condo_id from profiles where id = auth.uid()
    ) and
    (
      (select role from profiles where id = auth.uid()) in ('admin', 'super_admin', 'conserje')
    )
  );
