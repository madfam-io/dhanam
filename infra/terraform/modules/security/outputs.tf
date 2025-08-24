output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.main.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.main.arn
}

output "db_password_secret_arn" {
  description = "ARN of the database password secret"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "jwt_secret_arn" {
  description = "ARN of the JWT secret"
  value       = aws_secretsmanager_secret.jwt_secret.arn
}

output "encryption_key_secret_arn" {
  description = "ARN of the encryption key secret"
  value       = aws_secretsmanager_secret.encryption_key.arn
}

output "belvo_credentials_secret_arn" {
  description = "ARN of the Belvo credentials secret"
  value       = aws_secretsmanager_secret.belvo_credentials.arn
}

output "plaid_credentials_secret_arn" {
  description = "ARN of the Plaid credentials secret"
  value       = aws_secretsmanager_secret.plaid_credentials.arn
}

output "bitso_credentials_secret_arn" {
  description = "ARN of the Bitso credentials secret"
  value       = aws_secretsmanager_secret.bitso_credentials.arn
}

output "app_data_bucket_id" {
  description = "ID of the app data S3 bucket"
  value       = aws_s3_bucket.app_data.id
}

output "app_data_bucket_arn" {
  description = "ARN of the app data S3 bucket"
  value       = aws_s3_bucket.app_data.arn
}

output "waf_acl_arn" {
  description = "ARN of the WAF ACL"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].arn : null
}