terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  backend "s3" {
    bucket         = "dhanam-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "dhanam-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "dhanam"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Random suffix for unique resource names
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# Locals
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    Region      = var.aws_region
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  name_prefix        = local.name_prefix
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  enable_nat_gateway = var.enable_nat_gateway
  single_nat_gateway = var.single_nat_gateway
  aws_region         = var.aws_region
  common_tags        = local.common_tags
}

# Security Module
module "security" {
  source = "./modules/security"

  name_prefix       = local.name_prefix
  common_tags       = local.common_tags
  random_suffix     = random_string.suffix.result
  db_password       = var.db_password
  jwt_secret        = var.jwt_secret
  encryption_key    = var.encryption_key
  belvo_credentials = {
    id       = var.api_environment_variables["BELVO_SECRET_KEY_ID"]
    password = var.api_environment_variables["BELVO_SECRET_KEY_PASSWORD"]
  }
  plaid_credentials = {
    client_id = var.api_environment_variables["PLAID_CLIENT_ID"]
    secret    = var.api_environment_variables["PLAID_SECRET"]
  }
  bitso_credentials = {
    api_key    = var.api_environment_variables["BITSO_API_KEY"]
    api_secret = var.api_environment_variables["BITSO_API_SECRET"]
  }
  enable_waf = true
  alb_arn    = module.alb.arn
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  name_prefix             = local.name_prefix
  common_tags             = local.common_tags
  vpc_id                  = module.vpc.vpc_id
  database_subnet_ids     = module.vpc.database_subnet_ids
  allowed_security_groups = [module.ecs_security.api_security_group_id]
  instance_class          = var.db_instance_class
  allocated_storage       = var.db_allocated_storage
  max_allocated_storage   = var.db_max_allocated_storage
  db_password             = var.db_password
  backup_retention_period = var.db_backup_retention_period
  multi_az                = var.db_multi_az
  deletion_protection     = var.db_deletion_protection
  kms_key_arn             = module.security.kms_key_arn
  sns_alert_topic_arn     = module.monitoring.sns_alert_topic_arn
}

# Redis Module
module "redis" {
  source = "./modules/redis"

  name_prefix              = local.name_prefix
  common_tags              = local.common_tags
  vpc_id                   = module.vpc.vpc_id
  private_subnet_ids       = module.vpc.private_subnet_ids
  allowed_security_groups  = [module.ecs_security.api_security_group_id]
  node_type                = var.redis_node_type
  num_cache_nodes          = var.redis_num_cache_nodes
  snapshot_retention_limit = var.redis_snapshot_retention_limit
  sns_alert_topic_arn      = module.monitoring.sns_alert_topic_arn
  log_group_name           = module.monitoring.redis_log_group_name
}

# ECR Module
module "ecr" {
  source = "./modules/ecr"

  name_prefix          = local.name_prefix
  common_tags          = local.common_tags
  image_tag_mutability = var.ecr_image_tag_mutability
  scan_on_push         = var.ecr_scan_on_push
  kms_key_arn          = module.security.kms_key_arn
}

# ALB Module
module "alb" {
  source = "./modules/alb"

  name_prefix                = local.name_prefix
  common_tags                = local.common_tags
  vpc_id                     = module.vpc.vpc_id
  public_subnet_ids          = module.vpc.public_subnet_ids
  allowed_ips                = var.allowed_ips
  certificate_arn            = var.certificate_arn
  enable_deletion_protection = var.environment == "prod"
  enable_access_logs         = var.enable_monitoring
  logs_bucket_name           = module.security.app_data_bucket_id
  sns_alert_topic_arn        = module.monitoring.sns_alert_topic_arn
}

# ECS Security Groups
module "ecs_security" {
  source = "./modules/ecs-security"

  name_prefix               = local.name_prefix
  common_tags               = local.common_tags
  vpc_id                    = module.vpc.vpc_id
  vpc_cidr                  = module.vpc.vpc_cidr
  alb_security_group_id     = module.alb.security_group_id
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"

  name_prefix           = local.name_prefix
  environment           = var.environment
  aws_region            = var.aws_region
  common_tags           = local.common_tags
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  
  # Container configuration
  api_cpu               = var.api_cpu
  api_memory            = var.api_memory
  api_desired_count     = var.api_desired_count
  web_cpu               = var.web_cpu
  web_memory            = var.web_memory
  web_desired_count     = var.web_desired_count
  
  # ECR repositories
  api_ecr_repository_url = module.ecr.api_repository_url
  web_ecr_repository_url = module.ecr.web_repository_url
  
  # Load balancer
  alb_dns_name          = module.alb.dns_name
  alb_listener_arn      = module.alb.listener_arn
  api_target_group_arn  = module.alb.api_target_group_arn
  web_target_group_arn  = module.alb.web_target_group_arn
  
  # Security groups
  api_security_group_id = module.ecs_security.api_security_group_id
  web_security_group_id = module.ecs_security.web_security_group_id
  
  # Logging
  api_log_group_name    = module.monitoring.api_log_group_name
  web_log_group_name    = module.monitoring.web_log_group_name
  
  # Database and cache
  rds_endpoint          = module.rds.endpoint
  redis_endpoint        = module.redis.endpoint
  db_password           = var.db_password
  
  # Secrets
  jwt_secret_arn        = module.security.jwt_secret_arn
  encryption_key_arn    = module.security.encryption_key_secret_arn
  belvo_credentials_arn = module.security.belvo_credentials_secret_arn
  plaid_credentials_arn = module.security.plaid_credentials_secret_arn
  bitso_credentials_arn = module.security.bitso_credentials_secret_arn
  secrets_arns = [
    module.security.db_password_secret_arn,
    module.security.jwt_secret_arn,
    module.security.encryption_key_secret_arn,
    module.security.belvo_credentials_secret_arn,
    module.security.plaid_credentials_secret_arn,
    module.security.bitso_credentials_secret_arn
  ]
  
  # Encryption and storage
  kms_key_arn           = module.security.kms_key_arn
  s3_bucket_arn         = module.security.app_data_bucket_arn
  
  # Environment variables
  api_environment_variables = var.api_environment_variables
  web_environment_variables = var.web_environment_variables
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"

  name_prefix           = local.name_prefix
  common_tags           = local.common_tags
  aws_region            = var.aws_region
  log_retention_days    = var.log_retention_days
  kms_key_arn           = module.security.kms_key_arn
  alert_email_addresses = var.api_environment_variables["ALERT_EMAIL_ADDRESSES"] != "" ? split(",", var.api_environment_variables["ALERT_EMAIL_ADDRESSES"]) : []
  
  # ECS details
  ecs_cluster_name      = module.ecs.cluster_name
  api_service_name      = module.ecs.api_service_name
  
  # Metrics sources
  rds_instance_id       = module.rds.instance_id
  redis_cluster_id      = module.redis.replication_group_id
  alb_suffix            = split("/", module.alb.arn)[2]
  
  # Auto scaling
  api_min_count         = var.api_min_count
  api_max_count         = var.api_max_count
  cpu_threshold_high    = var.cpu_threshold_high
  scale_up_cooldown     = var.scale_up_cooldown
  scale_down_cooldown   = var.scale_down_cooldown
  
  # Budget
  enable_budget_alert   = true
  monthly_budget_limit  = 500
}