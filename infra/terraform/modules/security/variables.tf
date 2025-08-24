variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags for resources"
  type        = map(string)
}

variable "random_suffix" {
  description = "Random suffix for unique resource names"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret"
  type        = string
  sensitive   = true
}

variable "encryption_key" {
  description = "Encryption key"
  type        = string
  sensitive   = true
}

variable "belvo_credentials" {
  description = "Belvo API credentials"
  type = object({
    id       = string
    password = string
  })
  sensitive = true
}

variable "plaid_credentials" {
  description = "Plaid API credentials"
  type = object({
    client_id = string
    secret    = string
  })
  sensitive = true
}

variable "bitso_credentials" {
  description = "Bitso API credentials"
  type = object({
    api_key    = string
    api_secret = string
  })
  sensitive = true
}

variable "enable_waf" {
  description = "Enable WAF"
  type        = bool
  default     = true
}

variable "alb_arn" {
  description = "ALB ARN for WAF association"
  type        = string
  default     = ""
}