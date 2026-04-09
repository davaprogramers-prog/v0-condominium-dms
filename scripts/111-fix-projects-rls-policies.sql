-- Fix RLS policies for projects table
-- Allow users to insert projects if they are admin/super_admin in the condo
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "allow_read_projects" ON projects;
DROP POLICY IF EXISTS "allow_insert_projects" ON projects;
DROP POLICY IF EXISTS "allow_update_projects" ON projects;
DROP POLICY IF EXISTS "allow_delete_projects" ON projects;

-- Create policies for projects
CREATE POLICY "allow_read_projects" ON projects
  FOR SELECT
  USING (
    condo_id IN (
      SELECT condo_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "allow_insert_projects" ON projects
  FOR INSERT
  WITH CHECK (
    condo_id IN (
      SELECT condo_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "allow_update_projects" ON projects
  FOR UPDATE
  USING (
    condo_id IN (
      SELECT condo_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    condo_id IN (
      SELECT condo_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "allow_delete_projects" ON projects
  FOR DELETE
  USING (
    condo_id IN (
      SELECT condo_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Fix RLS policies for project_quotes table
ALTER TABLE project_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_read_project_quotes" ON project_quotes;
DROP POLICY IF EXISTS "allow_insert_project_quotes" ON project_quotes;
DROP POLICY IF EXISTS "allow_update_project_quotes" ON project_quotes;
DROP POLICY IF EXISTS "allow_delete_project_quotes" ON project_quotes;

CREATE POLICY "allow_read_project_quotes" ON project_quotes
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "allow_insert_project_quotes" ON project_quotes
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects 
      WHERE condo_id IN (
        SELECT condo_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
      )
    )
  );

CREATE POLICY "allow_update_project_quotes" ON project_quotes
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE condo_id IN (
        SELECT condo_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
      )
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects 
      WHERE condo_id IN (
        SELECT condo_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
      )
    )
  );

CREATE POLICY "allow_delete_project_quotes" ON project_quotes
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE condo_id IN (
        SELECT condo_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
      )
    )
  );
