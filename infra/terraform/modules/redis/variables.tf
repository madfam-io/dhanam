variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags for resources"
  type        = map(string)
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "allowed_security_groups" {
  description = "Security groups allowed to connect to Redis"
  type        = list(string)
}

variable "node_type" {
  description = "ElastiCache node type"
  type        = string
}

variable "num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
}

variable "snapshot_retention_limit" {
  description = "Number of days to retain snapshots"
  type        = number
}

variable "sns_alert_topic_arn" {
  description = "SNS topic ARN for alerts"
  type        = string
}

variable "log_group_name" {
  description = "CloudWatch log group name for Redis logs"
  type        = string
}