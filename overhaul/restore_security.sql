-- Restore Security After Testing
-- Run this after testing uploads to restore proper security
-- Remove the temporary policy
DROP POLICY IF EXISTS "temp_allow_all" ON storage.objects;
-- Restore the proper admin-only policy
CREATE POLICY "Admin can upload files" ON storage.objects FOR
INSERT WITH CHECK (auth.email() = 'grantmatai@gmail.com');
CREATE POLICY "Admin can view files" ON storage.objects FOR
SELECT USING (auth.email() = 'grantmatai@gmail.com');
CREATE POLICY "Admin can delete files" ON storage.objects FOR DELETE USING (auth.email() = 'grantmatai@gmail.com');
SELECT 'Security restored' as status;