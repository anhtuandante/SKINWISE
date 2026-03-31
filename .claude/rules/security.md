# Security Rules

## NEVER Do These

### Data & Privacy
- ❌ NEVER store sensitive user data (email, phone, real name) in localStorage
- ❌ NEVER add real affiliate tracking URLs — demo Shopee links only
- ❌ NEVER commit `.env` files or API keys
- ❌ NEVER use `eval()`, `dangerouslySetInnerHTML` without sanitization, or `new Function()`
- ❌ NEVER embed third-party scripts without review (tracking pixels, ads, etc.)

### Git & Deployment
- ❌ NEVER `git push --force` to main/production
- ❌ NEVER delete or reset production deployment artifacts
- ❌ NEVER merge directly to main without build check passing
- ❌ NEVER expose internal file paths or error stack traces to users

### External Links
- ✅ ALWAYS use `rel="noopener noreferrer"` on `target="_blank"` links
- ✅ ALWAYS validate URLs before rendering as links
- ✅ ALWAYS use `https://` for external resources (fonts, CDNs)

## Dependency Security
- Run `npm audit` before adding new dependencies
- Prefer well-maintained packages with >1000 weekly downloads
- Pin major versions in package.json (e.g., `"next": "14.2.35"` not `"next": "^14"`)
- Review changelogs before major version bumps

## Content Security
- All product data is static JSON — no user-generated content risk currently
- If adding user reviews/comments in future: MUST sanitize with DOMPurify
- If adding authentication in future: MUST use NextAuth.js or Supabase Auth, never roll custom

## Environment Variables (When Needed)
```
.env.local          — Local development (gitignored)
.env.production     — Production values (set in Vercel dashboard)
```

Naming convention: `NEXT_PUBLIC_*` for client-side, plain `*` for server-side only.
