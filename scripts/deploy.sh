#!/bin/bash

# Treasury Management System Deployment Script
set -e

# Configuration
ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
REGISTRY="ghcr.io/your-org/treasury-management"

echo "🚀 Deploying Treasury Management System"
echo "Environment: $ENVIRONMENT"
echo "Version: $VERSION"

# Pre-deployment checks
echo "📋 Running pre-deployment checks..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running"
    exit 1
fi

# Check if required environment variables are set
required_vars=("POSTGRES_PASSWORD" "GRAFANA_PASSWORD")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

# Pull latest images
echo "📦 Pulling latest images..."
docker-compose -f docker-compose.${ENVIRONMENT}.yml pull

# Run database migrations (if applicable)
echo "🗄️ Running database migrations..."
# Add your migration commands here

# Deploy application
echo "🚀 Deploying application..."
docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Health checks
echo "🏥 Running health checks..."
services=("frontend" "redis" "postgres")
for service in "${services[@]}"; do
    if docker-compose -f docker-compose.${ENVIRONMENT}.yml ps $service | grep -q "Up (healthy)"; then
        echo "✅ $service is healthy"
    else
        echo "❌ $service is not healthy"
        docker-compose -f docker-compose.${ENVIRONMENT}.yml logs $service
        exit 1
    fi
done

# Clean up old images
echo "🧹 Cleaning up old images..."
docker system prune -f

echo "✅ Deployment completed successfully!"
echo "🌐 Application is available at: http://localhost"

# Send notification (optional)
if [[ -n "$SLACK_WEBHOOK" ]]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ Treasury Management System deployed successfully to $ENVIRONMENT\"}" \
        $SLACK_WEBHOOK
fi