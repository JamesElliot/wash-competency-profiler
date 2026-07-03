# Deployment and Maintenance

## Current Hosting

- **Repository:** `JamesElliot/wash-competency-profiler`
- **Live site:** https://wash-competency-profiler.netlify.app
- **App type:** static Vite single-page application
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Routing:** `public/_redirects` rewrites all routes to `index.html`

## Standard Update Workflow

1. Create a local branch for the change.
2. Edit code or competency data.
3. Run:
   ```bash
   npm test
   npm run build
   ```
4. Review generated changes with:
   ```bash
   git diff
   git status
   ```
5. Commit and push to GitHub.
6. Confirm the Netlify deploy succeeds.
7. Smoke-test the live site, especially:
   - setup flow
   - questionnaire N/A behaviour
   - results categories
   - PDF export
   - Word export

## Competency Data Updates

The competency framework source for the app is:

```text
src/data/Competencies.csv
```

Required columns:

- `Code`
- `Domain`
- `Theme`
- `Sub-theme`
- `Competency activity`

Before deploying CSV changes, check:

- no empty `Code` values
- no duplicate `Code` values
- all code prefixes map to one of the six expected domains
- domain counts still make sense in the setup page
- existing competency IDs are preserved where possible, because saved browser sessions reference IDs

## Versioning

Framework and app metadata are centralised in:

```text
src/data/appContent.ts
```

Update this file when:

- the app version changes
- the framework version/date changes
- the final framework URL changes
- acknowledgement or disclaimer wording changes
- feedback links move from GitHub issues to another form

## Ownership Decisions Still Needed

- Whether the Netlify site should remain under James's account or move to an institutional account.
- Who approves competency framework wording changes before deployment.
- Whether classroom/pilot feedback should remain in GitHub issues or move to a non-GitHub form.
- Whether app and framework versions should follow formal semantic versioning.
