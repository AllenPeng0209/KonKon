CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    family_id UUID REFERENCES families(id),
    "date" DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    "type" TEXT NOT NULL CHECK (type IN ('income', 'expense'))
);

-- RLS Policies
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for family members" ON expenses
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1
    FROM family_members
    WHERE family_members.family_id = expenses.family_id AND family_members.user_id = auth.uid()
  )
);

CREATE POLICY "Enable insert for authenticated users" ON expenses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for owner" ON expenses
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for owner" ON expenses
FOR DELETE
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_family_id ON expenses(family_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category); 