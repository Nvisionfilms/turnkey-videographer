-- Add admin user
-- Email: nvisionmg@gmail.com
-- Password: NOPmg512!

INSERT INTO admins (email, password_hash, name, created_at)
VALUES (
  'nvisionmg@gmail.com',
  '$2b$10$I/4VOuyhX68hVwP07.ap1usoRzxiysMfWoz8aUdmLMCgOGQSFHRFa',
  'Admin',
  NOW()
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash;
