-- Disable RLS for projects table to allow admins to create projects
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_quotes DISABLE ROW LEVEL SECURITY;
