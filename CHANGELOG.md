# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Golden-ratio design token system for UI consistency

### Fixed
- RangeError in Bitso webhook signature verification

## [0.2.0] - 2025-01-24

### Added

#### AI-Driven Categorization
- Machine learning-based transaction categorization with learning loop
- Fuzzy matching with Levenshtein distance for merchant normalization
- User correction aggregator with weighted scoring
- Nightly ML retrain processor via BullMQ
- Category correction API endpoints

#### DeFi/Web3 Portfolio Tracking
- Zapper API integration for DeFi position tracking
- Support for 10+ protocols: Uniswap V2/V3, Aave V2/V3, Compound, Curve, Lido, Yearn, Maker, Convex, Balancer, SushiSwap
- Multi-chain support: Ethereum, Polygon, Arbitrum, Optimism, Base, Avalanche, BSC
- Position types: liquidity-pool, lending, borrowing, staking, farming, vault
- Net worth integration with protocol-level breakdown

#### Life Beat Dead Man's Switch
- 30/60/90 day escalation system for estate planning
- Configurable check-in intervals (weekly, biweekly, monthly)
- Designated executor notification workflow
- Emergency access grants for beneficiaries
- Integration with existing estate planning module

#### Zillow Real Estate Integration
- Address lookup and property search API
- Automated Zestimate valuations for real estate assets
- Historical valuation trends from Zillow
- Auto-update manual asset values via cron job

#### Long-Term Cashflow Projections
- 10-30 year projection engine for retirement planning
- Monte Carlo simulation integration (existing package)
- Life event timeline modeling (retirement, college, home purchase)
- Income growth and inflation assumptions
- What-if scenario analysis with comparison views

#### Yours/Mine/Ours Views
- Ownership filtering for household accounts
- Net worth breakdown by ownership type
- Multi-member household financial separation
- Asset assignment interface

#### Document Upload to R2
- Cloudflare R2 storage integration for asset attachments
- Presigned URL generation for secure uploads
- Support for appraisals, deeds, certificates, purchase agreements
- Document metadata and categorization

#### Enhanced Analytics & Reporting
- New chart components: net worth trends, income/expense, spending breakdown, portfolio allocation
- Excel export alongside existing CSV/PDF formats
- Scheduled report email delivery (weekly, monthly)
- Connection health monitoring with 15-minute cron checks
- Provider status dashboard with error messages and rate limiting info

### Changed
- Upgraded categorization engine to use ML-first approach with rule fallback
- Enhanced wealth dashboard with DeFi positions integration
- Improved estate planning module with Life Beat section

### Technical
- Added `@dhanam/defi-adapter` package for Zapper integration
- New BullMQ queues: `ml-retrain`, `life-beat-check`, `zillow-valuation`
- R2 storage configuration in infrastructure
- Extended manual assets API for Zillow and document uploads

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
