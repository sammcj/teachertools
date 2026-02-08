# Code Style and Conventions

## Language
- Australian English spelling throughout: `initialise`, `colour`, etc.

## JavaScript
- **Object literal pattern** for modules (e.g. `const StorageManager = { ... }`)
- **JSDoc comments** on public methods with `@param` and `@returns` tags
- **camelCase** for variables, functions, and methods
- **PascalCase** for module/object names (StorageManager, GroupThing, TeacherData)
- **DOMContentLoaded** listener wraps all UI initialisation code
- No ES modules (`import`/`export`) - all scripts loaded via `<script>` tags in HTML
- No `var` usage - `const` and `let` only
- Template literals for string interpolation
- Arrow functions for callbacks

## CSS
- **CSS custom properties** (variables) defined in `:root` for theming
- **BEM-ish naming** with kebab-case class names (e.g. `class-list-container`, `section-header`)
- Pastel colour palette with 8 group colours
- Font stack: Open Sans (body), Montserrat (headings), Quicksand (accents)

## HTML
- Semantic HTML5 elements (`<header>`, `<main>`, `<section>`)
- IDs for JS-targeted elements, classes for styling
- Some inline styles present (particularly in `main.html` and `groupthing.html`)

## File Organisation
- Data layer (`storage.js`) is separate from business logic (`common.js`, `teacher-data.js`)
- UI code (`teacher-ui.js`, `student.js`) is separate from data
- Shared styles in `styles.css`, page-specific styles in dedicated files
