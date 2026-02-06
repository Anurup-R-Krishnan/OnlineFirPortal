#!/bin/bash

URL="http://localhost:3000"
API_URL="http://localhost:3001"
EMAIL="admin@fir.gov.in"

check_health() {
    local url=$1
    local name=$2
    
    if curl --output /dev/null --silent --head --fail "$url"; then
        echo "$name is UP"
    else
        echo "$name is DOWN"
        # In production, integrate with SendGrid/AWS SES or PagerDuty
        # echo "$name is down!" | mail -s "Alert: $name Down" $EMAIL
    fi
}

echo "Running Health Checks..."
check_health $URL "Frontend"
check_health $API_URL "Backend"
echo "Done."
