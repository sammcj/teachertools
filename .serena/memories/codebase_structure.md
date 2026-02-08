# Codebase Structure

## HTML Pages
- `index.html` - Landing page with welcome banner
- `main.html` - Teacher tools hub with tabbed interface
- `groupthing.html` - Teacher view for GroupThing (class lists, grouping rules, group generation)
- `student.html` - Student view (read-only, displays generated groups with confetti)
- `test-groups.html` - Manual test page for group generation logic

## JavaScript (`js/`)
- `storage.js` - `StorageManager` object: LocalStorage CRUD, export/import, data versioning
- `common.js` - `GroupThing` object: shared utilities (group generation algorithm, URL params, emoji names, validation)
- `teacher-data.js` - `TeacherData` object: teacher-side data operations (wraps StorageManager for teacher use cases)
- `teacher-ui.js` - Teacher UI: DOM event handlers, drag-and-drop, modals, UI rendering (wrapped in DOMContentLoaded)
- `student.js` - Student UI: group display, confetti animation, responsive layout
- `responsive.js` - Responsive helpers: collapsible sections, mobile viewport height

## CSS (`css/`)
- `styles.css` - Global styles, CSS custom properties (colour theme), base typography
- `main.css` - Styles for `main.html` (tabbed layout)
- `teacher.css` - Teacher view specific styles
- `student.css` - Student view specific styles
- `responsive.css` - Media queries for responsive layout
- `fonts.css` - @font-face declarations

## Other
- `fonts/` - Local web font files (woff/woff2)
- `.github/workflows/deploy.yml` - GitHub Actions deployment to GitHub Pages
- `.vscode/settings.json` - VS Code Peacock colour settings
- `.serena/` - Serena configuration

## Architecture Pattern
The JS uses an **object literal / module pattern** (not ES6 classes):
- `StorageManager` - data persistence layer
- `GroupThing` - shared business logic
- `TeacherData` - teacher-specific data operations (uses StorageManager internally)
- UI code runs inside `DOMContentLoaded` callbacks with locally scoped functions
