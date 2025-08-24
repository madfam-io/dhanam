variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags for resources"
  type        = map(string)
}

variable "image_tag_mutability" {
  description = "Image tag mutability"
  type        = string
  default     = "MUTABLE"
}

variable "scan_on_push" {
  description = "Enable image scanning on push"
  type        = bool
  default     = true
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "allowed_principals" {
  description = "Additional AWS principals allowed to access ECR"
  type        = list(string)
  default     = []
}