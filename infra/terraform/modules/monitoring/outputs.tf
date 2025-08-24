output "api_log_group_name" {
  description = "API CloudWatch log group name"
  value       = aws_cloudwatch_log_group.api.name
}

output "web_log_group_name" {
  description = "Web CloudWatch log group name"
  value       = aws_cloudwatch_log_group.web.name
}

output "redis_log_group_name" {
  description = "Redis CloudWatch log group name"
  value       = aws_cloudwatch_log_group.redis.name
}

output "sns_alert_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "api_autoscaling_target_id" {
  description = "API autoscaling target resource ID"
  value       = aws_appautoscaling_target.api.resource_id
}