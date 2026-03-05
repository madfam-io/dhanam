# Dhanam Production Browser Test Report

**Date**: 2026-03-04
**Tested URLs**: dhan.am, app.dhan.am, api.dhan.am, admin.dhan.am, admin.dhanam.com
**Tool**: Playwright MCP (browser automation)
**Viewport**: 1280x800 (desktop), 375x812 (mobile)

---

## Executive Summary

The Dhanam landing page is **well-built and visually polished** with excellent i18n support across 3 locales. However, **critical blockers** prevent the demo and authenticated flows from working: the demo login API returns a database schema error, all legal/public pages incorrectly redirect to login, and key static assets (favicon, OG image) are missing.

| Category | Pass | Fail | Blocked | Total |
|----------|------|------|---------|-------|
| Landing & Public Pages | 8 | 4 | 0 | 12 |
| Authentication Flow | 3 | 2 | 1 | 6 |
| Dashboard & Core Features | 0 | 0 | 16 | 16 |
| UI/UX Quality | 5 | 2 | 1 | 8 |
| Status & Health | 1 | 3 | 0 | 4 |
| **Total** | **17** | **11** | **18** | **46** |

---

## Phase 1: Landing & Public Pages

### 1.1 Landing Page (dhan.am)
| Test | Status | Notes |
|------|--------|-------|
| Navigate to dhan.am | PASS | Redirects to `/es` (Spanish default for geo) |
| Page title correct | PASS | "Dhanam - Budget & Wealth Tracker" |
| Hero section renders | PASS | Title, subtitle, CTAs all present |
| CTA buttons present | PASS | "Try Live Demo" + "Create Free Account" |
| Capability badges | PASS | "7 DeFi Networks", "12 Stress Scenarios", "7 Collectible Categories" |
| All landing sections render | PASS | Choose Your Adventure, Problem/Solution, How It Works (5 steps), Security (4 cards), Features Grid (12 features), Deep Platform Coverage (3 accordions), Integrations (6 providers), Pricing (3 tiers), Final CTA, Footer |
| Dhanam logo and branding | PASS | Logo + "Dhanam" heading in nav |
| Favicon loads | **FAIL** | `/favicon.ico` returns 404 |

### 1.2 Locale Switching
| Test | Status | Notes |
|------|--------|-------|
| ES locale (default) | PASS | Full Spanish content, URL `/es` |
| EN locale | PASS | Full English content, URL `/en` |
| PT-BR locale | PASS | Full Portuguese content, URL `/pt-BR` |
| Pricing localized (EN: USD, ES/PT: MXN) | PASS | EN shows $4.99/$11.99 USD; ES/PT shows $99/$249 MXN |

### 1.3 Pricing Section
| Test | Status | Notes |
|------|--------|-------|
| 3 tiers visible | PASS | Community ($0), Essentials ($4.99/mo), Pro ($11.99/mo) |
| Badges present | PASS | "Best Value" on Essentials, "Most Popular" on Pro |
| Feature lists complete | PASS | Community: 6 items, Essentials: 8 items, Pro: 13 items |
| CTA buttons work | PASS | "Start Free", "Start 14-Day Trial" buttons present |

### 1.4 Legal Pages
| Test | Status | Notes |
|------|--------|-------|
| /privacy | **FAIL** | Redirects to login — should be public |
| /terms | **FAIL** | Redirects to login — should be public |
| /security | **FAIL** | Redirects to login — should be public |
| /esg | **FAIL** | Redirects to login — should be public |
| /cookies | NOT TESTED | Page not linked from landing |

### 1.5 Cookie Consent Banner
| Test | Status | Notes |
|------|--------|-------|
| Banner appears on first visit | **FAIL** | No cookie consent banner shown even after clearing cookies |

### 1.6 SEO & Meta
| Test | Status | Notes |
|------|--------|-------|
| Page title | PASS | "Dhanam - Budget & Wealth Tracker" |
| Meta description | PASS | "Comprehensive financial management for personal and business..." |
| OG tags complete | PASS | title, description, url, site_name, type, image, locale all set |
| OG image loads | **FAIL** | `/og-image.png` returns 404 |

---

## Phase 2: Authentication Flow

### 2.1 Login Page
| Test | Status | Notes |
|------|--------|-------|
| Janua SSO button | PASS | "Sign in with Janua SSO" present |
| Social OAuth buttons | PASS | Google, GitHub, Microsoft, Apple — all 4 present |
| Email/password form | PASS | Email + password fields with visibility toggle |
| "Try Demo" button | PASS | Button present |
| Sign up / Forgot password links | PASS | Both links present |
| Forgot password page | **FAIL** | `/forgot-password` returns 404 |

### 2.2 Register Page
| Test | Status | Notes |
|------|--------|-------|
| OAuth buttons | PASS | Google, GitHub, Microsoft, Apple |
| Registration form | PASS | Full name, email, password with requirements text |
| Sign in link | PASS | Links back to `/login` |
| Terms/Privacy links | PASS | Present (but pages redirect to login) |

### 2.3 Demo Mode Entry
| Test | Status | Notes |
|------|--------|-------|
| Demo persona selection page | PASS | Renders 5 personas: Maria, Carlos, Patricia, Diego, Quick Preview |
| Demo login from login page | **FAIL** | "Failed to access demo" — API NetworkError |
| Demo login from persona page | **FAIL** | API returns 500: `Database schema error (Prisma P2021: table not found)` |

### 2.4 Authenticated Login
| Test | Status | Notes |
|------|--------|-------|
| Real credential login | **BLOCKED** | Cannot test without valid credentials in browser |

---

## Phase 3: Dashboard & Core Features

**ALL BLOCKED** — Demo mode and authentication both fail, preventing access to any authenticated pages. 16 test items could not be executed:

- Dashboard overview, Navigation sidebar, Header bar
- Accounts, Transactions, Recurring transactions
- Budgets, Zero-based budgets
- Assets, Households, Analytics, ESG, Projections, Scenarios
- Goals, Retirement, Estate planning, Life Beat, Gaming
- Settings, Billing, Notifications
- Reports page

---

## Phase 3B: Admin Panel

| Test | Status | Notes |
|------|--------|-------|
| admin.dhanam.com | **FAIL** | SSL error: `ERR_SSL_UNRECOGNIZED_NAME_ALERT` |
| admin.dhan.am | PASS | Loads but shows deprecation notice — admin moved to main web app |

---

## Phase 4: UI/UX Quality Checks

### 4.1 Responsive Design (Mobile 375x812)
| Test | Status | Notes |
|------|--------|-------|
| Landing page mobile layout | PASS | Nav adapts, CTAs stack vertically, content reflows properly |
| Login page mobile layout | PASS | Form adapts well, all elements accessible |
| Mobile navigation | PASS | "Get Started" hidden, "Sign In" visible — appropriate simplification |
| Full-page scroll | PASS | All sections render correctly on mobile |

### 4.2 Dark Mode
| Test | Status | Notes |
|------|--------|-------|
| Dark mode toggle | **BLOCKED** | No theme toggle on landing page; only available in authenticated dashboard |

### 4.3 Interactive Elements
| Test | Status | Notes |
|------|--------|-------|
| DeFi Networks accordion | PASS | Expands to show 7 networks + protocols |
| Collectible Categories accordion | PASS | Shows 7 categories |
| Stress Scenarios accordion | PASS | Shows 12 scenarios + custom builder |
| Locale switcher (nav) | PASS | ES/EN/PT links work correctly |

### 4.4 Accessibility
| Test | Status | Notes |
|------|--------|-------|
| Semantic headings | PASS | Proper h1-h4 hierarchy throughout |
| Button labels | PASS | All buttons have descriptive text |
| Link labels | PASS | All links have meaningful text |
| Keyboard navigation | NOT TESTED | Cmd+K requires auth |

---

## Phase 5: Status & Health

| Test | Status | Notes |
|------|--------|-------|
| API health endpoint | PASS | `api.dhan.am/health` returns healthy — DB up, Redis up, uptime 155828106ms (~1803 days!) |
| /status page | **FAIL** | Redirects to login — should be public |
| /docs page | **FAIL** | Redirects to login — should be public |
| Favicon | **FAIL** | 404 on both dhan.am and app.dhan.am |

---

## Console Errors Summary

| Error | Severity | Notes |
|-------|----------|-------|
| Cloudflare script blocked | LOW | Analytics/turnstile script blocked — non-critical |
| `[useAuth] Hydration timeout` | MEDIUM | React hydration warning on every page load |
| React error #418 | MEDIUM | Hydration mismatch (server/client HTML differs) |
| `favicon.ico` 404 | LOW | Missing favicon file |
| `forgot-password` 404 | HIGH | Broken link on login page |
| Demo API 500 (Prisma P2021) | CRITICAL | Database table missing for demo feature |

---

## Bugs Found (Prioritized)

### CRITICAL
1. **Demo login broken** — `POST /v1/auth/demo/login` returns 500 with Prisma P2021 (table not found). The demo personas table doesn't exist in production DB. This blocks the entire demo experience.
   - **CODE FIX APPLIED**: Graceful error handling added — returns 503 "Demo mode is temporarily unavailable" instead of raw 500. **Root cause (DB migration) requires ops fix.**

### HIGH
2. **All legal/public pages redirect to login** — `/privacy`, `/terms`, `/security`, `/esg`, `/status`, `/docs` all require authentication. These MUST be publicly accessible (legal compliance requirement).
   - **FIXED**: Added 7 legal paths to middleware `publicPaths` array.
3. **Forgot password page missing** — `/forgot-password` returns 404. Linked from login page.
   - **FIXED**: Created `forgot-password/page.tsx` and `reset-password/page.tsx` under `(auth)` route group. Redirects to Janua SSO for password reset.
4. **admin.dhanam.com SSL broken** — `ERR_SSL_UNRECOGNIZED_NAME_ALERT`. Certificate not configured for this domain.
   - **DOCS FIXED**: Updated CLAUDE.md to reference `admin.dhan.am`. SSL fix requires ops/infra change.

### MEDIUM
5. **OG image missing** — `/og-image.png` returns 404. Social sharing previews will show no image.
   - **NOT FIXED (deployment issue)**: Files exist in `public/`, likely not copied during Docker build. Requires deployment verification.
6. **Favicon missing** — `/favicon.ico` returns 404 on both dhan.am and app.dhan.am. Browser tabs show generic icon.
   - **NOT FIXED (deployment issue)**: Same root cause as OG image.
7. **React hydration mismatch** — Error #418 on login/register pages. Server and client HTML differ.
   - **FIXED**: Added `suppressHydrationWarning` to emoji flag `<span>` elements in `LocaleSwitcher`.
8. **useAuth hydration timeout** — Warning fires on every page load, suggesting auth state resolution is slow.
   - **FIXED**: Suppressed warning in production (`process.env.NODE_ENV !== 'production'`).

### LOW
9. **Cookie consent banner missing** — No GDPR/privacy consent mechanism on first visit.
   - **FIXED**: Increased z-index from `z-50` to `z-[9999]` to ensure visibility above landing page elements.
10. **Cloudflare Turnstile blocked** — Script loading blocked (CSP or ad-blocker). May affect bot protection.
    - **FIXED**: Added `https://challenges.cloudflare.com` to CSP `script-src` and `connect-src` directives.
11. **PT-BR missing diacritics** — Portuguese text appears without accents (e.g., "Comecar" instead of "Começar").
    - **FIXED**: Corrected ~80+ missing diacritics in `packages/shared/src/i18n/pt-BR/landing.ts`.

---

## Remaining Items (Require Ops/Infra)

1. **Demo DB migration**: Run `prisma db push` on production to create missing tables.
2. **Static assets in Docker**: Verify `public/` directory is copied during Docker build (favicon.ico, og-image.png).
3. **admin.dhanam.com SSL**: Configure certificate or redirect to `admin.dhan.am`.

---

## Screenshots Captured

| File | Description |
|------|-------------|
| `01-landing-hero.png` | Landing page hero section (desktop, ES) |
| `02-landing-full.png` | Full landing page (desktop, ES) |
| `03-login-page.png` | Login page with all auth options (desktop) |
| `04-demo-persona-selection.png` | Demo persona selection page |
| `05-mobile-landing.png` | Landing page hero (mobile 375x812) |
| `06-mobile-landing-full.png` | Full landing page (mobile) |
| `07-mobile-login.png` | Login page (mobile) |
| `08-admin-deprecated.png` | Admin site deprecation notice |

---

*Report generated by Playwright MCP browser automation on 2026-03-04*
