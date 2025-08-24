variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "dhanam"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "availability_zones" {
  description = "Number of availability zones to use"
  type        = number
  default     = 2
}

# Networking
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use a single NAT Gateway for all private subnets"
  type        = bool
  default     = false
}

# ECS Configuration
variable "api_cpu" {
  description = "CPU units for API container (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 512
}

variable "api_memory" {
  description = "Memory for API container in MB"
  type        = number
  default     = 1024
}

variable "api_desired_count" {
  description = "Desired number of API tasks"
  type        = number
  default     = 2
}

variable "api_min_count" {
  description = "Minimum number of API tasks for auto-scaling"
  type        = number
  default     = 2
}

variable "api_max_count" {
  description = "Maximum number of API tasks for auto-scaling"
  type        = number
  default     = 10
}

variable "web_cpu" {
  description = "CPU units for web container"
  type        = number
  default     = 256
}

variable "web_memory" {
  description = "Memory for web container in MB"
  type        = number
  default     = 512
}

variable "web_desired_count" {
  description = "Desired number of web tasks"
  type        = number
  default     = 2
}

# Database Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.small"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS autoscaling in GB"
  type        = number
  default     = 100
}

variable "db_deletion_protection" {
  description = "Enable deletion protection for RDS"
  type        = bool
  default     = true
}

variable "db_backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 30
}

variable "db_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
  default     = true
}

# Redis Configuration
variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1
}

variable "redis_snapshot_retention_limit" {
  description = "Number of days to retain Redis snapshots"
  type        = number
  default     = 7
}

# Security
variable "allowed_ips" {
  description = "List of allowed IP addresses for ALB access"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "certificate_arn" {
  description = "ARN of ACM certificate for HTTPS"
  type        = string
  default     = ""
}

# Monitoring
variable "enable_monitoring" {
  description = "Enable enhanced monitoring and alerts"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

# Application Configuration
variable "api_environment_variables" {
  description = "Environment variables for API container"
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "web_environment_variables" {
  description = "Environment variables for web container"
  type        = map(string)
  default     = {}
}

# Secrets
variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "encryption_key" {
  description = "Encryption key for sensitive data"
  type        = string
  sensitive   = true
}

# Container Registry
variable "ecr_image_tag_mutability" {
  description = "ECR image tag mutability"
  type        = string
  default     = "MUTABLE"
}

variable "ecr_scan_on_push" {
  description = "Enable image scanning on push to ECR"
  type        = bool
  default     = true
}

# Auto Scaling
variable "scale_up_cooldown" {
  description = "Cooldown period in seconds before allowing another scale up"
  type        = number
  default     = 60
}

variable "scale_down_cooldown" {
  description = "Cooldown period in seconds before allowing another scale down"
  type        = number
  default     = 300
}

variable "cpu_threshold_high" {
  description = "CPU utilization threshold for scaling up"
  type        = number
  default     = 70
}

variable "cpu_threshold_low" {
  description = "CPU utilization threshold for scaling down"
  type        = number
  default     = 20
}