variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags for resources"
  type        = map(string)
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "alert_email_addresses" {
  description = "Email addresses for alerts"
  type        = list(string)
  default     = []
}

variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "api_service_name" {
  description = "API service name"
  type        = string
}

variable "rds_instance_id" {
  description = "RDS instance ID"
  type        = string
}

variable "redis_cluster_id" {
  description = "Redis cluster ID"
  type        = string
}

variable "alb_suffix" {
  description = "ALB suffix for metrics"
  type        = string
}

variable "api_min_count" {
  description = "Minimum API task count"
  type        = number
}

variable "api_max_count" {
  description = "Maximum API task count"
  type        = number
}

variable "cpu_threshold_high" {
  description = "CPU threshold for scaling up"
  type        = number
}

variable "scale_up_cooldown" {
  description = "Scale up cooldown in seconds"
  type        = number
}

variable "scale_down_cooldown" {
  description = "Scale down cooldown in seconds"
  type        = number
}

variable "enable_budget_alert" {
  description = "Enable budget alerts"
  type        = bool
  default     = true
}

variable "monthly_budget_limit" {
  description = "Monthly budget limit in USD"
  type        = number
  default     = 500
}