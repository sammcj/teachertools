# Deployment Guide

## Quick Start

The application is a static site with no build process required. Simply deploy the `v2` directory to any static hosting service.

## GitHub Pages Deployment

### Option 1: Deploy v2 folder directly

1. Copy all files from `/v2/` to the root of your repository
2. Commit and push to the `main` branch
3. GitHub Pages will automatically deploy

### Option 2: Deploy from v2 subfolder

1. Go to repository Settings → Pages
2. Set source to "Deploy from a branch"
3. Set branch to `main` and folder to `/v2`
4. Save

The site will be available at: `https://[username].github.io/[repo-name]/`

## Local Testing

Serve the v2 directory with any static server:

```bash
# Python 3
cd v2
python -m http.server 8000

# Node.js
npx serve v2

# PHP
php -S localhost:8000 -t v2
```

Then open: `http://localhost:8000`

## Pre-Deployment Checklist

- [x] All features implemented
- [x] Responsive design complete
- [x] Accessibility features included
- [x] Browser compatibility verified
- [x] LocalStorage working correctly
- [x] Export/Import tested
- [x] Student view privacy preserved
- [x] Animations optimised
- [x] Test page functional

## Files Structure

```
v2/
├── index.html               # Entry point (redirects to teacher.html)
├── teacher.html             # Main teacher interface
├── student.html             # Student display view
├── test.html                # Algorithm test page
├── README.md                # User documentation
├── DEPLOYMENT.md            # This file
├── styles/                  # CSS files
│   ├── variables.css        # Design tokens
│   ├── reset.css            # Modern CSS reset
│   ├── utilities.css        # Utility classes
│   ├── layout.css           # Layout system
│   ├── components.css       # UI components
│   └── student.css          # Student view specific
└── js/                      # JavaScript modules
    ├── storage.js           # LocalStorage management
    ├── groups.js            # Group generation algorithm
    ├── utils.js             # Helper utilities
    ├── teacher.js           # Teacher view controller
    └── student.js           # Student view controller
```

## Performance Notes

- Total size: ~50KB (excluding Animate.css CDN)
- No build process
- No JavaScript frameworks
- Optimised for offline use after first load
- Uses CDN for Animate.css (10KB) and Google Fonts

## Browser Cache

Recommended cache headers for production:

```
# HTML files - no cache
Cache-Control: no-cache

# CSS/JS files - cache for 1 year
Cache-Control: public, max-age=31536000, immutable
```

## Environment Variables

None required - fully static application.

## Post-Deployment Testing

1. Visit the deployed URL
2. Create a test class list
3. Add students
4. Generate groups
5. Verify student view works
6. Test export/import functionality
7. Test on mobile devices
8. Verify confetti animation in student view

## Troubleshooting

**Issue:** White screen on load
- Check browser console for errors
- Verify all files are uploaded correctly
- Check file paths are relative

**Issue:** LocalStorage not working
- Ensure HTTPS is enabled
- Check browser privacy settings
- Verify cookies are not blocked

**Issue:** Animations not working
- Verify Animate.css CDN is accessible
- Check network tab for 404 errors
- Ensure JavaScript is enabled

## Updates & Maintenance

To update the deployed site:

1. Make changes locally
2. Test thoroughly with `test.html`
3. Commit and push to repository
4. GitHub Pages will auto-deploy

## Rollback

If issues occur:

1. Revert the commit: `git revert HEAD`
2. Push: `git push origin main`
3. GitHub Pages will redeploy previous version