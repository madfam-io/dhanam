#!/usr/bin/env bash
# =============================================================================
# Dhanam Deployment Script - Operation LIFTOFF
# =============================================================================
# Deploys Dhanam to the Galaxy Ecosystem (Enclii K8s Cluster)
#
# Prerequisites:
#   - kubectl configured for foundry-core cluster
#   - Access to ghcr.io/madfam-org container registry
#   - Secrets configured in dhanam namespace
#
# Usage:
#   ./scripts/deploy-dhanam.sh [--dry-run]
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="dhanam"
MANIFEST_DIR="$(dirname "$0")/../infra/k8s/production"
DRY_RUN="${1:-}"

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install kubectl."
        exit 1
    fi

    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster. Check your kubeconfig."
        exit 1
    fi

    # Check manifest directory
    if [[ ! -d "$MANIFEST_DIR" ]]; then
        log_error "Manifest directory not found: $MANIFEST_DIR"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# =============================================================================
# Deployment Functions
# =============================================================================

deploy_namespace() {
    log_info "Creating namespace: $NAMESPACE"

    local cmd="kubectl apply -f ${MANIFEST_DIR}/namespace.yaml"
    if [[ "$DRY_RUN" == "--dry-run" ]]; then
        cmd="$cmd --dry-run=client"
    fi

    eval "$cmd"
    log_success "Namespace configured"
}

check_secrets() {
    log_info "Checking secrets..."

    # Check if secrets exist
    if ! kubectl get secret dhanam-secrets -n "$NAMESPACE" &> /dev/null; then
        log_warning "Secret 'dhanam-secrets' not found in namespace '$NAMESPACE'"
        log_info "Please create secrets using the template:"
        echo ""
        echo "  kubectl create secret generic dhanam-secrets -n dhanam \\"
        echo "    --from-literal=DATABASE_URL='postgresql://...' \\"
        echo "    --from-literal=REDIS_URL='redis://...' \\"
        echo "    --from-literal=OIDC_CLIENT_SECRET='jns_...' \\"
        echo "    --from-literal=NEXTAUTH_SECRET='...' \\"
        echo "    --from-literal=ENCRYPTION_KEY='...'"
        echo ""

        if [[ "$DRY_RUN" != "--dry-run" ]]; then
            read -p "Continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        log_success "Secret 'dhanam-secrets' found"
    fi

    # Check billing secrets
    if ! kubectl get secret dhanam-billing-secrets -n "$NAMESPACE" &> /dev/null; then
        log_warning "Secret 'dhanam-billing-secrets' not found"
        log_info "Please create billing secrets:"
        echo ""
        echo "  kubectl create secret generic dhanam-billing-secrets -n dhanam \\"
        echo "    --from-literal=STRIPE_MX_SECRET_KEY='sk_live_...' \\"
        echo "    --from-literal=STRIPE_MX_PUBLISHABLE_KEY='pk_live_...' \\"
        echo "    --from-literal=STRIPE_MX_WEBHOOK_SECRET='whsec_...' \\"
        echo "    --from-literal=PADDLE_VENDOR_ID='...' \\"
        echo "    --from-literal=PADDLE_API_KEY='...' \\"
        echo "    --from-literal=PADDLE_CLIENT_TOKEN='...' \\"
        echo "    --from-literal=PADDLE_WEBHOOK_SECRET='...'"
        echo ""
    else
        log_success "Secret 'dhanam-billing-secrets' found"
    fi
}

deploy_api() {
    log_info "Deploying Dhanam API (NestJS)..."

    local cmd="kubectl apply -f ${MANIFEST_DIR}/api-deployment.yaml"
    if [[ "$DRY_RUN" == "--dry-run" ]]; then
        cmd="$cmd --dry-run=client"
    fi

    eval "$cmd"
    log_success "API deployment applied"
}

deploy_web() {
    log_info "Deploying Dhanam Web (Next.js)..."

    local cmd="kubectl apply -f ${MANIFEST_DIR}/web-deployment.yaml"
    if [[ "$DRY_RUN" == "--dry-run" ]]; then
        cmd="$cmd --dry-run=client"
    fi

    eval "$cmd"
    log_success "Web deployment applied"
}

wait_for_rollout() {
    if [[ "$DRY_RUN" == "--dry-run" ]]; then
        log_info "[DRY-RUN] Would wait for rollouts to complete"
        return
    fi

    log_info "Waiting for API rollout..."
    kubectl rollout status deployment/dhanam-api -n "$NAMESPACE" --timeout=300s

    log_info "Waiting for Web rollout..."
    kubectl rollout status deployment/dhanam-web -n "$NAMESPACE" --timeout=300s

    log_success "All rollouts completed"
}

verify_deployment() {
    log_info "Verifying deployment..."

    echo ""
    echo "=== Pod Status ==="
    kubectl get pods -n "$NAMESPACE" -o wide

    echo ""
    echo "=== Service Status ==="
    kubectl get svc -n "$NAMESPACE"

    echo ""
    echo "=== HPA Status ==="
    kubectl get hpa -n "$NAMESPACE"

    log_success "Deployment verification complete"
}

print_summary() {
    echo ""
    echo "============================================================================="
    echo -e "${GREEN}DEPLOYMENT SUMMARY${NC}"
    echo "============================================================================="
    echo ""
    echo "Namespace:     $NAMESPACE"
    echo "API Service:   dhanam-api.dhanam.svc.cluster.local:80"
    echo "Web Service:   dhanam-web.dhanam.svc.cluster.local:80"
    echo ""
    echo "External URLs (after DNS propagation):"
    echo "  - Web Dashboard: https://app.dhan.am"
    echo "  - API Endpoint:  https://api.dhan.am"
    echo ""
    echo "OAuth Client:"
    echo "  - Client ID:     jnc_uE2zp9ume_Fd6jMl1elL6wqjiECM711t"
    echo "  - Issuer:        https://auth.madfam.io"
    echo ""
    echo "Cloudflare Nameservers (configure in Porkbun):"
    echo "  - chin.ns.cloudflare.com"
    echo "  - woz.ns.cloudflare.com"
    echo ""
    echo "Health Check Commands:"
    echo "  kubectl logs -n dhanam -l app=dhanam-api --tail=50"
    echo "  kubectl logs -n dhanam -l app=dhanam-web --tail=50"
    echo ""
    echo "============================================================================="
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    echo ""
    echo "============================================================================="
    echo -e "${BLUE}DHANAM DEPLOYMENT - Operation LIFTOFF${NC}"
    echo "============================================================================="
    echo ""

    if [[ "$DRY_RUN" == "--dry-run" ]]; then
        log_warning "Running in DRY-RUN mode - no changes will be applied"
        echo ""
    fi

    check_prerequisites
    deploy_namespace
    check_secrets
    deploy_api
    deploy_web
    wait_for_rollout
    verify_deployment
    print_summary

    log_success "Deployment complete!"
}

main "$@"
