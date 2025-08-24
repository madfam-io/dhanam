variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "Number of availability zones"
  type        = number
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway"
  type        = bool
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway"
  type        = bool
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "common_tags" {
  description = "Common tags for resources"
  type        = map(string)
}