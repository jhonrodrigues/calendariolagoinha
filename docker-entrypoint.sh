#!/bin/sh
set -e

echo "Starting Church Platform Deployment..."
echo "Database URL: $DATABASE_URL"

# Force SQLite schema synchronization natively into the database volume
echo "Syncing Prisma schema natively..."
npx prisma@5.22.0 db push --accept-data-loss
echo "Seeding database..."
npx prisma@5.22.0 db seed

echo "Prisma migrations completed successfully."

# Execute the main command
echo "Launching Next.js server..."
exec "$@"
