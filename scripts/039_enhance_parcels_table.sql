-- Create parcel_photos table for storing receipt and delivery photos
-- This table will store photos for each stage: reception, delivery, return
create table if not exists parcel_photos (
  id uuid default gen_random_uuid() primary key,
  parcel_id uuid not null,
  photo_type text not null, -- 'reception', 'delivery', 'return'
  photo_url text not null,
  uploaded_by uuid,
  uploaded_at timestamp with time zone default now(),
  notes text,
  created_at timestamp with time zone default now()
);

-- Create indexes for efficient queries
create index if not exists idx_parcel_photos_parcel_id on parcel_photos(parcel_id);
create index if not exists idx_parcel_photos_type on parcel_photos(photo_type);
create index if not exists idx_parcel_photos_uploaded_by on parcel_photos(uploaded_by);
