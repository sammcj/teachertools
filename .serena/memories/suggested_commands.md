# Suggested Commands

## Development
This is a static site with no build system. To develop:

```bash
# Serve locally (any static file server works)
python3 -m http.server 8000
# Then open http://localhost:8000 in a browser
```

## Deployment
Deployment is automatic via GitHub Actions on push to `main` branch.
The workflow is at `.github/workflows/deploy.yml` and deploys to GitHub Pages.

```bash
# Manual deploy trigger (if needed)
gh workflow run deploy.yml
```

## Testing
There is no automated test suite. Manual testing:
- Open `test-groups.html` in a browser for group generation tests
- Open `index.html` for the full application

## Git
```bash
git status
git diff
git log --oneline -10
```

## System Utilities (macOS/Darwin)
```bash
ls -la          # List files
find . -name "*.js"  # Find files
grep -r "pattern" js/  # Search in files
open index.html  # Open in default browser
```

## No Linting/Formatting
There are currently no linting or formatting tools configured for this project.
