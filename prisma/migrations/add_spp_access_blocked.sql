-- Migration: Tambah kolom spp_access_blocked dan spp_blocked_reason ke tabel users
-- Jalankan via: Coolify Terminal → npx prisma db execute --file prisma/migrations/add_spp_access_blocked.sql
-- Atau langsung via psql di server

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "spp_access_blocked" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "spp_blocked_reason" TEXT;

-- Verifikasi
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('spp_access_blocked', 'spp_blocked_reason');
