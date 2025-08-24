output "api_repository_url" {
  description = "URL of the API ECR repository"
  value       = aws_ecr_repository.api.repository_url
}

output "api_repository_arn" {
  description = "ARN of the API ECR repository"
  value       = aws_ecr_repository.api.arn
}

output "api_repository_name" {
  description = "Name of the API ECR repository"
  value       = aws_ecr_repository.api.name
}

output "web_repository_url" {
  description = "URL of the web ECR repository"
  value       = aws_ecr_repository.web.repository_url
}

output "web_repository_arn" {
  description = "ARN of the web ECR repository"
  value       = aws_ecr_repository.web.arn
}

output "web_repository_name" {
  description = "Name of the web ECR repository"
  value       = aws_ecr_repository.web.name
}