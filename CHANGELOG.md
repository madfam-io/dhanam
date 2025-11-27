# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Golden-ratio design token system for UI consistency

### Fixed
- RangeError in Bitso webhook signature verification

## [0.1.0] - 2024-11-27

### Added
- **Dhanam** - Personal Wealth Tracking Platform
- `/demo` route with interactive demo mode
- Multi-currency support (MXN, USD primary)
- ESG crypto scoring for sustainable investments
- Bank account integration via Belvo/Plaid
- Crypto exchange integration via Bitso
- Budget tracking with customizable rules
- Net worth calculation and trending
- Transaction categorization (auto + manual)
- Bilingual interface (Spanish/English)
- Janua OAuth integration for SSO
- React Native mobile app foundation

### Security
- JWT authentication with refresh tokens
- Two-factor authentication (2FA)
- AES-256 encryption for sensitive data
- Argon2id password hashing
- Row-level security in PostgreSQL

### Technical
- Next.js 14 with App Router
- PostgreSQL with Prisma ORM
- Redis for session management
- Swagger API documentation at `/docs`
- 80%+ test coverage target
- Docker containerization
- CI/CD with GitHub Actions

### LATAM Focus
- MXN as primary currency
- Mexican bank integrations
- Spanish-first localization
- Regional tax considerations
