# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

We take the security of User Flow Library seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Email your findings to the repository maintainers
3. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Response Time**: We aim to acknowledge your report within 48 hours
- **Updates**: We will keep you informed about the progress of fixing the vulnerability
- **Credit**: If you wish, we will credit you in the release notes when the fix is published

## Security Best Practices for Users

### Environment Variables

**Never commit these to your repository:**
- `CLERK_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLERK_WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- Any `.env*` files

Always use environment variables for sensitive data. See [docs/reference/environment-variables.md](docs/reference/environment-variables.md) for details.

### Database Security

- Use Row Level Security (RLS) policies in Supabase
- Never expose your `SUPABASE_SERVICE_ROLE_KEY` to the browser
- Regularly review your RLS policies with `docs/how-to/security-update-guide.md`

### Authentication

- Enable multi-factor authentication in Clerk for production
- Regularly rotate webhook secrets
- Use separate Clerk instances for development and production

### API Keys

- Use separate API keys for development and production
- Rotate keys regularly
- Set appropriate rate limits on your API providers

### Webhooks

- Always verify webhook signatures (we use Svix for Clerk webhooks)
- Use HTTPS-only endpoints in production
- Keep `CLERK_WEBHOOK_SECRET` secure

### Storage

- Review Supabase Storage policies regularly
- Ensure public buckets only contain non-sensitive data
- Use signed URLs for private content

## Known Security Considerations

### Public Data

The following environment variables are intentionally exposed to the browser:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

These are protected by RLS policies and are safe to expose.

### CORS Configuration

The Python service (`python-service/main.py`) uses `allow_origins=["*"]` for CORS. In production, configure this to only allow your domain:

```python
allow_origins=["https://your-domain.com"],
```

## Security Updates

We monitor our dependencies for security vulnerabilities using:
- GitHub Dependabot
- npm audit / pnpm audit

Run `pnpm audit` regularly to check for vulnerabilities in dependencies.

## Disclosure Policy

- We follow responsible disclosure principles
- Security patches will be released as soon as possible
- We will publish a security advisory for critical vulnerabilities

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Supabase Security Guidelines](https://supabase.com/docs/guides/auth/row-level-security)
- [Clerk Security Overview](https://clerk.com/docs/security)

---

**Last Updated**: November 2024



