#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/onlinefir"
DB_Container="online-fir-portal-db-1"
DB_USER="postgres"
DB_NAME="onlinefir"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Perform Backup
echo "Starting backup for $DB_NAME at $DATE..."
docker exec -t $DB_Container pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

# Retention Policy: Delete backups older than 30 days
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
