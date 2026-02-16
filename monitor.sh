#!/bin/bash

#############################################
# FIR Portal - Production Monitoring Script
# Checks health of frontend, backend, and database
#############################################

# Configuration
FRONTEND_URL="http://localhost:4000"
BACKEND_URL="http://localhost:5000"
API_HEALTH_ENDPOINT="${BACKEND_URL}/api/health"
LOG_FILE="/var/log/fir-monitor.log"
ALERT_EMAIL="admin@fir.gov.in"
SLACK_WEBHOOK=""  # Optional: Add Slack webhook for alerts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "========================================" | tee -a "$LOG_FILE"
echo "FIR Portal Health Check - $TIMESTAMP" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# Function to check HTTP endpoint
check_http() {
    local url=$1
    local name=$2
    local response_code=$(curl -o /dev/null -s -w "%{http_code}" "$url" --max-time 10)
    
    if [ "$response_code" -eq 200 ]; then
        echo -e "${GREEN}✓${NC} $name is UP (HTTP $response_code)" | tee -a "$LOG_FILE"
        return 0
    else
        echo -e "${RED}✗${NC} $name is DOWN (HTTP $response_code)" | tee -a "$LOG_FILE"
        send_alert "$name is DOWN - HTTP $response_code"
        return 1
    fi
}

# Function to check process
check_process() {
    local process_name=$1
    if pm2 list | grep -q "$process_name.*online"; then
        echo -e "${GREEN}✓${NC} Process $process_name is running" | tee -a "$LOG_FILE"
        return 0
    else
        echo -e "${RED}✗${NC} Process $process_name is NOT running" | tee -a "$LOG_FILE"
        send_alert "Process $process_name is down"
        return 1
    fi
}

# Function to check database
check_database() {
    if psql -U fir_user -d fir_portal_prod -c "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Database is accessible" | tee -a "$LOG_FILE"
        return 0
    else
        echo -e "${RED}✗${NC} Database is NOT accessible" | tee -a "$LOG_FILE"
        send_alert "Database connection failed"
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    local usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$usage" -lt 80 ]; then
        echo -e "${GREEN}✓${NC} Disk space OK ($usage% used)" | tee -a "$LOG_FILE"
    elif [ "$usage" -lt 90 ]; then
        echo -e "${YELLOW}⚠${NC} Disk space warning ($usage% used)" | tee -a "$LOG_FILE"
    else
        echo -e "${RED}✗${NC} Disk space critical ($usage% used)" | tee -a "$LOG_FILE"
        send_alert "Disk space critical: $usage% used"
    fi
}

# Function to check memory
check_memory() {
    local usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
    if [ "$usage" -lt 80 ]; then
        echo -e "${GREEN}✓${NC} Memory OK ($usage% used)" | tee -a "$LOG_FILE"
    elif [ "$usage" -lt 90 ]; then
        echo -e "${YELLOW}⚠${NC} Memory warning ($usage% used)" | tee -a "$LOG_FILE"
    else
        echo -e "${RED}✗${NC} Memory critical ($usage% used)" | tee -a "$LOG_FILE"
        send_alert "Memory critical: $usage% used"
    fi
}

# Function to send alerts
send_alert() {
    local message=$1
    
    # Log alert
    echo "[ALERT] $message" >> "$LOG_FILE"
    
    # Send email (requires mailutils)
    if command -v mail &> /dev/null; then
        echo "$message at $TIMESTAMP" | mail -s "FIR Portal Alert" "$ALERT_EMAIL"
    fi
    
    # Send Slack notification (if webhook configured)
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 FIR Portal Alert: $message\"}" \
            "$SLACK_WEBHOOK" > /dev/null 2>&1
    fi
}

# Run health checks
echo ""
echo "Checking Services..." | tee -a "$LOG_FILE"
check_http "$FRONTEND_URL" "Frontend"
check_http "$API_HEALTH_ENDPOINT" "Backend API"

echo ""
echo "Checking Processes..." | tee -a "$LOG_FILE"
check_process "fir-backend"
check_process "fir-frontend"

echo ""
echo "Checking Database..." | tee -a "$LOG_FILE"
check_database

echo ""
echo "Checking System Resources..." | tee -a "$LOG_FILE"
check_disk_space
check_memory

echo ""
echo "========================================" | tee -a "$LOG_FILE"
echo "Health check completed at $TIMESTAMP" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
