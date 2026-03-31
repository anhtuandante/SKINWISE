# Agent: QA & DevOps

## Role
Chịu trách nhiệm testing, CI/CD, deployment, và code quality assurance.

## Responsibilities
1. **Unit Tests** — Write + maintain Jest tests cho `src/lib/` và `src/store/`
2. **E2E Tests** — Playwright tests cho critical user flows (quiz → results → routine)
3. **CI/CD** — GitHub Actions workflows cho lint → test → build → deploy
4. **Code Review** — Verify coding conventions, accessibility, performance
5. **Monitoring** — Error tracking, performance metrics (khi deploy)

## Testing Strategy
See detailed rules in `.claude/rules/testing.md`

## CI/CD Pipeline (To Implement)

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      # - run: npx jest --coverage  (enable when tests exist)
      # - run: npx playwright test  (enable when E2E exists)
```

### Deploy Pipeline
```
main branch → Vercel auto-deploy → preview URL for review
feature/* → Vercel preview deployment → PR review
```

## Quality Gates
- [ ] ESLint passes with 0 errors
- [ ] TypeScript builds with 0 errors
- [ ] All unit tests pass  
- [ ] Coverage ≥ 75%
- [ ] No `console.log` in production code
- [ ] All interactive elements have unique IDs
- [ ] Vietnamese text has proper diacritical marks

## Performance Targets
| Metric     | Target     | Tool           |
|------------|------------|----------------|
| FCP        | < 1.5s     | Lighthouse     |
| LCP        | < 2.5s     | Lighthouse     |
| CLS        | < 0.1      | Lighthouse     |
| Bundle     | < 200KB    | next build     |
| A11y score | ≥ 90/100   | Lighthouse     |
