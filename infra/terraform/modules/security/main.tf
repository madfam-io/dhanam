resource "aws_kms_key" "main" {
  description             = "${var.name_prefix} encryption key"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.name_prefix}-kms-key"
    }
  )
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.name_prefix}"
  target_key_id = aws_kms_key.main.key_id
}

# Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name        = "${var.name_prefix}-db-password"
  description = "Database password for ${var.name_prefix}"
  kms_key_id  = aws_kms_key.main.arn

  tags = var.common_tags
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.db_password
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name        = "${var.name_prefix}-jwt-secret"
  description = "JWT secret for ${var.name_prefix}"
  kms_key_id  = aws_kms_key.main.arn

  tags = var.common_tags
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = var.jwt_secret
}

resource "aws_secretsmanager_secret" "encryption_key" {
  name        = "${var.name_prefix}-encryption-key"
  description = "Encryption key for ${var.name_prefix}"
  kms_key_id  = aws_kms_key.main.arn

  tags = var.common_tags
}

resource "aws_secretsmanager_secret_version" "encryption_key" {
  secret_id     = aws_secretsmanager_secret.encryption_key.id
  secret_string = var.encryption_key
}

# Provider Credentials
resource "aws_secretsmanager_secret" "belvo_credentials" {
  name        = "${var.name_prefix}-belvo-credentials"
  description = "Belvo API credentials"
  kms_key_id  = aws_kms_key.main.arn

  tags = var.common_tags
}

resource "aws_secretsmanager_secret_version" "belvo_credentials" {
  secret_id = aws_secretsmanager_secret.belvo_credentials.id
  secret_string = jsonencode({
    id       = var.belvo_credentials.id
    password = var.belvo_credentials.password
  })
}

resource "aws_secretsmanager_secret" "plaid_credentials" {
  name        = "${var.name_prefix}-plaid-credentials"
  description = "Plaid API credentials"
  kms_key_id  = aws_kms_key.main.arn

  tags = var.common_tags
}

resource "aws_secretsmanager_secret_version" "plaid_credentials" {
  secret_id = aws_secretsmanager_secret.plaid_credentials.id
  secret_string = jsonencode({
    client_id = var.plaid_credentials.client_id
    secret    = var.plaid_credentials.secret
  })
}

resource "aws_secretsmanager_secret" "bitso_credentials" {
  name        = "${var.name_prefix}-bitso-credentials"
  description = "Bitso API credentials"
  kms_key_id  = aws_kms_key.main.arn

  tags = var.common_tags
}

resource "aws_secretsmanager_secret_version" "bitso_credentials" {
  secret_id = aws_secretsmanager_secret.bitso_credentials.id
  secret_string = jsonencode({
    api_key    = var.bitso_credentials.api_key
    api_secret = var.bitso_credentials.api_secret
  })
}

# S3 Bucket for application data
resource "aws_s3_bucket" "app_data" {
  bucket = "${var.name_prefix}-app-data-${var.random_suffix}"

  tags = merge(
    var.common_tags,
    {
      Name = "${var.name_prefix}-app-data"
    }
  )
}

resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# WAF for ALB protection
resource "aws_wafv2_web_acl" "main" {
  count = var.enable_waf ? 1 : 0

  name  = "${var.name_prefix}-waf"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-common-rules"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.name_prefix}-waf"
    sampled_requests_enabled   = true
  }

  tags = var.common_tags
}

resource "aws_wafv2_web_acl_association" "main" {
  count = var.enable_waf ? 1 : 0

  resource_arn = var.alb_arn
  web_acl_arn  = aws_wafv2_web_acl.main[0].arn
}