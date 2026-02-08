# TeacherTools - Project Overview

## Purpose
"Emma's Teacher Tools" is a static web application for primary school teachers. The main feature is **GroupThing** - a tool for generating random student groups with constraints (incompatible pairs/blacklists). It has separate teacher and student views.

## Tech Stack
- **Vanilla HTML/CSS/JavaScript** - no frameworks, no build tools, no bundlers
- **Static site** deployed via **GitHub Pages** (GitHub Actions workflow on push to `main`)
- **LocalStorage** for data persistence (via `StorageManager` object)
- **Custom fonts**: Montserrat, Quicksand, Open Sans (served locally from `fonts/`)
- **CSS custom properties** for theming (pastel colour scheme)

## Key Features
- Create and manage multiple class lists
- Generate random student groups with configurable group size
- Define incompatible student pairs (blacklists) so they are never grouped together
- Export/import configuration as JSON
- Student view with confetti animation for group reveals
- Emoji-based group names (animal themes)
- Responsive design for mobile/tablet use
- Drag-and-drop list ordering

## No Build System
There is no `package.json`, no bundler, no test runner, no linting tool. The site is purely static HTML/CSS/JS served directly.
