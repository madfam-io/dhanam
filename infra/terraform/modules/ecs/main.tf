resource "aws_ecs_cluster" "main" {
  name = "${var.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = var.enable_container_insights ? "enabled" : "disabled"
  }

  tags = var.common_tags
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.name_prefix}-ecs-task-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional policies for secrets and logging
resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name = "${var.name_prefix}-ecs-task-execution-secrets"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "kms:Decrypt"
        ]
        Resource = concat(
          var.secrets_arns,
          [var.kms_key_arn]
        )
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      }
    ]
  })
}

# Task Role for API
resource "aws_iam_role" "api_task" {
  name = "${var.name_prefix}-api-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

# API Task Role Policies
resource "aws_iam_role_policy" "api_task_policy" {
  name = "${var.name_prefix}-api-task-policy"
  role = aws_iam_role.api_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${var.s3_bucket_arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = var.secrets_arns
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [var.kms_key_arn]
      }
    ]
  })
}

# API Task Definition
resource "aws_ecs_task_definition" "api" {
  family                   = "${var.name_prefix}-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.api_cpu
  memory                   = var.api_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.api_task.arn

  container_definitions = jsonencode([
    {
      name  = "api"
      image = "${var.api_ecr_repository_url}:${var.api_image_tag}"
      
      portMappings = [
        {
          containerPort = 4000
          protocol      = "tcp"
        }
      ]

      environment = concat(
        [
          {
            name  = "NODE_ENV"
            value = var.environment
          },
          {
            name  = "PORT"
            value = "4000"
          },
          {
            name  = "DATABASE_URL"
            value = "postgresql://postgres:${var.db_password}@${var.rds_endpoint}/dhanam"
          },
          {
            name  = "REDIS_URL"
            value = "redis://${var.redis_endpoint}:6379"
          }
        ],
        [for k, v in var.api_environment_variables : {
          name  = k
          value = v
        }]
      )

      secrets = [
        {
          name      = "JWT_SECRET"
          valueFrom = var.jwt_secret_arn
        },
        {
          name      = "ENCRYPTION_KEY"
          valueFrom = var.encryption_key_arn
        },
        {
          name      = "BELVO_SECRET_KEY_ID"
          valueFrom = "${var.belvo_credentials_arn}:id::"
        },
        {
          name      = "BELVO_SECRET_KEY_PASSWORD"
          valueFrom = "${var.belvo_credentials_arn}:password::"
        },
        {
          name      = "PLAID_CLIENT_ID"
          valueFrom = "${var.plaid_credentials_arn}:client_id::"
        },
        {
          name      = "PLAID_SECRET"
          valueFrom = "${var.plaid_credentials_arn}:secret::"
        },
        {
          name      = "BITSO_API_KEY"
          valueFrom = "${var.bitso_credentials_arn}:api_key::"
        },
        {
          name      = "BITSO_API_SECRET"
          valueFrom = "${var.bitso_credentials_arn}:api_secret::"
        }
      ]

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:4000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = var.api_log_group_name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "api"
        }
      }

      essential = true
    }
  ])

  tags = var.common_tags
}

# Web Task Definition
resource "aws_ecs_task_definition" "web" {
  family                   = "${var.name_prefix}-web"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.web_cpu
  memory                   = var.web_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name  = "web"
      image = "${var.web_ecr_repository_url}:${var.web_image_tag}"
      
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      environment = concat(
        [
          {
            name  = "NODE_ENV"
            value = var.environment
          },
          {
            name  = "NEXT_PUBLIC_API_URL"
            value = "http://${var.alb_dns_name}/api"
          }
        ],
        [for k, v in var.web_environment_variables : {
          name  = k
          value = v
        }]
      )

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000 || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = var.web_log_group_name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "web"
        }
      }

      essential = true
    }
  ])

  tags = var.common_tags
}

# API Service
resource "aws_ecs_service" "api" {
  name                               = "${var.name_prefix}-api"
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.api.arn
  desired_count                      = var.api_desired_count
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  launch_type                        = "FARGATE"
  platform_version                   = "LATEST"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.api_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.api_target_group_arn
    container_name   = "api"
    container_port   = 4000
  }

  service_registries {
    registry_arn = aws_service_discovery_service.api.arn
  }

  depends_on = [var.alb_listener_arn]

  tags = var.common_tags
}

# Web Service
resource "aws_ecs_service" "web" {
  name                               = "${var.name_prefix}-web"
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.web.arn
  desired_count                      = var.web_desired_count
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  launch_type                        = "FARGATE"
  platform_version                   = "LATEST"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.web_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.web_target_group_arn
    container_name   = "web"
    container_port   = 3000
  }

  service_registries {
    registry_arn = aws_service_discovery_service.web.arn
  }

  depends_on = [var.alb_listener_arn]

  tags = var.common_tags
}

# Service Discovery
resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "${var.name_prefix}.local"
  description = "Private DNS namespace for ${var.name_prefix}"
  vpc         = var.vpc_id

  tags = var.common_tags
}

resource "aws_service_discovery_service" "api" {
  name = "api"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "web" {
  name = "web"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}