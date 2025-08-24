variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
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

variable "api_cpu" {
  description = "CPU units for API container"
  type        = number
}

variable "api_memory" {
  description = "Memory for API container"
  type        = number
}

variable "api_desired_count" {
  description = "Desired count for API service"
  type        = number
}

variable "web_cpu" {
  description = "CPU units for web container"
  type        = number
}

variable "web_memory" {
  description = "Memory for web container"
  type        = number
}

variable "web_desired_count" {
  description = "Desired count for web service"
  type        = number
}

variable "api_ecr_repository_url" {
  description = "ECR repository URL for API"
  type        = string
}

variable "web_ecr_repository_url" {
  description = "ECR repository URL for web"
  type        = string
}

variable "api_image_tag" {
  description = "Docker image tag for API"
  type        = string
  default     = "latest"
}

variable "web_image_tag" {
  description = "Docker image tag for web"
  type        = string
  default     = "latest"
}

variable "alb_dns_name" {
  description = "ALB DNS name"
  type        = string
}

variable "alb_listener_arn" {
  description = "ALB listener ARN"
  type        = string
}

variable "api_target_group_arn" {
  description = "API target group ARN"
  type        = string
}

variable "web_target_group_arn" {
  description = "Web target group ARN"
  type        = string
}

variable "api_security_group_id" {
  description = "Security group ID for API"
  type        = string
}

variable "web_security_group_id" {
  description = "Security group ID for web"
  type        = string
}

variable "api_log_group_name" {
  description = "CloudWatch log group name for API"
  type        = string
}

variable "web_log_group_name" {
  description = "CloudWatch log group name for web"
  type        = string
}

variable "rds_endpoint" {
  description = "RDS endpoint"
  type        = string
}

variable "redis_endpoint" {
  description = "Redis endpoint"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "jwt_secret_arn" {
  description = "JWT secret ARN"
  type        = string
}

variable "encryption_key_arn" {
  description = "Encryption key ARN"
  type        = string
}

variable "belvo_credentials_arn" {
  description = "Belvo credentials ARN"
  type        = string
}

variable "plaid_credentials_arn" {
  description = "Plaid credentials ARN"
  type        = string
}

variable "bitso_credentials_arn" {
  description = "Bitso credentials ARN"
  type        = string
}

variable "secrets_arns" {
  description = "List of all secrets ARNs"
  type        = list(string)
}

variable "kms_key_arn" {
  description = "KMS key ARN"
  type        = string
}

variable "s3_bucket_arn" {
  description = "S3 bucket ARN for application data"
  type        = string
}

variable "api_environment_variables" {
  description = "Environment variables for API"
  type        = map(string)
  default     = {}
}

variable "web_environment_variables" {
  description = "Environment variables for web"
  type        = map(string)
  default     = {}
}

variable "enable_container_insights" {
  description = "Enable Container Insights"
  type        = bool
  default     = true
}