resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.name_prefix}-redis-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = merge(
    var.common_tags,
    {
      Name = "${var.name_prefix}-redis-subnet-group"
    }
  )
}

resource "aws_security_group" "redis" {
  name_prefix = "${var.name_prefix}-redis-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.name_prefix}-redis-sg"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_elasticache_parameter_group" "main" {
  name   = "${var.name_prefix}-redis-params"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  tags = var.common_tags
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "${var.name_prefix}-redis"
  description                = "Redis cluster for ${var.name_prefix}"
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = var.node_type
  num_cache_clusters         = var.num_cache_nodes
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = [aws_security_group.redis.id]
  parameter_group_name       = aws_elasticache_parameter_group.main.name
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token_enabled         = false # Set to true if you want password auth
  
  automatic_failover_enabled = var.num_cache_nodes > 1
  multi_az_enabled          = var.num_cache_nodes > 1
  
  snapshot_retention_limit   = var.snapshot_retention_limit
  snapshot_window           = "03:00-05:00"
  maintenance_window        = "sun:05:00-sun:07:00"
  
  notification_topic_arn    = var.sns_alert_topic_arn
  
  log_delivery_configuration {
    destination      = var.log_group_name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "engine-log"
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.name_prefix}-redis"
    }
  )

  lifecycle {
    ignore_changes = [engine_version]
  }
}

# CloudWatch Alarms for Redis
resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  alarm_name          = "${var.name_prefix}-redis-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors Redis CPU utilization"
  alarm_actions       = [var.sns_alert_topic_arn]

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.main.id
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  alarm_name          = "${var.name_prefix}-redis-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors Redis memory usage"
  alarm_actions       = [var.sns_alert_topic_arn]

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.main.id
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "redis_evictions" {
  alarm_name          = "${var.name_prefix}-redis-evictions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Evictions"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "100"
  alarm_description   = "This metric monitors Redis evictions"
  alarm_actions       = [var.sns_alert_topic_arn]

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.main.id
  }

  tags = var.common_tags
}