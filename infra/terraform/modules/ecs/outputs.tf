output "cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "api_service_id" {
  description = "ID of the API service"
  value       = aws_ecs_service.api.id
}

output "api_service_name" {
  description = "Name of the API service"
  value       = aws_ecs_service.api.name
}

output "web_service_id" {
  description = "ID of the web service"
  value       = aws_ecs_service.web.id
}

output "web_service_name" {
  description = "Name of the web service"
  value       = aws_ecs_service.web.name
}

output "api_task_definition_arn" {
  description = "ARN of the API task definition"
  value       = aws_ecs_task_definition.api.arn
}

output "web_task_definition_arn" {
  description = "ARN of the web task definition"
  value       = aws_ecs_task_definition.web.arn
}

output "api_task_role_arn" {
  description = "ARN of the API task role"
  value       = aws_iam_role.api_task.arn
}

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "service_discovery_namespace_id" {
  description = "ID of the service discovery namespace"
  value       = aws_service_discovery_private_dns_namespace.main.id
}

output "api_service_discovery_arn" {
  description = "ARN of the API service discovery service"
  value       = aws_service_discovery_service.api.arn
}

output "web_service_discovery_arn" {
  description = "ARN of the web service discovery service"
  value       = aws_service_discovery_service.web.arn
}