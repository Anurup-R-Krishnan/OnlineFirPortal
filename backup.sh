#!/bin/bash

#############################################
# FIR Portal - Database Backup Script
# Automated PostgreSQL backup with rotation
#############################################

# Configuration
BACKUP_DIR="/var/backups/onlinefir"
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="fir_user"
DB_NAME="fir_portal_prod"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql.gz"
LOG_FILE="/var/log/fir-backup.log"
RETENTION_DAYS=30
ALERT_EMAIL="admin@fir.gov.in"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "========================================" | tee -a "$LOG_FILE"
echo "FIR Portal Backup - $TIMESTAMP" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Check if directory is writable
if [ ! -w "$BACKUP_DIR" ]; then
    echo -e "${RED}✗${NC} Backup directory is not writable: $BACKUP_DIR" | tee -a "$LOG_FILE"
    exit 1
fi

# Perform backup
echo "Starting backup for database: $DB_NAME" | tee -a "$LOG_FILE"
echo "Backup file: $BACKUP_FILE" | tee -a "$LOG_FILE"

# Check if using Docker or local PostgreSQL
if docker ps | grep -q "postgres"; then
    # Docker-based backup
    DB_CONTAINER=$(docker ps | grep postgres | awk '{print $1}')
    echo "Using Docker container: $DB_CONTAINER" | tee -a "$LOG_FILE"
    
    if docker exec -t "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"; then
        echo -e "${GREEN}✓${NC} Backup completed successfully" | tee -a "$LOG_FILE"
    else
        echo -e "${RED}✗${NC} Backup failed!" | tee -a "$LOG_FILE"
        echo "Database backup failed at $TIMESTAMP" | mail -s "FIR Portal Backup Failed" "$ALERT_EMAIL"
        exit 1
    fi
else
    # Local PostgreSQL backup
    echo "Using local PostgreSQL" | tee -a "$LOG_FILE"
    
    if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"; then
        echo -e "${GREEN}✓${NC} Backup completed successfully" | tee -a "$LOG_FILE"
    else
        echo -e "${RED}✗${NC} Backup failed!" | tee -a "$LOG_FILE"
        echo "Database backup failed at $TIMESTAMP" | mail -s "FIR Portal Backup Failed" "$ALERT_EMAIL"
        exit 1
    fi
fi

# Verify backup file exists and has content
if [ -s "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓${NC} Backup file created: $BACKUP_SIZE" | tee -a "$LOG_FILE"
else
    echo -e "${RED}✗${NC} Backup file is empty or missing!" | tee -a "$LOG_FILE"
    exit 1
fi

# Retention policy: Delete backups older than specified days
echo "" | tee -a "$LOG_FILE"
echo "Applying retention policy (${RETENTION_DAYS} days)..." | tee -a "$LOG_FILE"

DELETED_COUNT=$(find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)

if [ "$DELETED_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Deleted $DELETED_COUNT old backup(s)" | tee -a "$LOG_FILE"
else
    echo "No old backups to delete" | tee -a "$LOG_FILE"
fi

# List current backups
echo "" | tee -a "$LOG_FILE"
echo "Current backups:" | tee -a "$LOG_FILE"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5 | tee -a "$LOG_FILE"

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "" | tee -a "$LOG_FILE"
echo "Total backup size: $TOTAL_SIZE" | tee -a "$LOG_FILE"

# Optional: Upload to cloud storage (S3, Google Cloud, etc.)
# Uncomment and configure as needed
# echo "Uploading to cloud storage..." | tee -a "$LOG_FILE"
# aws s3 cp "$BACKUP_FILE" s3://fir-portal-backups/ || echo "Cloud upload failed" | tee -a "$LOG_FILE"

echo "========================================" | tee -a "$LOG_FILE"
echo "Backup completed at $TIMESTAMP" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

exit 0
