output "replication_group_id" {
  description = "ID of the replication group"
  value       = aws_elasticache_replication_group.main.id
}

output "endpoint" {
  description = "Primary endpoint for the replication group"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "reader_endpoint" {
  description = "Reader endpoint for the replication group"
  value       = var.num_cache_nodes > 1 ? aws_elasticache_replication_group.main.reader_endpoint_address : null
}

output "port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.main.port
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.redis.id
}