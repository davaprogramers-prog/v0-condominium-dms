-- Enhanced parcels table with additional fields for conserje management

-- Add new columns to parcels table if they don't exist
alter table if exists parcels 
add column if not exists parcel_type text default 'package';

alter table if exists parcels 
add column if not exists recipient_name text;

alter table if exists parcels 
add column if not exists return_reason text;

alter table if exists parcels 
add column if not exists created_by_user_id uuid;

alter table if exists parcels 
add column if not exists receiver_notes text;

alter table if exists parcels 
add column if not exists weight_kg decimal;

alter table if exists parcels 
add column if not exists dimensions_cm text;

alter table if exists parcels 
add column if not exists value_declared decimal;

alter table if exists parcels 
add column if not exists insurance_required boolean default false;

alter table if exists parcels 
add column if not exists received_by text;

alter table if exists parcels 
add column if not exists delivered_by text;

-- Create parcel_photos table for storing receipt and delivery photos
create table if not exists parcel_photos (
  id uuid default gen_random_uuid() primary key,
  parcel_id uuid not null,
  photo_type text not null,
  photo_url text not null,
  uploaded_by uuid not null,
  uploaded_at timestamp with time zone default now(),
  notes text
);

-- Create indexes for parcel_photos
create index if not exists idx_parcel_photos_parcel_id on parcel_photos(parcel_id);
create index if not exists idx_parcel_photos_type on parcel_photos(photo_type);
create index if not exists idx_parcel_photos_uploaded_by on parcel_photos(uploaded_by);
