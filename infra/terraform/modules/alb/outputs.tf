output "id" {
  description = "ID of the load balancer"
  value       = aws_lb.main.id
}

output "arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.alb.id
}

output "listener_arn" {
  description = "ARN of the main listener"
  value       = var.certificate_arn != "" ? aws_lb_listener.https[0].arn : aws_lb_listener.http.arn
}

output "http_listener_arn" {
  description = "ARN of the HTTP listener"
  value       = aws_lb_listener.http.arn
}

output "https_listener_arn" {
  description = "ARN of the HTTPS listener"
  value       = var.certificate_arn != "" ? aws_lb_listener.https[0].arn : null
}

output "api_target_group_arn" {
  description = "ARN of the API target group"
  value       = aws_lb_target_group.api.arn
}

output "web_target_group_arn" {
  description = "ARN of the web target group"
  value       = aws_lb_target_group.web.arn
}