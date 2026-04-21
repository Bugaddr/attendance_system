#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting deployment to Cloudflare Pages..."

echo "📦 Building the React application..."
npm run build

echo "☁️ Deploying to Cloudflare..."
npx wrangler pages deploy dist --project-name attendance-system

echo "✅ Deployment complete!"
