# Task Completion Checklist

Since there is no build system, linter, or automated test suite, use the following manual checks after completing a task:

1. **Syntax check**: Ensure no JavaScript syntax errors by opening the browser console
2. **Cross-page consistency**: If changing shared files (storage.js, common.js, styles.css), verify both teacher and student views still work
3. **LocalStorage compatibility**: If changing data structures, ensure backward compatibility or provide migration
4. **Responsive**: Check changes work on mobile viewport if touching CSS/layout
5. **No hardcoded data**: Ensure no test data or debug logs are left in code
6. **Australian English**: Use Australian English spelling in all user-facing text and code comments
7. **Script load order**: If adding new JS files, ensure correct load order in HTML (storage.js -> common.js -> page-specific scripts)
8. **CSS variables**: Use existing CSS custom properties rather than hardcoded colour values
