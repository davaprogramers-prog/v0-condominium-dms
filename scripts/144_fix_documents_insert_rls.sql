DROP POLICY IF EXISTS "docs_manage" ON documents;
DROP POLICY IF EXISTS "documents_insert_policy" ON documents;
DROP POLICY IF EXISTS "documents_select_policy" ON documents;
DROP POLICY IF EXISTS "documents_update_policy" ON documents;
DROP POLICY IF EXISTS "documents_delete_policy" ON documents;

CREATE POLICY "documents_insert" ON documents FOR INSERT WITH CHECK (true);
