#!/bin/bash

# Treasury Management System Backup Script
set -e

BACKUP_DIR="/opt/backups/treasury"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

echo "📦 Starting backup process..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
echo "🗄️ Backing up database..."
docker exec treasury_postgres pg_dump -U treasury_user treasury_db > $BACKUP_DIR/db_backup_$DATE.sql

# Redis backup
echo "💾 Backing up Redis..."
docker exec treasury_redis redis-cli BGSAVE
docker cp treasury_redis:/data/dump.rdb $BACKUP_DIR/redis_backup_$DATE.rdb

# Application logs backup
echo "📋 Backing up logs..."
tar -czf $BACKUP_DIR/logs_backup_$DATE.tar.gz /var/log/treasury/

# Configuration backup
echo "⚙️ Backing up configuration..."
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz docker-compose*.yml .env*

# Clean old backups
echo "🧹 Cleaning old backups..."
find $BACKUP_DIR -name "*.sql" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.rdb" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup completed successfully!"
echo "📁 Backups stored in: $BACKUP_DIR"