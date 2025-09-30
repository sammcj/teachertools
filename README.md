# Emma's Teacher Tools - GroupThing

A simple, elegant web application for primary school teachers to create and manage student groups.

## Features

- **Multiple Class Lists:** Manage several classes with separate student rosters
- **Smart Group Generation:** Randomly distribute students into groups with intelligent algorithms
- **Grouping Rules:** Define students who cannot be grouped together
- **Flexible Group Sizes:** Choose any group size from 1-15 students
- **Fun Group Names:** Toggle between emoji animal names or numbered groups
- **Student View:** Clean, projection-friendly display for sharing with students
- **Data Persistence:** All data stored locally in your browser
- **Export/Import:** Backup and restore your configuration

## Getting Started

### Using the App

1. Open `index.html` in your browser or visit the deployed URL
2. Click "New List" to create your first class list
3. Add your students (one per line for bulk adding)
4. Set your preferred group size with the slider
5. Click "Generate Groups" to create random groups
6. Switch to "Student View" to display groups for your class

### Privacy & Data

- All data is stored locally in your browser's LocalStorage
- No data leaves your device or is sent to any server
- Remember to export your configuration regularly as a backup
- Clearing browser data will erase all saved class lists

## Technical Details

Built with:
- Vanilla JavaScript (no frameworks)
- Modern CSS (Grid, Flexbox, Custom Properties)
- Animate.css for delightful animations
- LocalStorage for data persistence

### File Structure

```
v2/
├── index.html           # Entry point
├── teacher.html         # Teacher interface
├── student.html         # Student display
├── styles/
│   ├── variables.css    # Design tokens
│   ├── reset.css        # CSS reset
│   ├── utilities.css    # Utility classes
│   ├── layout.css       # Layout styles
│   ├── components.css   # Component styles
│   └── student.css      # Student view styles
└── js/
    ├── storage.js       # LocalStorage operations
    ├── groups.js        # Group generation algorithm
    ├── utils.js         # Helper functions
    ├── teacher.js       # Teacher view controller
    └── student.js       # Student view controller
```

## Browser Support

Works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Development

No build process required. Simply open `index.html` in a browser.

For local development:
```bash
# Serve with any static server
python -m http.server 8000
# or
npx serve
```

## License

Created for Emma with ❤️

## Version

2.0.0 - Complete rewrite with modern CSS and improved UX