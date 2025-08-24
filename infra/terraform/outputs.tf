output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.dns_name
}

output "api_service_url" {
  description = "URL of the API service"
  value       = "http://${module.alb.dns_name}/api"
}

output "web_service_url" {
  description = "URL of the web service"
  value       = "http://${module.alb.dns_name}"
}

output "ecr_api_repository_url" {
  description = "URL of the API ECR repository"
  value       = module.ecr.api_repository_url
}

output "ecr_web_repository_url" {
  description = "URL of the web ECR repository"
  value       = module.ecr.web_repository_url
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = module.redis.endpoint
  sensitive   = true
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "api_task_definition_arn" {
  description = "ARN of the API task definition"
  value       = module.ecs.api_task_definition_arn
}

output "web_task_definition_arn" {
  description = "ARN of the web task definition"
  value       = module.ecs.web_task_definition_arn
}

output "cloudwatch_log_group_api" {
  description = "CloudWatch log group for API"
  value       = module.monitoring.api_log_group_name
}

output "cloudwatch_log_group_web" {
  description = "CloudWatch log group for web"
  value       = module.monitoring.web_log_group_name
}

output "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  value       = module.security.kms_key_arn
  sensitive   = true
}

output "secrets_manager_arns" {
  description = "ARNs of secrets stored in AWS Secrets Manager"
  value = {
    db_password     = module.security.db_password_secret_arn
    jwt_secret      = module.security.jwt_secret_arn
    encryption_key  = module.security.encryption_key_secret_arn
    belvo_creds     = module.security.belvo_credentials_secret_arn
    plaid_creds     = module.security.plaid_credentials_secret_arn
    bitso_creds     = module.security.bitso_credentials_secret_arn
  }
  sensitive = true
}

output "sns_alert_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = module.monitoring.sns_alert_topic_arn
}

output "deployment_instructions" {
  description = "Instructions for deploying applications"
  value = <<-EOT
    
    ========================================
    Dhanam Infrastructure Deployment Complete
    ========================================
    
    1. Build and push Docker images:
       - API: ${module.ecr.api_repository_url}:latest
       - Web: ${module.ecr.web_repository_url}:latest
    
    2. Access applications:
       - API: ${var.certificate_arn != "" ? "https" : "http"}://${module.alb.dns_name}/api
       - Web: ${var.certificate_arn != "" ? "https" : "http"}://${module.alb.dns_name}
    
    3. Monitor logs:
       - API: ${module.monitoring.api_log_group_name}
       - Web: ${module.monitoring.web_log_group_name}
    
    4. Database connection:
       - Host: ${module.rds.endpoint}
       - Port: 5432
       - Database: dhanam
    
    5. Redis connection:
       - Endpoint: ${module.redis.endpoint}
       - Port: 6379
    
    ========================================
  EOT
}