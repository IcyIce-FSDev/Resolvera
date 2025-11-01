#!/bin/sh
set -e

echo "🚀 Starting Resolvera container..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until nc -z postgres 5432; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Check if migrations succeeded
if [ $? -eq 0 ]; then
  echo "✅ Database migrations completed successfully"
else
  echo "❌ Database migrations failed"
  exit 1
fi

# Generate Prisma client (in case it's not generated)
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "✅ Container initialization complete!"
echo "🌐 Starting application..."
echo ""

# Set hostname for Next.js display (otherwise shows container ID)
export HOSTNAME=0.0.0.0

# Execute the main command
exec "$@"
