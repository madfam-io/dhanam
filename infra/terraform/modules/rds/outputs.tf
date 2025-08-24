output "instance_id" {
  description = "ID of the RDS instance"
  value       = aws_db_instance.main.id
}

output "endpoint" {
  description = "Connection endpoint"
  value       = aws_db_instance.main.endpoint
}

output "address" {
  description = "Address of the RDS instance"
  value       = aws_db_instance.main.address
}

output "port" {
  description = "Port of the RDS instance"
  value       = aws_db_instance.main.port
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.rds.id
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "username" {
  description = "Master username"
  value       = aws_db_instance.main.username
}