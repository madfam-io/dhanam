# Dhanam Monitoring Stack

Kubernetes manifests for Prometheus, Alertmanager, and Grafana on the Dhanam cluster.

## Contents

| File | Purpose |
|------|---------|
| `namespace.yaml` | `dhanam-monitoring` namespace |
| `service-monitors.yaml` | ServiceMonitor CRDs — scrapes `/metrics` on port 4300 |
| `prometheus-rules.yaml` | PrometheusRule CRD — alert rules for API, DB, Redis, queues |
| `alertmanager-config.yaml` | Alertmanager K8s Secret with routing and receiver config |
| `alertmanager-secrets-template.yaml` | Documents required secrets and how to obtain them |
| `grafana-dashboards-configmap.yaml` | Auto-provisioned Grafana dashboards (request rate, error rate, p95 latency, etc.) |
| `kustomization.yaml` | Kustomize entrypoint for the monitoring overlay |

## Alert Routing

| Severity | Channel | Repeat Interval | Examples |
|----------|---------|-----------------|----------|
| critical | `#dhanam-alerts-critical` | 1 hour | Pod crashes, DB down, auth failure spikes |
| warning | `#dhanam-alerts` | 12 hours | High p95 latency, queue depth, memory pressure |

Critical alerts inhibit matching warning alerts (same alertname + namespace).

## Slack Webhook Setup

1. Go to https://api.slack.com/apps and create (or select) an app.
2. Enable **Incoming Webhooks** under Features.
3. Click **Add New Webhook to Workspace**, select `#dhanam-alerts-critical`, and copy the URL.
4. Repeat for `#dhanam-alerts`.
5. Each URL looks like: `https://hooks.slack.com/services/T.../B.../xxx`

## Deployment

1. Open `alertmanager-config.yaml`.
2. Replace all `REPLACE_WITH_*` markers with real webhook URLs:
   - `REPLACE_WITH_SLACK_CRITICAL_WEBHOOK_URL` -- critical channel webhook
   - `REPLACE_WITH_SLACK_WARNING_WEBHOOK_URL` -- warning channel webhook
   - (Optional) Uncomment PagerDuty block, replace `REPLACE_WITH_PAGERDUTY_SERVICE_KEY`
3. Apply the manifests:

```bash
kubectl apply -k infra/k8s/monitoring/
```

Or apply individually:

```bash
kubectl apply -f infra/k8s/monitoring/alertmanager-config.yaml
```
