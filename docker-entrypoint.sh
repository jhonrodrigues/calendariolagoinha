#!/bin/sh
set -e

# Run migrations to ensure SQLite schema is up to date
npx prisma migrate deploy

# Optional: Run seed if the database is empty (you should check if users exist)
# npx tsx prisma/seed.ts

# Execute the main command (starts Next.js)
exec "$@"
