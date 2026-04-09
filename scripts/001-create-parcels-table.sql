-- Create parcels/packages table
create table if not exists parcels (
  id uuid default gen_random_uuid() primary key,
  condo_id uuid not null references condominiums(id) on delete cascade,
  house_id uuid not null references houses(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  
  -- Package details
  tracking_number text unique not null,
  sender_name text not null,
  description text,
  status text not null default 'pending', -- pending, received, delivered, unclaimed
  
  -- Dates
  received_date timestamp with time zone default now(),
  delivered_date timestamp with time zone,
  
  -- Metadata
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  constraint valid_status check (status in ('pending', 'received', 'delivered', 'unclaimed'))
);

-- Create index for faster queries
create index if not exists idx_parcels_condo_id on parcels(condo_id);
create index if not exists idx_parcels_house_id on parcels(house_id);
create index if not exists idx_parcels_owner_id on parcels(owner_id);
create index if not exists idx_parcels_status on parcels(status);

-- Enable Row Level Security
alter table parcels enable row level security;

-- RLS Policies
-- Owners can see their own parcels
create policy "Owners can view their parcels"
  on parcels for select
  using (owner_id = auth.uid());

-- Admins can see all parcels in their condo
create policy "Admins can view condo parcels"
  on parcels for select
  using (
    condo_id in (
      select condo_id from user_condos where user_id = auth.uid()
    )
  );

-- Admins can insert parcels in their condo
create policy "Admins can create parcels"
  on parcels for insert
  with check (
    condo_id in (
      select condo_id from user_condos where user_id = auth.uid()
    )
  );

-- Admins can update parcel status
create policy "Admins can update parcels"
  on parcels for update
  using (
    condo_id in (
      select condo_id from user_condos where user_id = auth.uid()
    )
  );
