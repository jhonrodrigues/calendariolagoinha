#!/bin/sh
set -e

echo "Starting Church Platform Deployment..."
echo "Database URL: $DATABASE_URL"

# Run migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Prisma migrations completed successfully."

# Execute the main command
echo "Launching Next.js server..."
exec "$@"
