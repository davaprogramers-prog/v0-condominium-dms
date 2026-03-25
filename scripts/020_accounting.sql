-- Tablas contables del condominio
-- DEBE (Egresos): gastos del condominio
-- HABER (Ingresos): cuotas y variable

-- Tabla de gastos del condominio (DEBE)
CREATE TABLE IF NOT EXISTS condo_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  category TEXT CHECK (category IN ('reparacion', 'mantenimiento', 'servicios', 'suministros', 'otro')),
  receipt_url TEXT,
  expense_date DATE NOT NULL,
  period_year INT NOT NULL,
  period_month INT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT valid_period_month CHECK (period_month >= 1 AND period_month <= 12)
);

-- Tabla de ingresos del condominio (HABER)
CREATE TABLE IF NOT EXISTS condo_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  house_id UUID REFERENCES houses(id),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  income_type TEXT NOT NULL CHECK (income_type IN ('cuota', 'variable')), -- cuota = gastos comunes, variable = otros
  description TEXT,
  income_date DATE NOT NULL,
  period_year INT NOT NULL,
  period_month INT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT valid_period_month CHECK (period_month >= 1 AND period_month <= 12)
);

-- Tabla de balance mensual (calculated/summary)
CREATE TABLE IF NOT EXISTS condo_monthly_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  period_year INT NOT NULL,
  period_month INT NOT NULL,
  opening_balance DECIMAL(12, 2) DEFAULT 0, -- saldo del mes anterior
  total_income DECIMAL(12, 2) DEFAULT 0,
  total_expenses DECIMAL(12, 2) DEFAULT 0,
  closing_balance DECIMAL(12, 2) DEFAULT 0, -- opening + income - expenses
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(condo_id, period_year, period_month),
  CONSTRAINT valid_period_month CHECK (period_month >= 1 AND period_month <= 12)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_condo_expenses_condo_id ON condo_expenses(condo_id);
CREATE INDEX IF NOT EXISTS idx_condo_expenses_period ON condo_expenses(condo_id, period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_condo_expenses_date ON condo_expenses(expense_date);

CREATE INDEX IF NOT EXISTS idx_condo_income_condo_id ON condo_income(condo_id);
CREATE INDEX IF NOT EXISTS idx_condo_income_period ON condo_income(condo_id, period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_condo_income_date ON condo_income(income_date);

CREATE INDEX IF NOT EXISTS idx_condo_balance_condo_id ON condo_monthly_balance(condo_id);
CREATE INDEX IF NOT EXISTS idx_condo_balance_period ON condo_monthly_balance(condo_id, period_year, period_month);

-- Políticas RLS para condo_expenses
ALTER TABLE condo_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins ver sus gastos" ON condo_expenses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.condo_id = condo_expenses.condo_id
  ));

CREATE POLICY "Admins crear gastos" ON condo_expenses FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.condo_id = condo_expenses.condo_id
  ));

-- Políticas RLS para condo_income
ALTER TABLE condo_income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins ver ingresos" ON condo_income FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.condo_id = condo_income.condo_id
  ));

CREATE POLICY "Admins crear ingresos" ON condo_income FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.condo_id = condo_income.condo_id
  ));

-- Políticas RLS para condo_monthly_balance
ALTER TABLE condo_monthly_balance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins ver balance" ON condo_monthly_balance FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.condo_id = condo_monthly_balance.condo_id
  ));
