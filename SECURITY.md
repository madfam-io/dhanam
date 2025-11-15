# Security Policy

## Overview

Security is a top priority for the Dhanam Ledger project. We take the security of our users' financial data very seriously and appreciate the efforts of security researchers and users who help us maintain a secure platform.

This document outlines our security policy, including how to report vulnerabilities, our security practices, and what to expect when working with us on security issues.

---

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| 1.x.x   | :white_check_mark: | Active development |
| < 1.0   | :x:                | Beta - not recommended for production |

---

## Reporting a Vulnerability

We encourage responsible disclosure of security vulnerabilities. If you discover a security issue, please follow these guidelines:

### How to Report

**Please DO NOT create a public GitHub issue for security vulnerabilities.**

Instead, report security issues privately through one of these channels:

1. **Email**: Send detailed information to [security@dhanam.io](mailto:security@dhanam.io)
2. **GitHub Security Advisories**: Use the [private vulnerability reporting feature](https://github.com/madfam-io/dhanam/security/advisories/new)

### What to Include

When reporting a vulnerability, please include:

- **Description**: Clear description of the vulnerability
- **Impact**: Potential impact and severity assessment
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Proof of Concept**: Code, screenshots, or videos demonstrating the vulnerability
- **Affected Components**: Which parts of the system are affected
- **Suggested Fix**: If you have recommendations for remediation
- **Your Contact Information**: How we can reach you for follow-up

### Example Report Template

```
Subject: [SECURITY] Brief description of the vulnerability

Description:
[Detailed description of the vulnerability]

Impact:
[What could an attacker do with this vulnerability?]

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Proof of Concept:
[Code, screenshots, or detailed explanation]

Affected Components:
- Component A
- Component B

Suggested Fix:
[Your recommendations, if any]

Contact:
Name: [Your name]
Email: [Your email]
```

---

## Response Timeline

We are committed to responding to security reports promptly:

| Timeline | Action |
|----------|--------|
| **24 hours** | Initial acknowledgment of your report |
| **72 hours** | Preliminary assessment and severity classification |
| **7 days** | Detailed response with remediation plan |
| **30 days** | Fix deployed to production (for critical issues) |
| **90 days** | Public disclosure (coordinated with reporter) |

**Note**: Timeline may vary based on the complexity and severity of the issue.

---

## Severity Classification

We use the following severity levels based on CVSS v3.1:

| Severity | CVSS Score | Description | Example |
|----------|------------|-------------|---------|
| **Critical** | 9.0-10.0 | Requires immediate action | Remote code execution, authentication bypass |
| **High** | 7.0-8.9 | Requires urgent attention | SQL injection, privilege escalation |
| **Medium** | 4.0-6.9 | Should be addressed soon | XSS, CSRF, information disclosure |
| **Low** | 0.1-3.9 | Can be scheduled | Minor information leaks, low-impact issues |

---

## Security Best Practices

### For Contributors

When contributing to Dhanam Ledger, please follow these security practices:

1. **Never commit secrets**: No API keys, passwords, or tokens in code
2. **Validate all inputs**: Use proper validation and sanitization
3. **Follow secure coding practices**: Reference our [CONTRIBUTING.md](./CONTRIBUTING.md)
4. **Keep dependencies updated**: Regularly update npm packages
5. **Write security tests**: Include tests for authentication, authorization, and input validation

### For Deployers

When deploying Dhanam Ledger:

1. **Set strong secrets**: Generate cryptographically secure random values for all secrets
2. **Enable all security features**: Helmet, CORS, rate limiting must be enabled
3. **Use HTTPS**: Never deploy without TLS/SSL certificates
4. **Configure WAF**: Use AWS WAF or similar for production deployments
5. **Enable audit logging**: Monitor all sensitive operations
6. **Implement backup encryption**: Encrypt all backups at rest
7. **Regular security updates**: Keep all dependencies and infrastructure updated

---

## Security Features

Dhanam Ledger implements multiple layers of security:

### Authentication & Authorization

- **JWT Tokens**: Short-lived access tokens (15 minutes)
- **Refresh Tokens**: Rotating refresh tokens (30 days max)
- **2FA/TOTP**: Optional two-factor authentication using TOTP
- **Password Hashing**: Argon2id with 64MB memory cost
- **Session Management**: Secure session handling with Redis

### Data Protection

- **Encryption at Rest**: AES-256-GCM for sensitive data
- **Encryption in Transit**: TLS 1.2+ for all communications
- **Database Encryption**: PostgreSQL encryption for data at rest
- **Provider Token Encryption**: All third-party API tokens encrypted with AWS KMS

### Infrastructure Security

- **Security Headers**: Helmet.js with CSP, X-Frame-Options, etc.
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents brute-force and DoS attacks
- **Input Validation**: Strict validation with class-validator
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **Audit Logging**: Comprehensive logging of sensitive operations

### Webhook Security

- **HMAC Verification**: All provider webhooks verified with HMAC-SHA256
- **Timing-Safe Comparison**: Prevents timing attacks on signature verification
- **Replay Protection**: Webhook timestamps and idempotency

---

## Known Security Considerations

### Current Limitations

1. **AWS KMS Integration**: Provider token encryption with AWS KMS is documented but requires AWS setup
2. **WAF Configuration**: Web Application Firewall setup is optional but recommended for production
3. **Backup Encryption**: Automated backup encryption requires additional configuration

### Planned Improvements

- [ ] Implement automated security scanning in CI/CD
- [ ] Add Dependabot for automated dependency updates
- [ ] Implement IP allowlisting for admin operations
- [ ] Add security event monitoring and alerting
- [ ] Implement automated certificate rotation

---

## Security Audit History

| Date | Auditor | Scope | Findings | Status |
|------|---------|-------|----------|--------|
| 2025-11-15 | Internal | Comprehensive codebase audit | 29 critical issues | Fixed |
| TBD | External | Third-party security audit | - | Planned |

---

## Disclosure Policy

### Our Commitment

- We will work with you to understand and validate the vulnerability
- We will keep you informed about our progress
- We will credit you in our security advisories (unless you prefer to remain anonymous)
- We will not take legal action against researchers who follow this policy

### Coordinated Disclosure

- We prefer a 90-day disclosure timeline
- We will coordinate public disclosure with you
- We may request additional time for complex issues
- We will publish a security advisory when the fix is deployed

---

## Bug Bounty Program

**Status**: Currently not available

We are considering implementing a bug bounty program in the future. For now, we deeply appreciate voluntary security research and will acknowledge all contributors in our security advisories.

---

## Security Hall of Fame

We recognize the following security researchers for their responsible disclosure:

*Coming soon - be the first to contribute!*

---

## Contact Information

- **Security Email**: security@dhanam.io
- **General Contact**: hello@dhanam.io
- **GitHub Security**: [Report a vulnerability](https://github.com/madfam-io/dhanam/security/advisories/new)

**PGP Key**: Coming soon

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

## Legal

This security policy is provided in good faith. We reserve the right to modify this policy at any time. Security researchers who follow this policy will be working with us in good faith and will not face legal consequences for their security research.

---

**Last Updated**: November 15, 2025
**Policy Version**: 1.0.0
