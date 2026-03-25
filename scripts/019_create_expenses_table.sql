-- Create house expenses table
CREATE TABLE IF NOT EXISTS house_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  condo_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  expense_date DATE NOT NULL,
  category TEXT, -- 'reparación', 'mantenimiento', 'servicios', etc
  receipt_url TEXT, -- URL to the receipt/invoice image
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_house_expenses_house_id ON house_expenses(house_id);
CREATE INDEX idx_house_expenses_condo_id ON house_expenses(condo_id);
CREATE INDEX idx_house_expenses_expense_date ON house_expenses(expense_date);

-- Enable RLS
ALTER TABLE house_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Propietarios can view their expenses" ON house_expenses
  FOR SELECT USING (
    house_id IN (
      SELECT id FROM houses WHERE owner_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all expenses" ON house_expenses
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Anyone can create expenses" ON house_expenses
  FOR INSERT WITH CHECK (true);
