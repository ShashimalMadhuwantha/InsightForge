#!/bin/sh
set -e

echo "🔍 InsightForge Container Booting [NODE_ENV=${NODE_ENV:-development}]..."

# Check if auto-migration is enabled (default enabled in development)
if [ "$NODE_ENV" = "development" ] || [ "$AUTO_MIGRATE" = "true" ]; then
  echo "📦 Running pending database migrations..."
  npm run migrate:up || {
    echo "⚠️ Warning: Database migration failed or database not ready yet. Retrying in 3s..."
    sleep 3
    npm run migrate:up
  }
  echo "✅ Migrations up to date."
else
  echo "ℹ️ Production mode detected. Automatic boot migrations disabled (use CI/CD or explicit command)."
fi

# Execute the passed CMD
exec "$@"
