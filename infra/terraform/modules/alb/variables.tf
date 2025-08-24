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

variable "public_subnet_ids" {
  description = "Public subnet IDs"
  type        = list(string)
}

variable "allowed_ips" {
  description = "Allowed IP addresses"
  type        = list(string)
}

variable "certificate_arn" {
  description = "ACM certificate ARN"
  type        = string
  default     = ""
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

variable "enable_access_logs" {
  description = "Enable access logs"
  type        = bool
  default     = false
}

variable "logs_bucket_name" {
  description = "S3 bucket name for logs"
  type        = string
  default     = ""
}

variable "sns_alert_topic_arn" {
  description = "SNS topic ARN for alerts"
  type        = string
}