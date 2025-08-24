resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.name_prefix}/api"
  retention_in_days = var.log_retention_days
  kms_key_id        = var.kms_key_arn

  tags = merge(
    var.common_tags,
    {
      Name = "${var.name_prefix}-api-logs"
    }
  )
}

resource "aws_cloudwatch_log_group" "web" {
  name              = "/ecs/${var.name_prefix}/web"
  retention_in_days = var.log_retention_days
  kms_key_id        = var.kms_key_arn

  tags = merge(
    var.common_tags,
    {
      Name = "${var.name_prefix}-web-logs"
    }
  )
}

resource "aws_cloudwatch_log_group" "redis" {
  name              = "/elasticache/${var.name_prefix}/redis"
  retention_in_days = var.log_retention_days
  kms_key_id        = var.kms_key_arn

  tags = merge(
    var.common_tags,
    {
      Name = "${var.name_prefix}-redis-logs"
    }
  )
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name              = "${var.name_prefix}-alerts"
  kms_master_key_id = var.kms_key_arn

  tags = merge(
    var.common_tags,
    {
      Name = "${var.name_prefix}-alerts"
    }
  )
}

resource "aws_sns_topic_subscription" "email_alerts" {
  for_each = toset(var.alert_email_addresses)

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = var.name_prefix

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", "${var.name_prefix}-api", "ClusterName", var.ecs_cluster_name],
            [".", "MemoryUtilization", ".", ".", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "API Service Metrics"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", "${var.name_prefix}-web", "ClusterName", var.ecs_cluster_name],
            [".", "MemoryUtilization", ".", ".", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Web Service Metrics"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.rds_instance_id],
            [".", "DatabaseConnections", ".", "."],
            [".", "FreeStorageSpace", ".", ".", { stat = "Average", yAxis = "right" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "RDS Metrics"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", "CacheClusterId", var.redis_cluster_id],
            [".", "DatabaseMemoryUsagePercentage", ".", "."],
            [".", "Evictions", ".", ".", { stat = "Sum", yAxis = "right" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Redis Metrics"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.alb_suffix],
            [".", "RequestCount", ".", ".", { stat = "Sum", yAxis = "right" }],
            [".", "UnHealthyHostCount", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ALB Metrics"
        }
      },
      {
        type   = "log"
        x      = 12
        y      = 12
        width  = 12
        height = 6

        properties = {
          query   = "SOURCE '${aws_cloudwatch_log_group.api.name}' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20"
          region  = var.aws_region
          title   = "Recent API Errors"
        }
      }
    ]
  })
}

# Auto Scaling for ECS Services
resource "aws_appautoscaling_target" "api" {
  max_capacity       = var.api_max_count
  min_capacity       = var.api_min_count
  resource_id        = "service/${var.ecs_cluster_name}/${var.api_service_name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "${var.name_prefix}-api-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.cpu_threshold_high
    scale_in_cooldown  = var.scale_down_cooldown
    scale_out_cooldown = var.scale_up_cooldown
  }
}

resource "aws_appautoscaling_policy" "api_memory" {
  name               = "${var.name_prefix}-api-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80
    scale_in_cooldown  = var.scale_down_cooldown
    scale_out_cooldown = var.scale_up_cooldown
  }
}

# Budget Alert
resource "aws_budgets_budget" "monthly" {
  count = var.enable_budget_alert ? 1 : 0

  name         = "${var.name_prefix}-monthly-budget"
  budget_type  = "COST"
  limit_amount = var.monthly_budget_limit
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_email_addresses = var.alert_email_addresses
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_email_addresses = var.alert_email_addresses
  }
}