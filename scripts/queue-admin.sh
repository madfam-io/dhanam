#!/bin/bash

# Dhanam Queue Administration Script
# This script manages BullMQ job queues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-local}
ACTION=${2:-status}
QUEUE_NAME=${3:-all}
REDIS_URL=${REDIS_URL:-redis://localhost:6379}

# For remote environments
if [ "$ENVIRONMENT" != "local" ]; then
    # Get Redis endpoint from AWS
    REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
        --cache-cluster-id "dhanam-$ENVIRONMENT-redis" \
        --show-cache-node-info \
        --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$REDIS_ENDPOINT" ]; then
        REDIS_URL="redis://$REDIS_ENDPOINT:6379"
    fi
fi

# Functions
print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
}

print_queue_status() {
    local queue=$1
    echo -e "${MAGENTA}Queue: $queue${NC}"
    
    # Get queue stats using redis-cli
    local waiting=$(redis-cli -u $REDIS_URL llen "bull:$queue:wait" 2>/dev/null || echo "0")
    local active=$(redis-cli -u $REDIS_URL llen "bull:$queue:active" 2>/dev/null || echo "0")
    local completed=$(redis-cli -u $REDIS_URL zcard "bull:$queue:completed" 2>/dev/null || echo "0")
    local failed=$(redis-cli -u $REDIS_URL zcard "bull:$queue:failed" 2>/dev/null || echo "0")
    local delayed=$(redis-cli -u $REDIS_URL zcard "bull:$queue:delayed" 2>/dev/null || echo "0")
    
    echo "  Waiting:   $waiting"
    echo "  Active:    $active"
    echo "  Completed: $completed"
    echo "  Failed:    $failed"
    echo "  Delayed:   $delayed"
    echo ""
}

# Show queue status
show_status() {
    print_header "Queue Status - $ENVIRONMENT"
    echo ""
    
    if [ "$QUEUE_NAME" = "all" ]; then
        # List all queues
        local queues=("sync-transactions" "sync-accounts" "esg-scoring" "email" "reports")
        
        for queue in "${queues[@]}"; do
            print_queue_status $queue
        done
    else
        print_queue_status $QUEUE_NAME
    fi
}

# Show failed jobs
show_failed() {
    print_header "Failed Jobs - $ENVIRONMENT - $QUEUE_NAME"
    echo ""
    
    if [ "$QUEUE_NAME" = "all" ]; then
        echo "Please specify a queue name to view failed jobs"
        exit 1
    fi
    
    # Get failed job IDs
    local failed_ids=$(redis-cli -u $REDIS_URL zrevrange "bull:$QUEUE_NAME:failed" 0 9 2>/dev/null)
    
    if [ -z "$failed_ids" ]; then
        echo -e "${GREEN}No failed jobs${NC}"
    else
        echo "Recent failed jobs:"
        echo "$failed_ids" | while read -r job_id; do
            if [ -n "$job_id" ]; then
                local job_data=$(redis-cli -u $REDIS_URL hget "bull:$QUEUE_NAME:$job_id" data 2>/dev/null || echo "{}")
                local error_msg=$(redis-cli -u $REDIS_URL hget "bull:$QUEUE_NAME:$job_id" failedReason 2>/dev/null || echo "Unknown error")
                
                echo ""
                echo -e "${YELLOW}Job ID: $job_id${NC}"
                echo "Data: $job_data"
                echo -e "${RED}Error: $error_msg${NC}"
            fi
        done
    fi
}

# Retry failed jobs
retry_failed() {
    print_header "Retrying Failed Jobs - $ENVIRONMENT - $QUEUE_NAME"
    echo ""
    
    if [ "$QUEUE_NAME" = "all" ]; then
        echo "Please specify a queue name to retry failed jobs"
        exit 1
    fi
    
    cd apps/api
    
    # Create retry script
    cat > scripts/retry-failed.ts <<EOF
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis('$REDIS_URL');
const queue = new Queue('$QUEUE_NAME', { connection });

async function retryFailed() {
  const failedJobs = await queue.getJobs(['failed'], 0, 100);
  console.log(\`Found \${failedJobs.length} failed jobs\`);
  
  for (const job of failedJobs) {
    await job.retry();
    console.log(\`Retried job \${job.id}\`);
  }
  
  console.log('All failed jobs retried');
}

retryFailed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
EOF
    
    # Run the retry script
    pnpm tsx scripts/retry-failed.ts
    
    # Clean up
    rm scripts/retry-failed.ts
    
    cd ../..
    
    print_success "Failed jobs retried"
}

# Clear queue
clear_queue() {
    print_header "Clearing Queue - $ENVIRONMENT - $QUEUE_NAME"
    echo ""
    
    if [ "$QUEUE_NAME" = "all" ]; then
        echo "Please specify a queue name to clear"
        exit 1
    fi
    
    echo -e "${YELLOW}WARNING: This will remove all jobs from the queue!${NC}"
    read -p "Are you sure you want to continue? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        echo "Operation cancelled"
        exit 0
    fi
    
    cd apps/api
    
    # Create clear script
    cat > scripts/clear-queue.ts <<EOF
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis('$REDIS_URL');
const queue = new Queue('$QUEUE_NAME', { connection });

async function clearQueue() {
  await queue.obliterate({ force: true });
  console.log('Queue cleared: $QUEUE_NAME');
}

clearQueue()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
EOF
    
    # Run the clear script
    pnpm tsx scripts/clear-queue.ts
    
    # Clean up
    rm scripts/clear-queue.ts
    
    cd ../..
    
    print_success "Queue cleared"
}

# Pause/resume queue
pause_resume_queue() {
    local action=$1
    print_header "${action^} Queue - $ENVIRONMENT - $QUEUE_NAME"
    echo ""
    
    if [ "$QUEUE_NAME" = "all" ]; then
        echo "Please specify a queue name to $action"
        exit 1
    fi
    
    cd apps/api
    
    # Create pause/resume script
    cat > scripts/queue-control.ts <<EOF
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis('$REDIS_URL');
const queue = new Queue('$QUEUE_NAME', { connection });

async function ${action}Queue() {
  await queue.${action}();
  console.log('Queue ${action}d: $QUEUE_NAME');
}

${action}Queue()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
EOF
    
    # Run the script
    pnpm tsx scripts/queue-control.ts
    
    # Clean up
    rm scripts/queue-control.ts
    
    cd ../..
    
    print_success "Queue ${action}d"
}

# Add test job
add_test_job() {
    print_header "Adding Test Job - $ENVIRONMENT - $QUEUE_NAME"
    echo ""
    
    if [ "$QUEUE_NAME" = "all" ]; then
        echo "Please specify a queue name to add test job"
        exit 1
    fi
    
    cd apps/api
    
    # Create test job script based on queue type
    case $QUEUE_NAME in
        sync-transactions)
            cat > scripts/add-test-job.ts <<'EOF'
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis('$REDIS_URL');
const queue = new Queue('sync-transactions', { connection });

async function addTestJob() {
  const job = await queue.add('sync-test', {
    connectionId: 'test-connection-123',
    provider: 'manual',
    spaceId: 'test-space-123',
    userId: 'test-user-123',
  });
  
  console.log(`Added test job: ${job.id}`);
}

addTestJob()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
EOF
            ;;
        email)
            cat > scripts/add-test-job.ts <<'EOF'
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis('$REDIS_URL');
const queue = new Queue('email', { connection });

async function addTestJob() {
  const job = await queue.add('send-email', {
    to: 'test@example.com',
    subject: 'Test Email',
    template: 'welcome',
    context: {
      name: 'Test User',
    },
  });
  
  console.log(`Added test job: ${job.id}`);
}

addTestJob()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
EOF
            ;;
        *)
            cat > scripts/add-test-job.ts <<EOF
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis('$REDIS_URL');
const queue = new Queue('$QUEUE_NAME', { connection });

async function addTestJob() {
  const job = await queue.add('test-job', {
    message: 'This is a test job',
    timestamp: new Date().toISOString(),
  });
  
  console.log(\`Added test job: \${job.id}\`);
}

addTestJob()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
EOF
            ;;
    esac
    
    # Run the script
    pnpm tsx scripts/add-test-job.ts
    
    # Clean up
    rm scripts/add-test-job.ts
    
    cd ../..
    
    print_success "Test job added"
}

# Check dependencies
check_dependencies() {
    if ! command -v redis-cli &> /dev/null; then
        echo -e "${RED}redis-cli not found. Please install Redis client tools.${NC}"
        exit 1
    fi
}

# Main execution
check_dependencies

case $ACTION in
    status)
        show_status
        ;;
    failed)
        show_failed
        ;;
    retry)
        retry_failed
        ;;
    clear)
        clear_queue
        ;;
    pause)
        pause_resume_queue "pause"
        ;;
    resume)
        pause_resume_queue "resume"
        ;;
    test)
        add_test_job
        ;;
    *)
        echo "Usage: ./queue-admin.sh [environment] [action] [queue]"
        echo ""
        echo "Arguments:"
        echo "  environment    The environment (default: local)"
        echo "  action         Queue action:"
        echo "                 - status: Show queue statistics"
        echo "                 - failed: Show failed jobs"
        echo "                 - retry: Retry failed jobs"
        echo "                 - clear: Clear all jobs from queue"
        echo "                 - pause: Pause queue processing"
        echo "                 - resume: Resume queue processing"
        echo "                 - test: Add a test job"
        echo "  queue          Queue name (default: all)"
        echo "                 Options: sync-transactions, sync-accounts, esg-scoring, email, reports"
        echo ""
        echo "Examples:"
        echo "  ./queue-admin.sh local status"
        echo "  ./queue-admin.sh staging failed sync-transactions"
        echo "  ./queue-admin.sh production retry email"
        echo "  ./queue-admin.sh local clear sync-transactions"
        exit 1
        ;;
esac