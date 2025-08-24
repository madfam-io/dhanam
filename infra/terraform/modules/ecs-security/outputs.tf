output "api_security_group_id" {
  description = "Security group ID for API tasks"
  value       = aws_security_group.api.id
}

output "web_security_group_id" {
  description = "Security group ID for web tasks"
  value       = aws_security_group.web.id
}