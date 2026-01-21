#!/usr/bin/env bash
# =============================================================================
# Enclii Deployment Script - Dhanam Web
# =============================================================================
# This script deploys the latest Dhanam web image to the Enclii K8s cluster.
# Designed for both manual execution and CI/CD integration.
#
# Prerequisites:
#   - kubectl configured for the Enclii/foundry cluster
#   - Access to ghcr.io/madfam-org container registry
#   - GHCR credentials secret in dhanam namespace
#
# Usage:
#   ./scripts/enclii-deploy.sh [options]
#
# Options:
#   --image TAG     Deploy specific image tag (default: latest)
#   --dry-run       Show what would be done without making changes
#   --rollback      Rollback to previous deployment
#   --status        Show current deployment status
#   --help          Show this help message
#
# Examples:
#   ./scripts/enclii-deploy.sh                    # Deploy latest
#   ./scripts/enclii-deploy.sh --image 99b1f69   # Deploy specific tag
#   ./scripts/enclii-deploy.sh --rollback        # Rollback deployment
# =============================================================================

set -euo pipefail

# Configuration
NAMESPACE="dhanam"
DEPLOYMENT="dhanam-web"
CONTAINER="web"
REGISTRY="ghcr.io/madfam-org/dhanam-web"
DEFAULT_TAG="latest"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Parse arguments
IMAGE_TAG="$DEFAULT_TAG"
DRY_RUN=false
ROLLBACK=false
STATUS_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --image)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --status)
            STATUS_ONLY=true
            shift
            ;;
        --help)
            head -35 "$0" | tail -30
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install kubectl."
        exit 1
    fi

    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster. Check your kubeconfig."
        log_info "Expected cluster: Enclii/foundry-core"
        exit 1
    fi

    # Verify namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_error "Namespace '$NAMESPACE' not found."
        log_info "Run: kubectl apply -f infra/k8s/production/namespace.yaml"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Show current deployment status
show_status() {
    echo ""
    echo "============================================================================="
    echo -e "${BLUE}DHANAM WEB - DEPLOYMENT STATUS${NC}"
    echo "============================================================================="
    echo ""

    log_info "Current Deployment:"
    kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o wide 2>/dev/null || log_warning "Deployment not found"

    echo ""
    log_info "Pods:"
    kubectl get pods -n "$NAMESPACE" -l app="$DEPLOYMENT" -o wide

    echo ""
    log_info "Current Image:"
    kubectl get deployment "$DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "N/A"
    echo ""

    echo ""
    log_info "Recent Events:"
    kubectl get events -n "$NAMESPACE" --field-selector involvedObject.name="$DEPLOYMENT" --sort-by='.lastTimestamp' 2>/dev/null | tail -5 || true

    echo ""
    log_info "HPA Status:"
    kubectl get hpa "$DEPLOYMENT" -n "$NAMESPACE" 2>/dev/null || log_warning "HPA not found"

    echo ""
    echo "============================================================================="
}

# Rollback deployment
rollback_deployment() {
    log_info "Rolling back deployment..."

    if $DRY_RUN; then
        log_warning "[DRY-RUN] Would run: kubectl rollout undo deployment/$DEPLOYMENT -n $NAMESPACE"
        return
    fi

    kubectl rollout undo deployment/"$DEPLOYMENT" -n "$NAMESPACE"
    log_info "Waiting for rollback to complete..."
    kubectl rollout status deployment/"$DEPLOYMENT" -n "$NAMESPACE" --timeout=300s
    log_success "Rollback completed"
}

# Deploy new image
deploy() {
    local image="$REGISTRY:$IMAGE_TAG"

    echo ""
    echo "============================================================================="
    echo -e "${BLUE}DHANAM WEB - ENCLII DEPLOYMENT${NC}"
    echo "============================================================================="
    echo ""
    echo "Namespace:  $NAMESPACE"
    echo "Deployment: $DEPLOYMENT"
    echo "Image:      $image"
    echo ""

    if $DRY_RUN; then
        log_warning "[DRY-RUN] Would deploy image: $image"
        log_warning "[DRY-RUN] Would run: kubectl set image deployment/$DEPLOYMENT $CONTAINER=$image -n $NAMESPACE"
        return
    fi

    # Update image
    log_info "Updating deployment image..."
    kubectl set image deployment/"$DEPLOYMENT" "$CONTAINER=$image" -n "$NAMESPACE"

    # Wait for rollout
    log_info "Waiting for rollout to complete..."
    if ! kubectl rollout status deployment/"$DEPLOYMENT" -n "$NAMESPACE" --timeout=300s; then
        log_error "Rollout failed!"
        log_info "Checking pod status..."
        kubectl get pods -n "$NAMESPACE" -l app="$DEPLOYMENT"
        kubectl describe pods -n "$NAMESPACE" -l app="$DEPLOYMENT" | tail -50
        exit 1
    fi

    log_success "Deployment completed successfully!"

    # Verify health
    log_info "Verifying deployment health..."
    sleep 5
    kubectl get pods -n "$NAMESPACE" -l app="$DEPLOYMENT" -o wide

    echo ""
    echo "============================================================================="
    echo -e "${GREEN}DEPLOYMENT SUMMARY${NC}"
    echo "============================================================================="
    echo ""
    echo "Image:    $image"
    echo "Status:   Healthy"
    echo "URL:      https://app.dhan.am"
    echo ""
    echo "Verify with:"
    echo "  curl -s https://app.dhan.am/api/health | jq"
    echo ""
    echo "============================================================================="
}

# Ensure GHCR credentials are set up
ensure_ghcr_credentials() {
    log_info "Checking GHCR credentials..."

    if kubectl get secret ghcr-credentials -n "$NAMESPACE" &> /dev/null; then
        log_success "GHCR credentials secret exists"
    else
        log_warning "GHCR credentials secret not found"
        log_info "Create it with:"
        echo ""
        echo "  kubectl create secret docker-registry ghcr-credentials \\"
        echo "    --namespace=$NAMESPACE \\"
        echo "    --docker-server=ghcr.io \\"
        echo "    --docker-username=<github-username> \\"
        echo "    --docker-password=<ghcr-token> \\"
        echo "    --docker-email=ci@dhanam.dev"
        echo ""

        if ! $DRY_RUN && ! $STATUS_ONLY; then
            read -p "Continue without GHCR credentials? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    fi
}

# Main
main() {
    check_prerequisites

    if $STATUS_ONLY; then
        show_status
        exit 0
    fi

    ensure_ghcr_credentials

    if $ROLLBACK; then
        rollback_deployment
    else
        deploy
    fi

    show_status
}

main "$@"
