resource "aws_ecr_repository" "api" {
  name                 = "${var.name_prefix}-api"
  image_tag_mutability = var.image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key        = var.kms_key_arn
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.name_prefix}-api"
    }
  )
}

resource "aws_ecr_repository" "web" {
  name                 = "${var.name_prefix}-web"
  image_tag_mutability = var.image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key        = var.kms_key_arn
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.name_prefix}-web"
    }
  )
}

# Lifecycle policies
resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Expire untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

resource "aws_ecr_lifecycle_policy" "web" {
  repository = aws_ecr_repository.web.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Expire untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Repository policies
data "aws_iam_policy_document" "ecr_policy" {
  statement {
    sid    = "AllowPull"
    effect = "Allow"

    principals {
      type = "AWS"
      identifiers = concat(
        var.allowed_principals,
        ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
      )
    }

    actions = [
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:BatchCheckLayerAvailability"
    ]
  }

  statement {
    sid    = "AllowPush"
    effect = "Allow"

    principals {
      type = "AWS"
      identifiers = concat(
        var.allowed_principals,
        ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
      )
    }

    actions = [
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload"
    ]
  }
}

resource "aws_ecr_repository_policy" "api" {
  repository = aws_ecr_repository.api.name
  policy     = data.aws_iam_policy_document.ecr_policy.json
}

resource "aws_ecr_repository_policy" "web" {
  repository = aws_ecr_repository.web.name
  policy     = data.aws_iam_policy_document.ecr_policy.json
}

data "aws_caller_identity" "current" {}