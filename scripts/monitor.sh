#!/bin/bash

# Dhanam Monitoring Script
# This script monitors the health and performance of the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
MONITOR_TYPE=${2:-health}
AWS_REGION=${AWS_REGION:-us-east-1}
TERRAFORM_DIR="infra/terraform"
REFRESH_INTERVAL=5

# Functions
print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
}

print_metric() {
    printf "${MAGENTA}%-30s${NC} %s\n" "$1:" "$2"
}

print_status() {
    if [ "$2" = "healthy" ] || [ "$2" = "running" ] || [ "$2" = "active" ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1${NC}"
    fi
}

# Get ALB endpoint
get_alb_endpoint() {
    pushd $TERRAFORM_DIR > /dev/null
    ALB_DNS=$(terraform output -raw alb_dns_name 2>/dev/null || echo "")
    popd > /dev/null
    
    if [ -z "$ALB_DNS" ]; then
        echo "Error: Could not get ALB endpoint"
        exit 1
    fi
}

# Monitor health
monitor_health() {
    get_alb_endpoint
    
    while true; do
        clear
        print_header "Dhanam Health Monitor - $ENVIRONMENT"
        echo ""
        
        # API Health
        API_HEALTH=$(curl -s "https://$ALB_DNS/api/health" 2>/dev/null || echo "{}")
        API_STATUS=$(echo $API_HEALTH | jq -r '.status // "unknown"')
        
        echo -e "${BLUE}API Health:${NC}"
        print_status "Overall Status" "$API_STATUS"
        
        if [ "$API_STATUS" = "healthy" ]; then
            # Database
            DB_STATUS=$(echo $API_HEALTH | jq -r '.checks.database.status // "unknown"')
            DB_LATENCY=$(echo $API_HEALTH | jq -r '.checks.database.latency // "N/A"')
            print_status "Database" "$DB_STATUS"
            print_metric "  Latency" "${DB_LATENCY}ms"
            
            # Redis
            REDIS_STATUS=$(echo $API_HEALTH | jq -r '.checks.redis.status // "unknown"')
            REDIS_LATENCY=$(echo $API_HEALTH | jq -r '.checks.redis.latency // "N/A"')
            print_status "Redis" "$REDIS_STATUS"
            print_metric "  Latency" "${REDIS_LATENCY}ms"
            
            # Queues
            QUEUE_STATUS=$(echo $API_HEALTH | jq -r '.checks.queues.status // "unknown"')
            print_status "Job Queues" "$QUEUE_STATUS"
            
            # External Services
            echo ""
            echo -e "${BLUE}External Services:${NC}"
            BELVO_STATUS=$(echo $API_HEALTH | jq -r '.checks.externalServices.belvo // "unknown"')
            PLAID_STATUS=$(echo $API_HEALTH | jq -r '.checks.externalServices.plaid // "unknown"')
            BITSO_STATUS=$(echo $API_HEALTH | jq -r '.checks.externalServices.bitso // "unknown"')
            
            print_status "Belvo API" "$BELVO_STATUS"
            print_status "Plaid API" "$PLAID_STATUS"
            print_status "Bitso API" "$BITSO_STATUS"
        fi
        
        echo ""
        echo -e "${YELLOW}Refreshing in $REFRESH_INTERVAL seconds... (Ctrl+C to exit)${NC}"
        sleep $REFRESH_INTERVAL
    done
}

# Monitor metrics
monitor_metrics() {
    get_alb_endpoint
    
    while true; do
        clear
        print_header "Dhanam Metrics Monitor - $ENVIRONMENT"
        echo ""
        
        # Get metrics
        METRICS=$(curl -s "https://$ALB_DNS/api/monitoring/metrics" 2>/dev/null || echo "{}")
        
        if [ "$(echo $METRICS | jq -r '.error // ""')" = "" ]; then
            # System Metrics
            echo -e "${BLUE}System Metrics:${NC}"
            TOTAL_USERS=$(echo $METRICS | jq -r '.system.totalUsers // 0')
            ACTIVE_USERS=$(echo $METRICS | jq -r '.system.activeUsers // 0')
            TOTAL_SPACES=$(echo $METRICS | jq -r '.system.totalSpaces // 0')
            TOTAL_ACCOUNTS=$(echo $METRICS | jq -r '.system.totalAccounts // 0')
            TOTAL_TRANSACTIONS=$(echo $METRICS | jq -r '.system.totalTransactions // 0')
            ACTIVE_BUDGETS=$(echo $METRICS | jq -r '.system.activeBudgets // 0')
            
            print_metric "Total Users" "$TOTAL_USERS"
            print_metric "Active Users (30d)" "$ACTIVE_USERS"
            print_metric "Total Spaces" "$TOTAL_SPACES"
            print_metric "Total Accounts" "$TOTAL_ACCOUNTS"
            print_metric "Total Transactions" "$TOTAL_TRANSACTIONS"
            print_metric "Active Budgets" "$ACTIVE_BUDGETS"
            
            # Job Metrics
            echo ""
            echo -e "${BLUE}Job Queue Metrics:${NC}"
            echo $METRICS | jq -r '.jobs[] | "\(.name): \(.completed) completed, \(.failed) failed, \(.active) active, \(.waiting) waiting"' | while read line; do
                echo "  $line"
            done
            
            # Performance Metrics
            echo ""
            echo -e "${BLUE}Performance Metrics:${NC}"
            AVG_RESPONSE=$(echo $METRICS | jq -r '.performance.avgResponseTime // "N/A"')
            P95_RESPONSE=$(echo $METRICS | jq -r '.performance.p95ResponseTime // "N/A"')
            P99_RESPONSE=$(echo $METRICS | jq -r '.performance.p99ResponseTime // "N/A"')
            ERROR_RATE=$(echo $METRICS | jq -r '.performance.errorRate // "N/A"')
            
            print_metric "Average Response Time" "${AVG_RESPONSE}ms"
            print_metric "P95 Response Time" "${P95_RESPONSE}ms"
            print_metric "P99 Response Time" "${P99_RESPONSE}ms"
            print_metric "Error Rate" "${ERROR_RATE}%"
        else
            echo -e "${RED}Failed to fetch metrics${NC}"
        fi
        
        echo ""
        echo -e "${YELLOW}Refreshing in $REFRESH_INTERVAL seconds... (Ctrl+C to exit)${NC}"
        sleep $REFRESH_INTERVAL
    done
}

# Monitor ECS services
monitor_ecs() {
    ECS_CLUSTER="dhanam-$ENVIRONMENT"
    
    while true; do
        clear
        print_header "Dhanam ECS Monitor - $ENVIRONMENT"
        echo ""
        
        # Get service status
        echo -e "${BLUE}ECS Services:${NC}"
        
        # API Service
        API_SERVICE=$(aws ecs describe-services \
            --cluster $ECS_CLUSTER \
            --services dhanam-$ENVIRONMENT-api \
            --query 'services[0]' \
            --region $AWS_REGION 2>/dev/null || echo "{}")
        
        if [ "$API_SERVICE" != "{}" ]; then
            API_DESIRED=$(echo $API_SERVICE | jq -r '.desiredCount // 0')
            API_RUNNING=$(echo $API_SERVICE | jq -r '.runningCount // 0')
            API_PENDING=$(echo $API_SERVICE | jq -r '.pendingCount // 0')
            
            echo -e "${MAGENTA}API Service:${NC}"
            print_metric "  Desired Tasks" "$API_DESIRED"
            print_metric "  Running Tasks" "$API_RUNNING"
            print_metric "  Pending Tasks" "$API_PENDING"
        fi
        
        # Web Service
        WEB_SERVICE=$(aws ecs describe-services \
            --cluster $ECS_CLUSTER \
            --services dhanam-$ENVIRONMENT-web \
            --query 'services[0]' \
            --region $AWS_REGION 2>/dev/null || echo "{}")
        
        if [ "$WEB_SERVICE" != "{}" ]; then
            WEB_DESIRED=$(echo $WEB_SERVICE | jq -r '.desiredCount // 0')
            WEB_RUNNING=$(echo $WEB_SERVICE | jq -r '.runningCount // 0')
            WEB_PENDING=$(echo $WEB_SERVICE | jq -r '.pendingCount // 0')
            
            echo ""
            echo -e "${MAGENTA}Web Service:${NC}"
            print_metric "  Desired Tasks" "$WEB_DESIRED"
            print_metric "  Running Tasks" "$WEB_RUNNING"
            print_metric "  Pending Tasks" "$WEB_PENDING"
        fi
        
        # Recent deployments
        echo ""
        echo -e "${BLUE}Recent Deployments:${NC}"
        aws ecs describe-services \
            --cluster $ECS_CLUSTER \
            --services dhanam-$ENVIRONMENT-api dhanam-$ENVIRONMENT-web \
            --query 'services[].deployments[0].[taskDefinition,status,createdAt]' \
            --output table \
            --region $AWS_REGION 2>/dev/null || echo "No deployments found"
        
        echo ""
        echo -e "${YELLOW}Refreshing in $REFRESH_INTERVAL seconds... (Ctrl+C to exit)${NC}"
        sleep $REFRESH_INTERVAL
    done
}

# Monitor logs
monitor_logs() {
    SERVICE=${3:-api}
    LOG_GROUP="/ecs/dhanam-$ENVIRONMENT-$SERVICE"
    
    print_header "Dhanam Logs - $ENVIRONMENT - $SERVICE"
    echo ""
    echo -e "${YELLOW}Streaming logs from CloudWatch...${NC}"
    echo ""
    
    # Stream logs
    aws logs tail $LOG_GROUP \
        --follow \
        --format short \
        --region $AWS_REGION
}

# Check alerts
check_alerts() {
    get_alb_endpoint
    
    print_header "Dhanam Alert Check - $ENVIRONMENT"
    echo ""
    
    # Check budget alerts
    echo -e "${BLUE}Budget Alerts:${NC}"
    ALERTS=$(curl -s "https://$ALB_DNS/api/monitoring/alerts" 2>/dev/null || echo "{}")
    
    if [ "$(echo $ALERTS | jq -r '.error // ""')" = "" ]; then
        BUDGET_ALERTS=$(echo $ALERTS | jq -r '.budgetAlerts // []')
        if [ "$(echo $BUDGET_ALERTS | jq '. | length')" -gt 0 ]; then
            echo $BUDGET_ALERTS | jq -r '.[] | "  \(.spaceName): \(.categoryName) at \(.percentUsed)% of budget"'
        else
            echo -e "${GREEN}  No budget alerts${NC}"
        fi
        
        # Check failed syncs
        echo ""
        echo -e "${BLUE}Failed Sync Alerts:${NC}"
        SYNC_ALERTS=$(echo $ALERTS | jq -r '.syncAlerts // []')
        if [ "$(echo $SYNC_ALERTS | jq '. | length')" -gt 0 ]; then
            echo $SYNC_ALERTS | jq -r '.[] | "  \(.provider) sync failed for \(.accountName) at \(.lastAttempt)"'
        else
            echo -e "${GREEN}  No sync failures${NC}"
        fi
        
        # Check system alerts
        echo ""
        echo -e "${BLUE}System Alerts:${NC}"
        ERROR_RATE=$(echo $ALERTS | jq -r '.systemAlerts.highErrorRate // false')
        SLOW_RESPONSE=$(echo $ALERTS | jq -r '.systemAlerts.slowResponse // false')
        QUEUE_BACKLOG=$(echo $ALERTS | jq -r '.systemAlerts.queueBacklog // false')
        
        if [ "$ERROR_RATE" = "true" ]; then
            echo -e "${RED}  ✗ High error rate detected${NC}"
        fi
        if [ "$SLOW_RESPONSE" = "true" ]; then
            echo -e "${RED}  ✗ Slow response times detected${NC}"
        fi
        if [ "$QUEUE_BACKLOG" = "true" ]; then
            echo -e "${RED}  ✗ Queue backlog detected${NC}"
        fi
        
        if [ "$ERROR_RATE" = "false" ] && [ "$SLOW_RESPONSE" = "false" ] && [ "$QUEUE_BACKLOG" = "false" ]; then
            echo -e "${GREEN}  No system alerts${NC}"
        fi
    else
        echo -e "${RED}Failed to fetch alerts${NC}"
    fi
}

# Main logic
case $MONITOR_TYPE in
    health)
        monitor_health
        ;;
    metrics)
        monitor_metrics
        ;;
    ecs)
        monitor_ecs
        ;;
    logs)
        monitor_logs
        ;;
    alerts)
        check_alerts
        ;;
    *)
        echo "Usage: ./monitor.sh [environment] [type] [options]"
        echo ""
        echo "Arguments:"
        echo "  environment    The environment (default: staging)"
        echo "  type          Monitor type:"
        echo "                - health: Monitor service health"
        echo "                - metrics: Monitor system metrics"
        echo "                - ecs: Monitor ECS services"
        echo "                - logs: Stream CloudWatch logs"
        echo "                - alerts: Check for alerts"
        echo ""
        echo "Examples:"
        echo "  ./monitor.sh staging health"
        echo "  ./monitor.sh production metrics"
        echo "  ./monitor.sh staging logs api"
        echo "  ./monitor.sh production alerts"
        exit 1
        ;;
esac