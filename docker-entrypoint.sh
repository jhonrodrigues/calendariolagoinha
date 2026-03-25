#!/bin/sh
set -e

echo "Starting Church Platform Deployment..."
echo "Database URL: $DATABASE_URL"

# Force SQLite schema synchronization natively into the database volume
echo "Syncing Prisma schema natively..."
node node_modules/prisma/build/index.js db push --accept-data-loss --skip-generate
echo "Seeding database..."
node node_modules/prisma/build/index.js db seed

echo "Prisma migrations completed successfully."

# Execute the main command
echo "Launching Next.js server..."
exec "$@"
